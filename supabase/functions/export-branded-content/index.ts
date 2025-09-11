import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateBrandedHTML(
  content: string,
  title: string,
  brandingAssets: any,
  appendBranding: boolean
): Promise<string> {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Convert markdown-style formatting to HTML
  const formattedContent = content
    .replace(/\*\*(.*?)\*\*/g, '<h3 class="section-header">$1</h3>')
    .replace(/\n\n/g, '</p><p class="content-paragraph">')
    .replace(/^/, '<p class="content-paragraph">')
    .replace(/$/, '</p>')
    .replace(/• /g, '<li>')
    .replace(/<p class="content-paragraph"><li>/g, '<ul class="content-list"><li>')
    .replace(/<\/li><\/p>/g, '</li></ul>');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.7;
            color: #2c3e50;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            background: white;
            border-radius: 16px;
            padding: 40px;
            margin-bottom: 40px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.08);
            text-align: center;
            border: 1px solid #f1f3f4;
        }
        
        .brand-logo {
            color: #F39C12;
            font-size: 2.8rem;
            font-weight: 800;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
        }
        
        .brand-tagline {
            color: #6c757d;
            font-size: 1.1rem;
            margin-bottom: 24px;
            font-weight: 500;
        }
        
        .report-title {
            color: #2c3e50;
            font-size: 2.2rem;
            font-weight: 700;
            margin-bottom: 12px;
            line-height: 1.2;
        }
        
        .report-date {
            display: inline-block;
            background: linear-gradient(135deg, #F39C12, #e67e22);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 0.95rem;
            box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
        }
        
        .content-card {
            background: white;
            border-radius: 16px;
            padding: 50px;
            margin-bottom: 40px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.08);
            border: 1px solid #f1f3f4;
        }
        
        .section-header {
            color: #2c3e50;
            font-size: 1.6rem;
            font-weight: 700;
            margin: 35px 0 20px 0;
            padding-bottom: 12px;
            border-bottom: 3px solid #F39C12;
            position: relative;
        }
        
        .section-header:first-child {
            margin-top: 0;
        }
        
        .content-paragraph {
            margin-bottom: 18px;
            color: #4a5568;
            font-size: 1.05rem;
            line-height: 1.8;
        }
        
        .content-list {
            margin: 20px 0;
            padding-left: 24px;
        }
        
        .content-list li {
            margin-bottom: 10px;
            color: #4a5568;
            font-size: 1.05rem;
            line-height: 1.6;
        }
        
        .branding-footer {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.08);
            border: 1px solid #f1f3f4;
            display: flex;
            align-items: center;
            gap: 30px;
            flex-wrap: wrap;
        }
        
        .agent-photo {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid #F39C12;
            box-shadow: 0 4px 16px rgba(243, 156, 18, 0.2);
        }
        
        .agent-info {
            flex: 1;
            min-width: 250px;
        }
        
        .agent-name {
            font-size: 1.5rem;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 6px;
        }
        
        .agent-title {
            color: #F39C12;
            font-weight: 600;
            margin-bottom: 12px;
            font-size: 1.1rem;
        }
        
        .contact-info {
            font-size: 0.95rem;
            color: #6c757d;
            line-height: 1.5;
        }
        
        .logos {
            display: flex;
            gap: 20px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .logo {
            height: 70px;
            width: auto;
            max-width: 140px;
            object-fit: contain;
            filter: drop-shadow(0 2px 8px rgba(0,0,0,0.1));
        }
        
        .disclaimer {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-left: 5px solid #F39C12;
            padding: 25px;
            margin-top: 40px;
            border-radius: 0 12px 12px 0;
        }
        
        .disclaimer h4 {
            color: #2c3e50;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .disclaimer p {
            font-size: 0.9rem;
            color: #6c757d;
            margin-bottom: 10px;
            line-height: 1.6;
        }
        
        .watermark {
            text-align: center;
            margin-top: 50px;
            padding: 30px;
            color: #adb5bd;
            font-size: 0.85rem;
            border-top: 1px solid #e9ecef;
        }
        
        .powered-by {
            font-weight: 600;
            color: #F39C12;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px 15px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .brand-logo {
                font-size: 2.2rem;
            }
            
            .report-title {
                font-size: 1.8rem;
            }
            
            .content-card {
                padding: 30px 20px;
            }
            
            .branding-footer {
                flex-direction: column;
                text-align: center;
                padding: 30px 20px;
            }
            
            .agent-info {
                min-width: auto;
                text-align: center;
            }
            
            .logos {
                justify-content: center;
            }
        }
        
        @media print {
            body {
                background: white;
            }
            
            .container {
                max-width: none;
                padding: 0;
            }
            
            .header, .content-card, .branding-footer {
                box-shadow: none;
                border: 1px solid #e9ecef;
                break-inside: avoid;
            }
            
            .section-header {
                break-after: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand-logo">Hyper Pulse Content</div>
            <div class="brand-tagline">AI-powered content for modern agents</div>
            <h1 class="report-title">${title}</h1>
            <div class="report-date">${currentDate}</div>
        </div>
        
        <div class="content-card">
            <div class="content">
                ${formattedContent}
            </div>
        </div>
        
        ${appendBranding && brandingAssets ? `
        <div class="branding-footer">
            ${brandingAssets.headshot_url ? `<img src="${brandingAssets.headshot_url}" alt="${brandingAssets.name || 'Real Estate Professional'}" class="agent-photo">` : ''}
            <div class="agent-info">
                <div class="agent-name">${brandingAssets.name || 'Real Estate Professional'}</div>
                <div class="agent-title">Local Market Expert</div>
                <div class="contact-info">
                    ${brandingAssets.email ? `<div>📧 ${brandingAssets.email}</div>` : ''}
                    <div>🏠 Serving ${brandingAssets.neighborhood || 'the local area'} and surrounding communities</div>
                    <div>📊 Powered by real-time market data and local insights</div>
                </div>
            </div>
            <div class="logos">
                ${brandingAssets.logo_url ? `<img src="${brandingAssets.logo_url}" alt="Personal Logo" class="logo">` : ''}
                ${brandingAssets.brokerage_logo_url ? `<img src="${brandingAssets.brokerage_logo_url}" alt="Brokerage Logo" class="logo">` : ''}
            </div>
        </div>
        ` : ''}
        
        <div class="disclaimer">
            <h4>Professional Market Analysis</h4>
            <p><strong>Data Sources:</strong> Information compiled from Multiple Listing Service data, public records, and proprietary market research platforms.</p>
            <p><strong>Currency:</strong> Market conditions change rapidly. This analysis reflects the most current data available as of the report date.</p>
            <p><strong>Professional Use:</strong> This report is prepared for informational purposes and professional marketing use by licensed real estate professionals.</p>
        </div>
        
        <div class="watermark">
            <p><span class="powered-by">Powered by Hyper Pulse Content</span> • AI-driven market intelligence for real estate professionals</p>
            <p>Generated on ${currentDate} • Report ID: ${Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
        </div>
    </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, appendBranding, format = 'html', title = 'Market Analysis Report' } = await req.json();

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
        .select('headshot_url, logo_url, brokerage_logo_url, name, email, neighborhood, county, state')
        .eq('user_id', user.id)
        .maybeSingle();

      brandingAssets = profile;
    }

    // Generate HTML content
    const htmlContent = await generateBrandedHTML(content, title, brandingAssets, appendBranding);

    if (format === 'html') {
      // Return HTML for direct download
      return new Response(JSON.stringify({ 
        success: true,
        htmlContent,
        downloadUrl: `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
        message: 'Branded HTML content generated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // For PDF generation, we would integrate with a service like Puppeteer
      // For now, return the HTML with instructions
      return new Response(JSON.stringify({ 
        success: true,
        htmlContent,
        message: 'PDF generation prepared. Use the HTML content with a PDF conversion service.',
        downloadUrl: `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error generating branded content:', error);
    return new Response(
      JSON.stringify({ error: 'Content export failed', details: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});