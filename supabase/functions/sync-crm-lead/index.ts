import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  id: string;
  lead_data: {
    name: string;
    email: string;
    phone?: string;
    propertyAddress?: string;
    interests?: string[];
    message?: string;
  };
  lead_source: string;
  lead_medium: string;
  lead_value: number;
  status: string;
  created_at: string;
}

interface CRMProfile {
  crm_type: string;
  crm_api_key: string;
  crm_settings: any;
}

// HubSpot CRM Integration
async function syncToHubSpot(leadData: LeadData, profile: CRMProfile) {
  const hubspotUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';
  
  const contactData = {
    properties: {
      email: leadData.lead_data.email,
      firstname: leadData.lead_data.name.split(' ')[0] || '',
      lastname: leadData.lead_data.name.split(' ').slice(1).join(' ') || '',
      phone: leadData.lead_data.phone || '',
      lead_source: leadData.lead_source,
      lead_status: leadData.status,
      property_interest: leadData.lead_data.propertyAddress || '',
      notes_last_contacted: leadData.lead_data.message || '',
      hs_lead_status: 'NEW'
    }
  };

  const response = await fetch(hubspotUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${profile.crm_api_key}`
    },
    body: JSON.stringify(contactData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Salesforce CRM Integration
async function syncToSalesforce(leadData: LeadData, profile: CRMProfile) {
  const settings = profile.crm_settings || {};
  const instanceUrl = settings.instance_url || 'https://your-instance.salesforce.com';
  
  const leadRecord = {
    FirstName: leadData.lead_data.name.split(' ')[0] || '',
    LastName: leadData.lead_data.name.split(' ').slice(1).join(' ') || 'Unknown',
    Email: leadData.lead_data.email,
    Phone: leadData.lead_data.phone || '',
    Company: 'Real Estate Lead',
    LeadSource: leadData.lead_source,
    Status: 'Open - Not Contacted',
    Description: leadData.lead_data.message || '',
    Street: leadData.lead_data.propertyAddress || ''
  };

  const response = await fetch(`${instanceUrl}/services/data/v58.0/sobjects/Lead/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${profile.crm_api_key}`
    },
    body: JSON.stringify(leadRecord)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Salesforce API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Pipedrive CRM Integration
async function syncToPipedrive(leadData: LeadData, profile: CRMProfile) {
  const settings = profile.crm_settings || {};
  const companyDomain = settings.company_domain || 'your-company';
  const pipedriveUrl = `https://${companyDomain}.pipedrive.com/api/v1/persons`;
  
  const personData = {
    name: leadData.lead_data.name,
    email: [{ value: leadData.lead_data.email, primary: true }],
    phone: leadData.lead_data.phone ? [{ value: leadData.lead_data.phone, primary: true }] : [],
    org_id: settings.default_org_id || null,
    owner_id: settings.default_owner_id || null,
    custom_fields: {
      lead_source: leadData.lead_source,
      lead_value: leadData.lead_value,
      property_interest: leadData.lead_data.propertyAddress || ''
    }
  };

  const response = await fetch(`${pipedriveUrl}?api_token=${profile.crm_api_key}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(personData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pipedrive API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, leadData } = await req.json();

    if (!leadId && !leadData) {
      return new Response(JSON.stringify({ error: 'Lead ID or lead data is required' }), {
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

    // Get user's CRM configuration
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('crm_type, crm_api_key, crm_settings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    if (!profile?.crm_type || !profile?.crm_api_key) {
      return new Response(JSON.stringify({ 
        error: 'CRM not configured. Please set up your CRM integration in Profile settings.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch lead data if only ID provided
    let lead = leadData;
    if (leadId && !leadData) {
      const { data: leadRecord, error: leadError } = await supabaseClient
        .from('lead_generation_tracking')
        .select('*')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single();

      if (leadError) {
        throw new Error(`Failed to fetch lead: ${leadError.message}`);
      }
      lead = leadRecord;
    }

    console.log(`Syncing lead to ${profile.crm_type} CRM:`, lead.id);

    // Route to appropriate CRM integration
    let crmResponse;
    switch (profile.crm_type.toLowerCase()) {
      case 'hubspot':
        crmResponse = await syncToHubSpot(lead, profile);
        break;
      case 'salesforce':
        crmResponse = await syncToSalesforce(lead, profile);
        break;
      case 'pipedrive':
        crmResponse = await syncToPipedrive(lead, profile);
        break;
      default:
        throw new Error(`Unsupported CRM type: ${profile.crm_type}`);
    }

    // Update lead record with CRM sync status
    const { error: updateError } = await supabaseClient
      .from('lead_generation_tracking')
      .update({
        notes: `${lead.notes || ''}\n\nSynced to ${profile.crm_type} CRM at ${new Date().toISOString()}`
      })
      .eq('id', lead.id)
      .eq('user_id', user.id);

    if (updateError) {
      console.warn('Failed to update lead with sync status:', updateError);
    }

    console.log(`Successfully synced lead to ${profile.crm_type}:`, crmResponse);

    return new Response(JSON.stringify({ 
      success: true,
      crm_type: profile.crm_type,
      crm_response: crmResponse,
      message: `Lead successfully synced to ${profile.crm_type}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in sync-crm-lead function:', error);
    return new Response(JSON.stringify({ 
      error: 'CRM sync failed', 
      details: error?.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});