import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { neighborhood, county, state } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get user's auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use centralized Google API key for all subscribers
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

    if (!googleApiKey) {
      return new Response(JSON.stringify({ 
        error: 'No Google API key available. Please configure your API key in settings.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the latest market report for the user's area
    const { data: marketReport } = await supabaseClient
      .from('market_reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('location_type', 'neighborhood')
      .eq('neighborhood', neighborhood || '')
      .eq('county', county || '')
      .eq('state', state || '')
      .order('report_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Prepare the market data for the prompt
    let marketDataText = '';
    if (marketReport) {
      marketDataText = `
Current Market Data for ${marketReport.neighborhood}, ${marketReport.county}, ${marketReport.state}:
- Median Sale Price: $${marketReport.median_sale_price?.toLocaleString() || 'N/A'}
- Days on Market: ${marketReport.days_on_market || 'N/A'} days
- Active Listings: ${marketReport.active_listings || 'N/A'}
- New Listings: ${marketReport.new_listings || 'N/A'}
- Closed Sales: ${marketReport.closed_sales || 'N/A'}
- Months of Inventory: ${marketReport.months_of_inventory || 'N/A'} months
- Average Price per Sq Ft: $${marketReport.avg_price_per_sqft || 'N/A'}
- Report Date: ${marketReport.report_date}

Month-over-Month Changes: ${JSON.stringify(marketReport.mom_change || {})}
Year-over-Year Changes: ${JSON.stringify(marketReport.yoy_change || {})}
`;
    } else {
      marketDataText = `No specific market data available for ${neighborhood || 'the area'}, ${county}, ${state}.`;
    }

    const prompt = `You are a professional real estate content writer creating a compelling newsletter for ${neighborhood || 'this area'}, ${county}, ${state}.

${marketDataText}

Create an engaging, informative newsletter content (300-500 words) that:

1. **Opens with a compelling hook** about the current market conditions
2. **Incorporates specific market statistics** from the data above in a natural, storytelling way
3. **Provides actionable insights** for both buyers and sellers
4. **Includes lifestyle elements** that make the neighborhood appealing
5. **Maintains a professional yet approachable tone**
6. **Concludes with market outlook** and next steps

The content should be data-driven but readable, avoiding jargon while demonstrating market expertise. Focus on what the numbers mean for real people making housing decisions.

Do not include any greeting, signature, or boilerplate text - just the newsletter body content.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedContent) {
      throw new Error('No content generated from Gemini API');
    }

    return new Response(JSON.stringify({ 
      content: generatedContent,
      marketData: marketReport 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error generating newsletter content:', error);
    return new Response(
      JSON.stringify({ error: 'Content generation failed', details: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});