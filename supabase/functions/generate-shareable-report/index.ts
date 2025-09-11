import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShareableReportRequest {
  contentId?: string;
  reportType: 'content_package' | 'analytics_dashboard';
  title: string;
  description?: string;
  expiresInDays?: number;
  includeAnalytics?: boolean;
  customBranding?: {
    primaryColor?: string;
    logoUrl?: string;
    agentName?: string;
    contactInfo?: string;
  };
}

function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateShareUrl(): string {
  return generateSecureToken().toLowerCase();
}

async function generateReportHTML(
  contentData: any, 
  userProfile: any, 
  reportConfig: any
): Promise<string> {
  const { title, content, neighborhood, county, state, report_date } = contentData;
  const { name, headshot_url, logo_url, brokerage_logo_url } = userProfile;
  
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
            line-height: 1.6;
            color: #2c3e50;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            text-align: center;
        }
        
        .header h1 {
            color: #F39C12;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header .subtitle {
            color: #6c757d;
            font-size: 1.1rem;
            margin-bottom: 20px;
        }
        
        .location-badge {
            display: inline-block;
            background: #F39C12;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 500;
            font-size: 0.9rem;
        }
        
        .content-card {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        
        .content-card h2 {
            color: #2c3e50;
            font-size: 1.8rem;
            margin-bottom: 20px;
            border-bottom: 3px solid #F39C12;
            padding-bottom: 10px;
        }
        
        .content-card h3 {
            color: #34495e;
            font-size: 1.3rem;
            margin: 25px 0 15px 0;
            font-weight: 600;
        }
        
        .content-card p {
            margin-bottom: 15px;
            color: #5a6c7d;
            font-size: 1rem;
        }
        
        .content-card ul {
            margin: 15px 0;
            padding-left: 20px;
        }
        
        .content-card li {
            margin-bottom: 8px;
            color: #5a6c7d;
        }
        
        .branding-footer {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            display: flex;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .agent-photo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #F39C12;
        }
        
        .agent-info {
            flex: 1;
            min-width: 200px;
        }
        
        .agent-name {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .agent-title {
            color: #6c757d;
            margin-bottom: 10px;
        }
        
        .contact-info {
            font-size: 0.9rem;
            color: #5a6c7d;
        }
        
        .logos {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        
        .logo {
            height: 60px;
            width: auto;
            max-width: 120px;
            object-fit: contain;
        }
        
        .disclaimer {
            background: #f8f9fa;
            border-left: 4px solid #F39C12;
            padding: 20px;
            margin-top: 30px;
            border-radius: 0 8px 8px 0;
        }
        
        .disclaimer p {
            font-size: 0.85rem;
            color: #6c757d;
            margin-bottom: 8px;
        }
        
        .watermark {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #adb5bd;
            font-size: 0.8rem;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .content-card {
                padding: 25px;
            }
            
            .branding-footer {
                flex-direction: column;
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
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Market Intelligence Report</h1>
            <p class="subtitle">Professional Real Estate Analysis</p>
            <div class="location-badge">
                ${neighborhood || 'Local Market'}, ${state || 'CA'} • ${new Date(report_date || Date.now()).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
            </div>
        </div>
        
        <div class="content-card">
            <h2>${title}</h2>
            <div class="content">
                ${content.replace(/\*\*(.*?)\*\*/g, '<h3>$1</h3>')
                         .replace(/\n\n/g, '</p><p>')
                         .replace(/^/, '<p>')
                         .replace(/$/, '</p>')
                         .replace(/• /g, '<li>')
                         .replace(/<p><li>/g, '<ul><li>')
                         .replace(/<\/li><\/p>/g, '</li></ul>')}
            </div>
        </div>
        
        ${name ? `
        <div class="branding-footer">
            ${headshot_url ? `<img src="${headshot_url}" alt="${name}" class="agent-photo">` : ''}
            <div class="agent-info">
                <div class="agent-name">${name}</div>
                <div class="agent-title">Real Estate Professional</div>
                <div class="contact-info">
                    Serving ${neighborhood || 'the local area'} and surrounding communities
                </div>
            </div>
            <div class="logos">
                ${logo_url ? `<img src="${logo_url}" alt="Personal Logo" class="logo">` : ''}
                ${brokerage_logo_url ? `<img src="${brokerage_logo_url}" alt="Brokerage Logo" class="logo">` : ''}
            </div>
        </div>
        ` : ''}
        
        <div class="disclaimer">
            <p><strong>Disclaimer:</strong> This report is provided for informational purposes only and should not be considered as individual investment or real estate advice.</p>
            <p><strong>Data Sources:</strong> Information compiled from Multiple Listing Service data, public records, and proprietary market research.</p>
            <p><strong>Currency:</strong> Market conditions can change rapidly. This analysis reflects data available as of the report date.</p>
        </div>
        
        <div class="watermark">
            <p>Generated by Hyper Pulse Content • AI-powered content for modern agents</p>
            <p>Report ID: ${generateSecureToken().substring(0, 8).toUpperCase()}</p>
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
    const requestData: ShareableReportRequest = await req.json();
    
    if (!requestData.title || !requestData.reportType) {
      return new Response(JSON.stringify({ error: 'Title and report type are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile for branding
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('name, headshot_url, logo_url, brokerage_logo_url, neighborhood, county, state')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get content data if contentId provided
    let contentData = null;
    if (requestData.contentId) {
      const { data } = await supabaseClient
        .from('content_history')
        .select('*')
        .eq('id', requestData.contentId)
        .eq('user_id', user.id)
        .single();
      contentData = data;
    }

    // Generate unique identifiers
    const shareUrl = generateShareUrl();
    const accessToken = generateSecureToken();
    
    // Calculate expiration date
    let expiresAt = null;
    if (requestData.expiresInDays && requestData.expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + requestData.expiresInDays);
    }

    // Generate HTML content
    const htmlContent = await generateReportHTML(
      contentData || {
        title: requestData.title,
        content: 'Custom report content will be displayed here.',
        neighborhood: profile?.neighborhood,
        county: profile?.county,
        state: profile?.state,
        report_date: new Date().toISOString()
      },
      profile || {},
      requestData
    );

    // Upload HTML file to storage
    const fileName = `${user.id}/${shareUrl}.html`;
    const { error: uploadError } = await supabaseClient.storage
      .from('shared-reports')
      .upload(fileName, new Blob([htmlContent], { type: 'text/html' }), {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to save report file');
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabaseClient.storage
      .from('shared-reports')
      .getPublicUrl(fileName);

    // Save report metadata to database
    const { data: reportRecord, error: dbError } = await supabaseClient
      .from('shared_reports')
      .insert({
        user_id: user.id,
        report_type: requestData.reportType,
        source_id: requestData.contentId || null,
        share_url: shareUrl,
        access_token: accessToken,
        title: requestData.title,
        description: requestData.description || '',
        expires_at: expiresAt?.toISOString() || null,
        is_active: true,
        report_config: {
          includeAnalytics: requestData.includeAnalytics || false,
          customBranding: requestData.customBranding || {},
          generatedAt: new Date().toISOString()
        },
        branding_config: {
          agentName: profile?.name,
          logoUrl: profile?.logo_url,
          headshotUrl: profile?.headshot_url,
          brokerageLogoUrl: profile?.brokerage_logo_url
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save report metadata');
    }

    console.log('Shareable report generated successfully:', reportRecord.id);

    return new Response(JSON.stringify({
      success: true,
      reportId: reportRecord.id,
      shareUrl: `${req.headers.get('origin') || 'https://your-domain.com'}/shared/${shareUrl}`,
      accessToken: accessToken,
      publicUrl: publicUrl,
      expiresAt: expiresAt?.toISOString() || null,
      message: 'Shareable report generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error generating shareable report:', error);
    return new Response(JSON.stringify({
      error: 'Report generation failed',
      details: error?.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});