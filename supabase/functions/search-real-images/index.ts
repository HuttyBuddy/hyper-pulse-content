import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, location } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SERP_API_KEY = Deno.env.get('SERP_API_KEY');
    if (!SERP_API_KEY) {
      return new Response(JSON.stringify({ error: 'SERP API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchQuery = `${query} ${location || ''} high quality`;
    const serpUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(searchQuery)}&api_key=${SERP_API_KEY}&num=8&safe=active&filter=0`;

    console.log('Searching for images with query:', searchQuery);
    
    const response = await fetch(serpUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('SERP API error:', data);
      return new Response(JSON.stringify({ error: 'Image search failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const images = (data.images_results || [])
      .filter((img: any) => img.original && img.original.startsWith('http'))
      .map((img: any) => ({
        url: img.original,
        source: img.source || 'Unknown',
        title: img.title || ''
      }))
      .slice(0, 8);

    console.log(`Found ${images.length} images`);

    return new Response(
      JSON.stringify({ images }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error searching for images:', error);
    return new Response(
      JSON.stringify({ error: 'Image search failed', details: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});