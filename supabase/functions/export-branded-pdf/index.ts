import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { content, appendBranding } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get user's auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's branding assets if needed
    let brandingAssets = null;
    if (appendBranding) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('headshot_url, logo_url, brokerage_logo_url, name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      brandingAssets = profile;
    }

    // Create a simple HTML template for PDF generation
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Newsletter</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .content {
            white-space: pre-wrap;
            margin-bottom: 40px;
        }
        .branding {
            border-top: 2px solid #e5e5e5;
            padding-top: 20px;
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .branding img {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
        }
        .agent-info {
            flex: 1;
        }
        .logos {
            display: flex;
            gap: 10px;
        }
        .logos img {
            width: 50px;
            height: 50px;
            object-fit: contain;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
    </style>
</head>
<body>
    <h1>The Hyper-Local Pulse</h1>
    <div class="content">${content}</div>
    
    ${appendBranding && brandingAssets ? `
    <div class="branding">
        ${brandingAssets.headshot_url ? `<img src="${brandingAssets.headshot_url}" alt="Agent Headshot">` : ''}
        <div class="agent-info">
            <h3>${brandingAssets.name || 'Real Estate Professional'}</h3>
            <p>${brandingAssets.email || ''}</p>
        </div>
        <div class="logos">
            ${brandingAssets.logo_url ? `<img src="${brandingAssets.logo_url}" alt="Personal Logo">` : ''}
            ${brandingAssets.brokerage_logo_url ? `<img src="${brandingAssets.brokerage_logo_url}" alt="Brokerage Logo">` : ''}
        </div>
    </div>
    ` : ''}
</body>
</html>`;

    // For now, return the HTML content that could be used for PDF generation
    // In a production environment, you would use a service like Puppeteer or similar
    // to convert HTML to PDF
    return new Response(JSON.stringify({ 
      success: true,
      htmlContent,
      message: 'PDF generation prepared. HTML content ready for conversion.',
      downloadUrl: `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: 'PDF generation failed', details: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});