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
      propertyData, 
      propertyImages = [],
      tourDuration = 45,
      tourStyle = "luxury_showcase"
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

    // Calculate number of segments based on duration (each segment is 8 seconds)
    const segmentCount = Math.ceil(tourDuration / 8);
    const actualDuration = segmentCount * 8;

    const systemPrompt = `You are a video planning expert for real estate virtual property tours. Generate structured JSON prompts for Veo 3 video generation that creates ${tourDuration}-second virtual property tours broken into ${segmentCount} segments of 8 seconds each.

Each segment should:
- Be exactly 8 seconds long
- Focus on a specific room or area of the property
- Include smooth camera movements appropriate for virtual tours
- Have text overlays with property details and room information
- Connect smoothly to create a logical tour flow
- Use cinematic real estate video aesthetics

IMPORTANT: Return ONLY the JSON object without any markdown formatting, code blocks, or additional text. Output format must be valid JSON with this structure:
{
  "video_plan": {
    "total_duration": ${actualDuration},
    "target_duration": ${tourDuration},
    "segments": [
      {
        "segment": 1,
        "duration": 8,
        "prompt": "Detailed Veo 3 prompt for this room/area",
        "scene_type": "exterior|kitchen|living_room|bedroom|bathroom|dining_room|other",
        "text_overlay": "Property details and room information to display",
        "camera_movement": "slow_zoom_in|pan_left|dolly_forward|walk_through|etc",
        "visual_focus": "What features to highlight in this room"
      }
    ],
    "transitions": ["fade", "slide_left", "dissolve", "cut"],
    "style_notes": "Overall tour aesthetic and tone"
  }
}`;

    const userPrompt = `Create a ${tourDuration}-second virtual property tour plan for the following property:

Property Details:
${JSON.stringify(propertyData, null, 2)}

Available Property Images:
${JSON.stringify(propertyImages, null, 2)}

Tour Style: ${tourStyle}

Create ${segmentCount} segments that create a compelling virtual tour of this property. Include:
- Exterior establishing shot to introduce the property
- Kitchen showcasing appliances and layout
- Living areas highlighting space and natural light
- Bedrooms emphasizing comfort and size
- Bathrooms showing fixtures and finishes
- Concluding exterior or lifestyle shot

Make each prompt detailed enough for Veo 3 to generate high-quality, professional virtual tour content. Focus on highlighting the property's best features, creating smooth transitions between rooms, and maintaining viewer engagement throughout the tour. Include specific details about the property's price, features, and room count in text overlays.`;

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

    // Helper function to extract JSON from markdown code blocks
    function extractJSONFromMarkdown(text: string): string {
      // Remove markdown code block markers
      let cleanText = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
      // Also handle cases where it might just be wrapped in ```
      cleanText = cleanText.replace(/^```\s*/, '').replace(/```\s*$/, '');
      return cleanText.trim();
    }

    // Parse the JSON response with fallback strategies
    let videoPlan;
    try {
      // First, try parsing as-is
      videoPlan = JSON.parse(generatedContent);
    } catch (parseError) {
      try {
        // If that fails, try extracting from markdown
        const cleanedContent = extractJSONFromMarkdown(generatedContent);
        console.log('Attempting to parse cleaned content:', cleanedContent.substring(0, 200) + '...');
        videoPlan = JSON.parse(cleanedContent);
      } catch (secondParseError) {
        console.error('Failed to parse JSON response after cleaning:', secondParseError);
        console.error('Original response:', generatedContent);
        console.error('Cleaned response:', extractJSONFromMarkdown(generatedContent));
        throw new Error('Failed to parse AI response as JSON. The response may not be in the expected format.');
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      videoPlan,
      metadata: {
        propertyAddress: propertyData?.address,
        propertyPrice: propertyData?.price,
        targetDuration: tourDuration,
        actualDuration,
        segmentCount,
        tourStyle,
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