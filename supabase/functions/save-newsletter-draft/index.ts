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
    const { content, title, brandingPreferences } = await req.json();

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

    // Check if user already has a draft
    const { data: existingDraft } = await supabaseClient
      .from('newsletter_drafts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let result;
    if (existingDraft) {
      // Update existing draft
      const { data, error } = await supabaseClient
        .from('newsletter_drafts')
        .update({
          content,
          title: title || null,
          branding_preferences: brandingPreferences || { appendBranding: true },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDraft.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new draft
      const { data, error } = await supabaseClient
        .from('newsletter_drafts')
        .insert({
          user_id: user.id,
          content,
          title: title || null,
          branding_preferences: brandingPreferences || { appendBranding: true },
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      draft: result,
      message: 'Newsletter draft saved successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error saving newsletter draft:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save draft', details: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});