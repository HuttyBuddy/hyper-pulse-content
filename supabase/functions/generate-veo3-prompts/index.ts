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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      marketData, 
      neighborhood, 
      county, 
      videoDuration = 45,
      videoType = "market_update"
    } = await req.json();

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
          console.error('generate-veo3-prompts: profile fetch error', profileError);
        }
        if (profile?.google_api_key) {
          effectiveKey = profile.google_api_key as string;
        }
      }
    } catch (e) {
      console.error('generate-veo3-prompts: resolving key failed', e);
    }

    if (!effectiveKey) {
      throw new Error('Missing Google API key. Please add it on your Profile page or configure GOOGLE_API_KEY.');
    }

    // Calculate number of segments based on duration (each segment is 9 seconds)
    const segmentCount = Math.ceil(videoDuration / 9);
    const actualDuration = segmentCount * 9;

    const systemPrompt = `You are a video planning expert for real estate market updates. Generate structured JSON prompts for Veo 3 video generation that breaks down ${videoDuration}-second market update videos into ${segmentCount} segments of 9 seconds each.

Each segment should:
- Be exactly 9 seconds long
- Have a specific visual focus and camera movement
- Include text overlay suggestions
- Connect smoothly to the next segment
- Use professional real estate video aesthetics

Output format must be valid JSON with this structure:
{
  "video_plan": {
    "total_duration": ${actualDuration},
    "target_duration": ${videoDuration},
    "segments": [
      {
        "segment": 1,
        "duration": 9,
        "prompt": "Detailed Veo 3 prompt for this segment",
        "scene_type": "establishing|data|comparison|lifestyle|call_to_action",
        "text_overlay": "Text to display on screen",
        "camera_movement": "slow_zoom_in|pan_left|static|dolly_forward|etc",
        "visual_focus": "What the viewer should focus on"
      }
    ],
    "transitions": ["fade", "slide_left", "dissolve"],
    "style_notes": "Overall video aesthetic and tone"
  }
}`;

    const userPrompt = `Create a ${videoDuration}-second real estate market update video plan for ${neighborhood}, ${county}.

Market Data Available:
${JSON.stringify(marketData, null, 2)}

Video Type: ${videoType}

Create ${segmentCount} segments that tell a compelling story about the local market. Include:
- Opening establishing shot of the neighborhood
- Key market statistics with visual elements
- Comparison data with county averages
- Lifestyle/community highlights
- Strong call-to-action ending

Make each prompt detailed enough for Veo 3 to generate high-quality, professional real estate video content. Focus on warm, inviting visuals that showcase both data and lifestyle appeal.`;

    const geminiPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${effectiveKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiPayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    console.log('Generated content:', generatedContent);

    // Parse the JSON response
    let videoPlan;
    try {
      videoPlan = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', generatedContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      videoPlan,
      metadata: {
        neighborhood,
        county,
        targetDuration: videoDuration,
        actualDuration,
        segmentCount,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-veo3-prompts function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});