import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

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

    if (!googleApiKey) {
      return new Response(JSON.stringify({ error: 'Missing GOOGLE_API_KEY secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const system = 'You are an expert AI prompt engineer for real estate marketing images. Make prompts concise but descriptive, include subject, style, lighting, lens, composition, environment, mood, and quality tags. Avoid copyrighted names.';
    const user = `Base prompt: ${prompt}\nContext: neighborhood=${neighborhood || ''}, county=${county || ''}. Return only the improved prompt.`;

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`,
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
