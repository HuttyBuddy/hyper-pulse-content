import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, neighborhood, county } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // API key will be resolved from user profile or env below

    const system = 'You are an expert AI prompt engineer for real estate marketing images. Make prompts concise but descriptive, include subject, style, lighting, lens, composition, environment, mood, and quality tags. Avoid copyrighted names.';
    const user = `Base prompt: ${prompt}\nContext: neighborhood=${neighborhood || ''}, county=${county || ''}. Return only the improved prompt.`;

    // Resolve Google AI Studio API key: prefer user's profile key, fallback to project secret
    let effectiveKey = googleApiKey || '';
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && SUPABASE_URL && SUPABASE_ANON_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('google_api_key')
          .maybeSingle();
        if (profileError) {
          console.error('enhance-prompt: profile fetch error', profileError);
        }
        if (profile?.google_api_key) {
          effectiveKey = profile.google_api_key as string;
        }
      }
    } catch (e) {
      console.error('enhance-prompt: resolving key failed', e);
    }

    if (!effectiveKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Google API key. Please add it on your Profile page.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${system}\n\n${user}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiPayload),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini error: ${text}`);
    }

    const data = await response.json();
    const enhancedPrompt =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return new Response(JSON.stringify({ enhancedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in enhance-prompt function:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
