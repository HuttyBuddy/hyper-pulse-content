import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to parse unstructured text into research data
function parseTextToStructuredData(text: string, neighborhood: string) {
  const sections = text.split(/(?:\*\*|##)\s*(.*?)(?:\*\*|:)/);
  const result = {
    highlights: '',
    marketTrends: '',
    demographics: '',
    contentSuggestions: [] as string[],
    marketingAngles: [] as string[]
  };

  let currentSection = '';
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].toLowerCase().trim();
    
    if (section.includes('highlight') || section.includes('feature')) {
      currentSection = 'highlights';
    } else if (section.includes('market') && section.includes('trend')) {
      currentSection = 'marketTrends';
    } else if (section.includes('demographic') || section.includes('buyer')) {
      currentSection = 'demographics';
    } else if (section.includes('content') || section.includes('social')) {
      currentSection = 'contentSuggestions';
    } else if (section.includes('marketing') || section.includes('angle') || section.includes('selling')) {
      currentSection = 'marketingAngles';
    } else if (currentSection && sections[i + 1]) {
      const content = sections[i + 1].trim();
      if (content.length > 10) {
        if (currentSection === 'contentSuggestions' || currentSection === 'marketingAngles') {
          // Extract numbered list items
          const items = content.split(/\d+\.|\n-|\n\*/).filter(item => item.trim().length > 10);
          result[currentSection] = items.map(item => item.trim()).slice(0, 5);
        } else {
          result[currentSection] = content.substring(0, 500);
        }
      }
    }
  }

  // Fallback extraction if structured parsing fails
  if (!result.contentSuggestions.length) {
    const lines = text.split('\n').filter(line => line.length > 20);
    result.contentSuggestions = lines.slice(0, 3).map(line => line.trim());
  }
  
  if (!result.marketingAngles.length) {
    const lines = text.split('\n').filter(line => line.length > 15);
    result.marketingAngles = lines.slice(-3).map(line => line.trim());
  }

  return result;
}

// Helper function to validate and enhance research data
function validateAndEnhanceResearchData(data: any, originalText: string, neighborhood: string) {
  // Normalize text fields that may arrive as arrays/objects
  const highlightsStr = Array.isArray(data?.highlights)
    ? data.highlights.filter((x: any) => typeof x === 'string').join(' ')
    : (typeof data?.highlights === 'string' ? data.highlights : '');

  let marketTrendsStr = '';
  if (typeof data?.marketTrends === 'string') {
    marketTrendsStr = data.marketTrends;
  } else if (data?.marketTrends && typeof data.marketTrends === 'object') {
    const mt = data.marketTrends as any;
    marketTrendsStr = [mt.currentConditions, mt.priceTrends, mt.buyerSellerDynamics]
      .filter((x) => typeof x === 'string' && x.trim().length > 0)
      .join(' ');
    if (!marketTrendsStr) marketTrendsStr = JSON.stringify(mt);
  }

  const demographicsStr = Array.isArray(data?.demographics)
    ? data.demographics.filter((x: any) => typeof x === 'string').join(' ')
    : (typeof data?.demographics === 'string' ? data.demographics : '');

  // Normalize arrays that may contain objects (e.g., { platform, caption }) or strings
  const normalizeToStrings = (arr: any[]): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .flatMap((item) => {
        if (typeof item === 'string') return [item];
        if (item && typeof item === 'object') {
          const { caption, text, content, idea, description, title, prompt, angle } = item as any;
          const candidates = [caption, text, content, idea, description, title, prompt, angle]
            .filter((v) => typeof v === 'string' && v.trim().length > 0);
          return candidates.length ? [candidates[0]] : [];
        }
        return [];
      })
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 5);
  };

  let contentSuggestions = normalizeToStrings(data?.contentSuggestions ?? []);
  let marketingAngles = normalizeToStrings(data?.marketingAngles ?? []);

  const enhanced = {
    highlights: highlightsStr || `${neighborhood} offers unique opportunities in today's market.`,
    marketTrends: marketTrendsStr || `Current market analysis for ${neighborhood} shows active conditions.`,
    demographics: demographicsStr || `${neighborhood} attracts diverse buyers seeking quality living.`,
    contentSuggestions,
    marketingAngles,
  };

  // Ensure we have meaningful content suggestions
  if (
    enhanced.contentSuggestions.length === 0 ||
    enhanced.contentSuggestions.some((item) => typeof item === 'string' && item.toLowerCase().includes('research available'))
  ) {
    enhanced.contentSuggestions = [
      `Discover what makes ${neighborhood} special - local insights and market trends`,
      `Why ${neighborhood} is attracting today's smart buyers`,
      `Market snapshot: What's happening in ${neighborhood} real estate`,
      `Local lifestyle: The ${neighborhood} advantage for homeowners`,
      `Investment potential: ${neighborhood}'s growing market appeal`,
    ];
  }

  // Ensure we have meaningful marketing angles
  if (
    enhanced.marketingAngles.length === 0 ||
    enhanced.marketingAngles.some((item) => typeof item === 'string' && item.toLowerCase().includes('enhanced insights'))
  ) {
    enhanced.marketingAngles = [
      `Position ${neighborhood} as an emerging opportunity`,
      `Highlight unique local amenities and lifestyle benefits`,
      `Emphasize market stability and growth potential`,
      `Focus on community features and neighborhood charm`,
      `Showcase accessibility and convenience factors`,
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
    
    console.log('Raw research response:', researchText);
    console.log('Research generated successfully for:', neighborhood);
    
    // Enhanced JSON parsing with multiple strategies
    let researchData;
    try {
      // First try direct JSON parsing
      researchData = JSON.parse(researchText);
      console.log('Successfully parsed as JSON');
    } catch {
      console.log('Direct JSON parsing failed, trying extraction methods...');
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = researchText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          researchData = JSON.parse(jsonMatch[1]);
          console.log('Successfully extracted JSON from markdown');
        } catch {
          console.log('Markdown JSON extraction failed, using text parsing');
          researchData = parseTextToStructuredData(researchText, neighborhood);
        }
      } else {
        console.log('No JSON blocks found, using text parsing');
        researchData = parseTextToStructuredData(researchText, neighborhood);
      }
    }

    // Validate and ensure all required fields exist
    researchData = validateAndEnhanceResearchData(researchData, researchText, neighborhood);

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