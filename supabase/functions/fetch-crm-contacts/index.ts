import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  created_at: string;
}

// HubSpot Contact Fetching
async function fetchHubSpotContacts(profile: any): Promise<CRMContact[]> {
  const hubspotUrl = 'https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,createdate,hs_lead_status';
  
  const response = await fetch(hubspotUrl, {
    headers: {
      'Authorization': `Bearer ${profile.crm_api_key}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return (data.results || []).map((contact: any) => ({
    id: contact.id,
    name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
    email: contact.properties.email || '',
    phone: contact.properties.phone || '',
    source: 'hubspot',
    created_at: contact.properties.createdate || new Date().toISOString()
  }));
}

// Salesforce Contact Fetching
async function fetchSalesforceContacts(profile: any): Promise<CRMContact[]> {
  const settings = profile.crm_settings || {};
  const instanceUrl = settings.instance_url || 'https://your-instance.salesforce.com';
  
  const query = "SELECT Id, FirstName, LastName, Email, Phone, CreatedDate FROM Lead WHERE IsConverted = false ORDER BY CreatedDate DESC LIMIT 100";
  const encodedQuery = encodeURIComponent(query);
  
  const response = await fetch(`${instanceUrl}/services/data/v58.0/query/?q=${encodedQuery}`, {
    headers: {
      'Authorization': `Bearer ${profile.crm_api_key}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Salesforce API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return (data.records || []).map((lead: any) => ({
    id: lead.Id,
    name: `${lead.FirstName || ''} ${lead.LastName || ''}`.trim(),
    email: lead.Email || '',
    phone: lead.Phone || '',
    source: 'salesforce',
    created_at: lead.CreatedDate || new Date().toISOString()
  }));
}

// Pipedrive Contact Fetching
async function fetchPipedriveContacts(profile: any): Promise<CRMContact[]> {
  const settings = profile.crm_settings || {};
  const companyDomain = settings.company_domain || 'your-company';
  const pipedriveUrl = `https://${companyDomain}.pipedrive.com/api/v1/persons?limit=100&api_token=${profile.crm_api_key}`;
  
  const response = await fetch(pipedriveUrl);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pipedrive API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return (data.data || []).map((person: any) => ({
    id: person.id.toString(),
    name: person.name || '',
    email: person.primary_email || '',
    phone: person.primary_phone || '',
    source: 'pipedrive',
    created_at: person.add_time || new Date().toISOString()
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limit = 100, offset = 0 } = await req.json().catch(() => ({}));

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
        error: 'CRM not configured. Please set up your CRM integration in Profile settings.',
        contacts: []
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching contacts from ${profile.crm_type} CRM`);

    // Route to appropriate CRM integration
    let contacts: CRMContact[] = [];
    switch (profile.crm_type.toLowerCase()) {
      case 'hubspot':
        contacts = await fetchHubSpotContacts(profile);
        break;
      case 'salesforce':
        contacts = await fetchSalesforceContacts(profile);
        break;
      case 'pipedrive':
        contacts = await fetchPipedriveContacts(profile);
        break;
      default:
        throw new Error(`Unsupported CRM type: ${profile.crm_type}`);
    }

    // Apply pagination
    const paginatedContacts = contacts.slice(offset, offset + limit);

    console.log(`Successfully fetched ${contacts.length} contacts from ${profile.crm_type}`);

    return new Response(JSON.stringify({ 
      success: true,
      crm_type: profile.crm_type,
      contacts: paginatedContacts,
      total_count: contacts.length,
      has_more: offset + limit < contacts.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in fetch-crm-contacts function:', error);
    return new Response(JSON.stringify({ 
      error: 'CRM contact fetch failed', 
      details: error?.message,
      contacts: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});