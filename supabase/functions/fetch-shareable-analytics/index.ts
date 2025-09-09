import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsData {
  marketTrends?: any[];
  priceAnalysis?: any;
  inventoryLevels?: any;
  daysOnMarket?: any;
  neighborhoodActivity?: any[];
  comparativeAnalysis?: any;
}

async function fetchMarketTrends(supabase: any, userId: string, dateRange: any, location: any) {
  const { data } = await supabase
    .from('market_reports')
    .select('report_date, median_sale_price, days_on_market, active_listings, months_of_inventory')
    .eq('user_id', userId)
    .eq('location_type', 'neighborhood')
    .gte('report_date', dateRange.start)
    .lte('report_date', dateRange.end)
    .order('report_date', { ascending: true });

  return data?.map(report => ({
    date: report.report_date,
    medianPrice: report.median_sale_price,
    daysOnMarket: report.days_on_market,
    activeListings: report.active_listings,
    inventory: report.months_of_inventory
  })) || [];
}

async function fetchPriceAnalysis(supabase: any, userId: string, location: any) {
  const { data: neighborhoodData } = await supabase
    .from('market_reports')
    .select('median_sale_price, avg_price_per_sqft, mom_change, yoy_change')
    .eq('user_id', userId)
    .eq('location_type', 'neighborhood')
    .eq('neighborhood', location.neighborhood)
    .order('report_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: countyData } = await supabase
    .from('market_reports')
    .select('median_sale_price, avg_price_per_sqft')
    .eq('user_id', userId)
    .eq('location_type', 'county')
    .eq('county', location.county)
    .order('report_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    neighborhood: neighborhoodData || {},
    county: countyData || {},
    comparison: {
      priceDifference: neighborhoodData?.median_sale_price && countyData?.median_sale_price
        ? ((neighborhoodData.median_sale_price - countyData.median_sale_price) / countyData.median_sale_price * 100).toFixed(1)
        : null,
      psfDifference: neighborhoodData?.avg_price_per_sqft && countyData?.avg_price_per_sqft
        ? ((neighborhoodData.avg_price_per_sqft - countyData.avg_price_per_sqft) / countyData.avg_price_per_sqft * 100).toFixed(1)
        : null
    }
  };
}

async function fetchInventoryLevels(supabase: any, userId: string, location: any) {
  const { data } = await supabase
    .from('market_reports')
    .select('active_listings, new_listings, closed_sales, months_of_inventory, report_date')
    .eq('user_id', userId)
    .eq('location_type', 'neighborhood')
    .eq('neighborhood', location.neighborhood)
    .order('report_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data || {};
}

async function fetchNeighborhoodActivity(supabase: any, userId: string, dateRange: any, location: any) {
  const { data } = await supabase
    .from('content_performance')
    .select('page_views, leads_generated, date_recorded')
    .eq('user_id', userId)
    .gte('date_recorded', dateRange.start)
    .lte('date_recorded', dateRange.end)
    .order('date_recorded', { ascending: true });

  return data?.map(activity => ({
    date: activity.date_recorded,
    views: activity.page_views,
    leads: activity.leads_generated
  })) || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const accessToken = url.searchParams.get('token');
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Access token required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client (no auth required for public access)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get dashboard configuration by access token
    const { data: dashboardConfig, error: configError } = await supabaseClient
      .from('shared_reports')
      .select('*')
      .eq('access_token', accessToken)
      .eq('is_active', true)
      .maybeSingle();

    if (configError || !dashboardConfig) {
      return new Response(JSON.stringify({ error: 'Dashboard not found or expired' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if dashboard has expired
    if (dashboardConfig.expires_at && new Date(dashboardConfig.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Dashboard has expired' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment view count
    await supabaseClient.rpc('increment_report_view_count', { 
      report_token: accessToken 
    });

    const config = dashboardConfig.report_config as any;
    const location = config.location || {};
    const selectedMetrics = config.selectedMetrics || [];
    const dateRange = config.dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    };

    // Fetch analytics data based on selected metrics
    const analyticsData: AnalyticsData = {};

    if (selectedMetrics.includes('market_trends')) {
      analyticsData.marketTrends = await fetchMarketTrends(
        supabaseClient, 
        dashboardConfig.user_id, 
        dateRange, 
        location
      );
    }

    if (selectedMetrics.includes('price_analysis')) {
      analyticsData.priceAnalysis = await fetchPriceAnalysis(
        supabaseClient, 
        dashboardConfig.user_id, 
        location
      );
    }

    if (selectedMetrics.includes('inventory_levels')) {
      analyticsData.inventoryLevels = await fetchInventoryLevels(
        supabaseClient, 
        dashboardConfig.user_id, 
        location
      );
    }

    if (selectedMetrics.includes('neighborhood_activity')) {
      analyticsData.neighborhoodActivity = await fetchNeighborhoodActivity(
        supabaseClient, 
        dashboardConfig.user_id, 
        dateRange, 
        location
      );
    }

    // Add comparative analysis if requested
    if (selectedMetrics.includes('comparative_analysis')) {
      analyticsData.comparativeAnalysis = {
        neighborhoodVsCounty: analyticsData.priceAnalysis,
        marketPosition: 'Analysis based on current market conditions'
      };
    }

    console.log('Analytics data fetched for dashboard:', dashboardConfig.id);

    return new Response(JSON.stringify({
      success: true,
      dashboardInfo: {
        title: dashboardConfig.title,
        description: dashboardConfig.description,
        location: location,
        dateRange: dateRange,
        viewCount: dashboardConfig.view_count + 1,
        lastUpdated: dashboardConfig.updated_at
      },
      branding: dashboardConfig.branding_config,
      analyticsData: analyticsData,
      clientInfo: config.clientInfo || {}
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error fetching shareable analytics:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch analytics data',
      details: error?.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});