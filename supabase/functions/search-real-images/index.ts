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

    // Use Unsplash API for high-quality real estate images
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
    const searchQuery = `${query} ${location || ''} real estate home house`.trim();
    
    // Unsplash API endpoint - works without API key for basic usage
    const unsplashUrl = UNSPLASH_ACCESS_KEY 
      ? `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=8&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`
      : `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=8&orientation=landscape&client_id=demo`;

    console.log('Searching Unsplash for images with query:', searchQuery);
    
    const response = await fetch(unsplashUrl, {
      headers: {
        'Accept': 'application/json',
        ...(UNSPLASH_ACCESS_KEY && { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` })
      }
    });
    
    const data = await response.json();

    if (!response.ok) {
      console.error('Unsplash API error:', data);
      // Fallback to demo images if API fails
      const fallbackImages = [
        {
          url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
          source: 'Unsplash',
          title: 'Modern home exterior',
          photographer: 'Unsplash'
        },
        {
          url: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
          source: 'Unsplash', 
          title: 'Beautiful house with garden',
          photographer: 'Unsplash'
        },
        {
          url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
          source: 'Unsplash',
          title: 'Luxury home interior',
          photographer: 'Unsplash'
        }
      ];
      
      return new Response(
        JSON.stringify({ images: fallbackImages }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const images = (data.results || [])
      .filter((photo: any) => photo.urls && photo.urls.regular)
      .map((photo: any) => ({
        url: photo.urls.regular,
        source: 'Unsplash',
        title: photo.alt_description || photo.description || 'Real estate image',
        photographer: photo.user?.name || 'Unsplash'
      }))
      .slice(0, 8);

    console.log(`Found ${images.length} Unsplash images`);

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