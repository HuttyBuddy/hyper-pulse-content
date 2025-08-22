import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { neighborhood, county, state, marketData } = await req.json();
    
    if (!neighborhood) {
      return new Response(JSON.stringify({ error: 'Neighborhood is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to get user's personal Google API key from their profile
    let googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    
    // Check if we have authorization header for user lookup
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user: authUser } } = await supabaseClient.auth.getUser();
      if (authUser) {
        // Try to get user's personal Google API key
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('google_api_key')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (profile?.google_api_key) {
          googleApiKey = profile.google_api_key;
        }
      }
    }

    if (!googleApiKey) {
      return new Response(JSON.stringify({ error: 'Google API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build comprehensive research prompt
    const researchPrompt = `As a real estate market research expert, provide comprehensive insights for ${neighborhood}, ${county}, ${state}.

${marketData ? `Current market data: ${JSON.stringify(marketData)}` : ''}

Please provide:
1. **Neighborhood Highlights**: Key features, amenities, and attractions that make this area desirable
2. **Market Trends**: Current market conditions, price trends, and buyer/seller dynamics
3. **Demographics**: Target buyer profiles and lifestyle characteristics
4. **Content Suggestions**: 5 engaging social media post ideas specific to this area
5. **Marketing Angles**: Unique selling points and positioning strategies for real estate professionals

Format as JSON with sections: "highlights", "marketTrends", "demographics", "contentSuggestions", "marketingAngles".`;

    console.log('Research prompt for:', neighborhood, county, state);

    // Call Gemini API for research
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: researchPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get research from Gemini', details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return new Response(
        JSON.stringify({ error: 'No research generated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const researchText = data.candidates[0].content.parts[0].text;
    
    console.log('Research generated successfully for:', neighborhood);
    
    // Try to parse as JSON, fallback to structured text
    let researchData;
    try {
      researchData = JSON.parse(researchText);
    } catch {
      // If not valid JSON, structure the response
      researchData = {
        highlights: researchText.split('\n').slice(0, 3).join('\n'),
        marketTrends: researchText,
        demographics: '',
        contentSuggestions: ['Research available - see full analysis'],
        marketingAngles: ['Enhanced insights provided by AI research']
      };
    }

    return new Response(
      JSON.stringify({ 
        research: researchData,
        location: `${neighborhood}, ${county}, ${state}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in google-research function:', error);
    return new Response(
      JSON.stringify({ error: 'Research failed', details: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});