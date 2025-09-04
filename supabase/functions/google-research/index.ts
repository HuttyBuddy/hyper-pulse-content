import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to parse text into structured lifestyle data
function parseTextToStructuredData(text: string, neighborhood: string) {
  const lifestyle = {
    localFavorites: "",
    communityLife: "",
    familyLiving: "",
    lifestylePerks: "",
    socialContentIdeas: [],
    emotionalHooks: []
  };

  // Extract local favorites section
  const favoritesMatch = text.match(/local\s*favorites?["\s]*:?\s*["\s]*([^"}\n]+)/i);
  if (favoritesMatch) {
    lifestyle.localFavorites = favoritesMatch[1].trim();
  }

  // Extract community life section  
  const communityMatch = text.match(/community\s*life["\s]*:?\s*["\s]*([^"}\n]+)/i);
  if (communityMatch) {
    lifestyle.communityLife = communityMatch[1].trim();
  }

  // Extract family living section
  const familyMatch = text.match(/family\s*living["\s]*:?\s*["\s]*([^"}\n]+)/i);
  if (familyMatch) {
    lifestyle.familyLiving = familyMatch[1].trim();
  }

  // Extract lifestyle perks section
  const perksMatch = text.match(/lifestyle\s*perks?["\s]*:?\s*["\s]*([^"}\n]+)/i);
  if (perksMatch) {
    lifestyle.lifestylePerks = perksMatch[1].trim();
  }

  // Extract social content ideas array
  const socialMatch = text.match(/social\s*content\s*ideas?["\s]*:?\s*\[([^\]]+)\]/i);
  if (socialMatch) {
    const ideas = socialMatch[1].split(',').map(s => s.replace(/["\s]/g, '').trim()).filter(s => s);
    lifestyle.socialContentIdeas = ideas.slice(0, 5);
  }

  // Extract emotional hooks array
  const hooksMatch = text.match(/emotional\s*hooks?["\s]*:?\s*\[([^\]]+)\]/i);
  if (hooksMatch) {
    const hooks = hooksMatch[1].split(',').map(s => s.replace(/["\s]/g, '').trim()).filter(s => s);
    lifestyle.emotionalHooks = hooks.slice(0, 5);
  }

  return lifestyle;
}

// Helper function to validate and enhance lifestyle data
function validateAndEnhanceLifestyleData(data: any, originalText: string, neighborhood: string) {
  // Normalize text fields that may arrive as arrays/objects
  const localFavoritesStr = Array.isArray(data?.localFavorites)
    ? data.localFavorites.filter((x: any) => typeof x === 'string').join(' ')
    : (typeof data?.localFavorites === 'string' ? data.localFavorites : '');

  const communityLifeStr = Array.isArray(data?.communityLife)
    ? data.communityLife.filter((x: any) => typeof x === 'string').join(' ')
    : (typeof data?.communityLife === 'string' ? data.communityLife : '');

  const familyLivingStr = Array.isArray(data?.familyLiving)
    ? data.familyLiving.filter((x: any) => typeof x === 'string').join(' ')
    : (typeof data?.familyLiving === 'string' ? data.familyLiving : '');

  const lifestylePerksStr = Array.isArray(data?.lifestylePerks)
    ? data.lifestylePerks.filter((x: any) => typeof x === 'string').join(' ')
    : (typeof data?.lifestylePerks === 'string' ? data.lifestylePerks : '');

  // Normalize arrays that may contain objects (e.g., { platform, caption }) or strings
  const normalizeToStrings = (arr: any[]): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .flatMap((item) => {
        if (typeof item === 'string') return [item];
        if (item && typeof item === 'object') {
          const { caption, text, content, idea, description, title, prompt, angle, hook } = item as any;
          const candidates = [caption, text, content, idea, description, title, prompt, angle, hook]
            .filter((v) => typeof v === 'string' && v.trim().length > 0);
          return candidates.length ? [candidates[0]] : [];
        }
        return [];
      })
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 5);
  };

  let socialContentIdeas = normalizeToStrings(data?.socialContentIdeas ?? []);
  let emotionalHooks = normalizeToStrings(data?.emotionalHooks ?? []);

  const enhanced = {
    localFavorites: localFavoritesStr || `${neighborhood} features beloved local coffee shops, restaurants, and community gathering spots.`,
    communityLife: communityLifeStr || `${neighborhood} has an active community with regular events and strong neighborhood connections.`,
    familyLiving: familyLivingStr || `${neighborhood} offers excellent schools, parks, and family-friendly amenities.`,
    lifestylePerks: lifestylePerksStr || `${neighborhood} provides convenient commutes, walkable streets, and modern amenities.`,
    socialContentIdeas,
    emotionalHooks,
  };

  // Ensure we have meaningful social content ideas
  if (
    enhanced.socialContentIdeas.length === 0 ||
    enhanced.socialContentIdeas.some((item) => typeof item === 'string' && item.toLowerCase().includes('research available'))
  ) {
    enhanced.socialContentIdeas = [
      `Morning coffee spots that make ${neighborhood} residents smile`,
      `Weekend family activities in ${neighborhood} parks and trails`,
      `Local hidden gems only ${neighborhood} residents know about`,
      `Seasonal community events that bring ${neighborhood} together`,
      `Why ${neighborhood}'s walkable streets are perfect for evening strolls`,
    ];
  }

  // Ensure we have meaningful emotional hooks
  if (
    enhanced.emotionalHooks.length === 0 ||
    enhanced.emotionalHooks.some((item) => typeof item === 'string' && item.toLowerCase().includes('enhanced insights'))
  ) {
    enhanced.emotionalHooks = [
      `${neighborhood}: Where neighbors become lifelong friends`,
      `The community spirit that makes ${neighborhood} feel like home`,
      `Quality of life that busy families find in ${neighborhood}`,
      `Local charm meets modern convenience in ${neighborhood}`,
      `Why families choose to stay and grow in ${neighborhood}`,
    ];
  }

  return enhanced;
}

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

    // Use centralized Google API key for all subscribers
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

    if (!googleApiKey) {
      return new Response(JSON.stringify({ error: 'Google API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  const lifestylePrompt = `Generate comprehensive hyper-local lifestyle insights for ${neighborhood} in ${county}, ${state}.

Please provide structured data in the following JSON format:
{
  "localFavorites": "Top local coffee shops, restaurants, hidden gems, and neighborhood spots that residents love",
  "communityLife": "Local events, traditions, community culture, and what makes this neighborhood unique",
  "familyLiving": "Schools, parks, kid-friendly activities, and family amenities",
  "lifestylePerks": "Commute options, walkability, convenience factors, and daily life advantages", 
  "socialContentIdeas": ["5 Instagram-worthy lifestyle content ideas", "specific to this neighborhood's character"],
  "emotionalHooks": ["5 lifestyle-focused marketing angles", "about why people love living here"]
}

Context about the neighborhood:
${marketData ? `Current market data: ${JSON.stringify(marketData)}` : ''}

Focus on authentic lifestyle experiences, local character, and emotional connections that make people want to live in this neighborhood. Emphasize community feel, daily experiences, and what makes residents proud to call this place home.`;

    console.log('Lifestyle prompt for:', neighborhood, county, state);

    // Call Gemini API for lifestyle research
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: lifestylePrompt }
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

    const lifestyleText = data.candidates[0].content.parts[0].text;
    
    console.log('Raw lifestyle response:', lifestyleText);
    console.log('Lifestyle guide generated successfully for:', neighborhood);
    
    // Enhanced JSON parsing with multiple strategies
    let lifestyleData;
    try {
      // First try direct JSON parsing
      lifestyleData = JSON.parse(lifestyleText);
      console.log('Successfully parsed as JSON');
    } catch {
      console.log('Direct JSON parsing failed, trying extraction methods...');
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = lifestyleText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          lifestyleData = JSON.parse(jsonMatch[1]);
          console.log('Successfully extracted JSON from markdown');
        } catch {
          console.log('Markdown JSON extraction failed, using text parsing');
          lifestyleData = parseTextToStructuredData(lifestyleText, neighborhood);
        }
      } else {
        console.log('No JSON blocks found, using text parsing');
        lifestyleData = parseTextToStructuredData(lifestyleText, neighborhood);
      }
    }

    // Validate and ensure all required fields exist
    lifestyleData = validateAndEnhanceLifestyleData(lifestyleData, lifestyleText, neighborhood);

    return new Response(
      JSON.stringify({ 
        lifestyle: lifestyleData,
        location: `${neighborhood}, ${county}, ${state}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in google-research function:', error);
    return new Response(
      JSON.stringify({ error: 'Lifestyle generation failed', details: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});