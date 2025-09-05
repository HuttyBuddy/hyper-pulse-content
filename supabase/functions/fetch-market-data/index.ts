import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get RentCast API key
    const rentcastApiKey = Deno.env.get('RENTCAST_API_KEY');
    if (!rentcastApiKey) {
      console.error('RENTCAST_API_KEY not found');
      return new Response(JSON.stringify({ error: 'RentCast API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { neighborhood, county, state, neighborhood_slug } = await req.json();
    console.log('Fetching data for:', { neighborhood, county, state, neighborhood_slug });

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    // Create location string for RentCast API
    const locationString = `${neighborhood}, ${county}, ${state}`;
    console.log('Location string:', locationString);

    // Fetch market statistics from RentCast
    const rentcastUrl = `https://api.rentcast.io/v1/markets/statistics?address=${encodeURIComponent(locationString)}`;
    console.log('RentCast API URL:', rentcastUrl);

    const rentcastResponse = await fetch(rentcastUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': rentcastApiKey,
        'Accept': 'application/json',
      },
    });

    console.log('RentCast response status:', rentcastResponse.status);

    if (!rentcastResponse.ok) {
      const errorText = await rentcastResponse.text();
      console.error('RentCast API error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch market data', 
        details: errorText 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rentcastData = await rentcastResponse.json();
    console.log('RentCast data received:', JSON.stringify(rentcastData, null, 2));

    // Process RentCast data and map to our database schema
    const processedData = {
      neighborhood_data: {
        median_sale_price: rentcastData.medianPrice || null,
        avg_price_per_sqft: rentcastData.pricePerSqft || null,
        days_on_market: rentcastData.daysOnMarket || null,
        active_listings: rentcastData.activeListings || null,
        new_listings: rentcastData.newListings || null,
        closed_sales: rentcastData.soldCount || null,
        months_of_inventory: rentcastData.monthsOfSupply || null,
        mom_change: {
          price: rentcastData.monthOverMonth?.priceChange || 0,
          dom: rentcastData.monthOverMonth?.daysOnMarketChange || 0,
          inventory: rentcastData.monthOverMonth?.inventoryChange || 0
        },
        yoy_change: {
          price: rentcastData.yearOverYear?.priceChange || 0,
          dom: rentcastData.yearOverYear?.daysOnMarketChange || 0,
          inventory: rentcastData.yearOverYear?.inventoryChange || 0
        },
        sources: ['RentCast API']
      }
    };

    // Save to database - neighborhood data
    const reportDate = new Date().toISOString().slice(0, 10);
    const { error: neighborhoodInsertError } = await supabase
      .from('market_reports')
      .upsert({
        user_id: user.id,
        location_type: 'neighborhood',
        neighborhood: neighborhood,
        neighborhood_slug: neighborhood_slug || neighborhood.toLowerCase().replace(/\s+/g, '-'),
        county: county,
        state: state,
        report_date: reportDate,
        median_sale_price: processedData.neighborhood_data.median_sale_price,
        avg_price_per_sqft: processedData.neighborhood_data.avg_price_per_sqft,
        days_on_market: processedData.neighborhood_data.days_on_market,
        active_listings: processedData.neighborhood_data.active_listings,
        new_listings: processedData.neighborhood_data.new_listings,
        closed_sales: processedData.neighborhood_data.closed_sales,
        months_of_inventory: processedData.neighborhood_data.months_of_inventory,
        mom_change: processedData.neighborhood_data.mom_change,
        yoy_change: processedData.neighborhood_data.yoy_change,
        sources: processedData.neighborhood_data.sources,
        retrieved_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,location_type,neighborhood_slug,county,state,report_date'
      });

    if (neighborhoodInsertError) {
      console.error('Error inserting neighborhood data:', neighborhoodInsertError);
    } else {
      console.log('Successfully saved neighborhood data');
    }

    // Fetch county-level data with a broader search
    const countyLocationString = `${county}, ${state}`;
    const countyRentcastUrl = `https://api.rentcast.io/v1/markets/statistics?address=${encodeURIComponent(countyLocationString)}`;
    
    try {
      const countyResponse = await fetch(countyRentcastUrl, {
        method: 'GET',
        headers: {
          'X-Api-Key': rentcastApiKey,
          'Accept': 'application/json',
        },
      });

      if (countyResponse.ok) {
        const countyData = await countyResponse.json();
        console.log('County data received:', JSON.stringify(countyData, null, 2));

        // Save county data
        const { error: countyInsertError } = await supabase
          .from('market_reports')
          .upsert({
            user_id: user.id,
            location_type: 'county',
            county: county,
            state: state,
            report_date: reportDate,
            avg_price_per_sqft: countyData.pricePerSqft || null,
            days_on_market: countyData.daysOnMarket || null,
            sources: ['RentCast API'],
            retrieved_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,location_type,county,state,report_date'
          });

        if (countyInsertError) {
          console.error('Error inserting county data:', countyInsertError);
        } else {
          console.log('Successfully saved county data');
        }
      }
    } catch (countyError) {
      console.error('County data fetch failed:', countyError);
      // Continue without county data
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: processedData,
      message: 'Market data updated successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-market-data function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});