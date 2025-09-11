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

    const prompt = `You are a professional real estate content writer creating a comprehensive, in-depth newsletter for ${neighborhood || 'this area'}, ${county}, ${state}.

${marketDataText}

Create a thorough, engaging market analysis blog post (800-1200 words) with the following detailed structure:

**MARKET SNAPSHOT SECTION (150-200 words):**
- Open with a compelling hook about current market conditions
- Incorporate specific statistics naturally in storytelling format
- Highlight the most significant market trends and changes

**DEEP MARKET ANALYSIS (300-400 words):**
- Detailed breakdown of pricing trends and what drives them
- Inventory analysis and what it means for the market balance
- Days on market patterns and seasonal factors
- Comparison with surrounding areas/counties when relevant
- Interest rate impact and mortgage market considerations

**BUYER & SELLER INSIGHTS (200-300 words):**
- Specific actionable advice for buyers in this market
- Strategic guidance for sellers on timing and pricing
- Market positioning recommendations
- Common mistakes to avoid in current conditions

**NEIGHBORHOOD SPOTLIGHT (150-200 words):**
- Local amenities, schools, and lifestyle attractions
- Recent community developments or improvements
- What makes this area unique and desirable
- Transportation and accessibility benefits

**MARKET FORECAST & OUTLOOK (100-150 words):**
- Professional predictions for next 3-6 months
- Seasonal patterns to watch
- Economic factors that could influence the market
- Recommended action steps for different buyer/seller profiles

The content should be data-driven yet accessible, demonstrating deep market expertise while remaining engaging for all readers. Use specific numbers and statistics throughout, but explain their practical implications. Write in a confident, professional tone that positions the agent as the local market authority.

CRITICAL: If no market data is available, create realistic market insights based on general market conditions for the area type and current economic climate. Always provide valuable, actionable content even without specific data.
Do not include any greeting, signature, or boilerplate text - just the comprehensive newsletter body content organized with clear section breaks.`;

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