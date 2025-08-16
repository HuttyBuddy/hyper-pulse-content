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
    const { message, context } = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to get user's personal Google API key from their profile (dev mode bypass)
    let googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    let user = null;
    
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
        user = authUser;
        
        // Try to get user's personal Google API key
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('google_api_key')
          .eq('user_id', user.id)
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

    // Build context-aware system message
    let systemMessage = `You are a helpful AI assistant for real estate professionals. You provide expert guidance on market analysis, content creation, marketing strategies, and industry insights.`;
    
    if (context?.currentPage) {
      systemMessage += `\n\nCurrent context: The user is on the ${context.currentPage} page.`;
    }
    
    if (context?.neighborhood) {
      systemMessage += `\n\nUser's current neighborhood focus: ${context.neighborhood}, ${context.county}, ${context.state}.`;
    }
    
    if (!user) {
      systemMessage += `\n\n[Development Mode: No user authentication - providing general assistance]`;
    }

    if (context?.reportData) {
      systemMessage += `\n\nLatest market data context: ${JSON.stringify(context.reportData).slice(0, 500)}...`;
    }

    systemMessage += `\n\nProvide helpful, actionable advice. Keep responses conversational but professional. When discussing market data, reference specific numbers when available.`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemMessage }
            ]
          },
          {
            parts: [
              { text: message }
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
        JSON.stringify({ error: 'Failed to get response from Gemini', details: errorText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return new Response(
        JSON.stringify({ error: 'No response generated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const responseText = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in gemini-chat function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});