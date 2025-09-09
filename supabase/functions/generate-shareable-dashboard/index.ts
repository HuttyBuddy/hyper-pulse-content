import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShareableDashboardRequest {
  title: string;
  description?: string;
  selectedMetrics: string[]; // Array of metric types to include
  dateRange: {
    start: string;
    end: string;
  };
  expiresInDays?: number;
  clientInfo?: {
    name?: string;
    email?: string;
    propertyAddress?: string;
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ShareableDashboardRequest = await req.json();
    
    if (!requestData.title || !requestData.selectedMetrics || requestData.selectedMetrics.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Title and selected metrics are required' 
      }), {
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

    // Generate unique identifiers
    const shareUrl = generateShareUrl();
    const accessToken = generateSecureToken();
    
    // Calculate expiration date
    let expiresAt = null;
    if (requestData.expiresInDays && requestData.expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + requestData.expiresInDays);
    }

    // Validate selected metrics
    const validMetrics = [
      'market_trends',
      'price_analysis', 
      'inventory_levels',
      'days_on_market',
      'neighborhood_activity',
      'comparative_analysis'
    ];
    
    const filteredMetrics = requestData.selectedMetrics.filter(metric => 
      validMetrics.includes(metric)
    );

    if (filteredMetrics.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid metrics selected',
        validMetrics 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save dashboard configuration to database
    const { data: dashboardRecord, error: dbError } = await supabaseClient
      .from('shared_reports')
      .insert({
        user_id: user.id,
        report_type: 'analytics_dashboard',
        source_id: null, // Dashboards aggregate multiple sources
        share_url: shareUrl,
        access_token: accessToken,
        title: requestData.title,
        description: requestData.description || '',
        expires_at: expiresAt?.toISOString() || null,
        is_active: true,
        report_config: {
          selectedMetrics: filteredMetrics,
          dateRange: requestData.dateRange,
          clientInfo: requestData.clientInfo || {},
          generatedAt: new Date().toISOString(),
          location: {
            neighborhood: profile?.neighborhood,
            county: profile?.county,
            state: profile?.state
          }
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
      throw new Error('Failed to save dashboard configuration');
    }

    console.log('Shareable dashboard generated successfully:', dashboardRecord.id);

    return new Response(JSON.stringify({
      success: true,
      dashboardId: dashboardRecord.id,
      shareUrl: `${req.headers.get('origin') || 'https://your-domain.com'}/shared/dashboard/${shareUrl}`,
      accessToken: accessToken,
      expiresAt: expiresAt?.toISOString() || null,
      selectedMetrics: filteredMetrics,
      message: 'Shareable dashboard generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error generating shareable dashboard:', error);
    return new Response(JSON.stringify({
      error: 'Dashboard generation failed',
      details: error?.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});