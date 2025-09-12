import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailCampaignRequest {
  campaignId?: string;
  draftId?: string;
  recipientIds?: string[];
  subject: string;
  content: string;
  senderName?: string;
  senderEmail?: string;
  scheduledAt?: string;
  testMode?: boolean;
}

interface EmailRecipient {
  email: string;
  name: string;
  id: string;
}

async function sendEmailViaResend(
  recipients: EmailRecipient[],
  subject: string,
  htmlContent: string,
  senderName: string,
  senderEmail: string
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const results = [];
  
  // Send emails in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    for (const recipient of batch) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${senderName} <${senderEmail}>`,
            to: [recipient.email],
            subject: subject,
            html: htmlContent.replace('{{recipient_name}}', recipient.name || 'Valued Client'),
          }),
        });

        const result = await response.json();
        
        if (response.ok) {
          results.push({
            recipient_id: recipient.id,
            email: recipient.email,
            status: 'sent',
            message_id: result.id,
            error: null
          });
        } else {
          results.push({
            recipient_id: recipient.id,
            email: recipient.email,
            status: 'failed',
            message_id: null,
            error: result.message || 'Unknown error'
          });
        }
      } catch (error) {
        results.push({
          recipient_id: recipient.id,
          email: recipient.email,
          status: 'failed',
          message_id: null,
          error: error.message
        });
      }
    }
    
    // Small delay between batches
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

function generateEmailHTML(content: string, branding: any): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Market Update</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #F39C12, #e67e22);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 1.8rem;
            font-weight: 700;
        }
        
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px 20px;
        }
        
        .content h2 {
            color: #2c3e50;
            font-size: 1.4rem;
            margin: 25px 0 15px 0;
            border-bottom: 2px solid #F39C12;
            padding-bottom: 8px;
        }
        
        .content h2:first-child {
            margin-top: 0;
        }
        
        .content p {
            margin-bottom: 15px;
            color: #4a5568;
        }
        
        .content ul {
            margin: 15px 0;
            padding-left: 20px;
        }
        
        .content li {
            margin-bottom: 8px;
            color: #4a5568;
        }
        
        .footer {
            background: #2c3e50;
            color: white;
            padding: 25px 20px;
            text-align: center;
        }
        
        .agent-info {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .agent-photo {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid #F39C12;
        }
        
        .agent-details h3 {
            margin: 0;
            font-size: 1.1rem;
        }
        
        .agent-details p {
            margin: 5px 0 0 0;
            opacity: 0.8;
            font-size: 0.9rem;
        }
        
        .unsubscribe {
            font-size: 0.8rem;
            opacity: 0.7;
            margin-top: 15px;
        }
        
        .unsubscribe a {
            color: #F39C12;
            text-decoration: none;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .content {
                padding: 20px 15px;
            }
            
            .agent-info {
                flex-direction: column;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Market Intelligence Update</h1>
            <p>Your Local Real Estate Insights • ${currentDate}</p>
        </div>
        
        <div class="content">
            ${content
              .replace(/\*\*(.*?)\*\*/g, '<h2>$1</h2>')
              .replace(/\n\n/g, '</p><p>')
              .replace(/^/, '<p>')
              .replace(/$/, '</p>')
              .replace(/• /g, '<li>')
              .replace(/<p><li>/g, '<ul><li>')
              .replace(/<\/li><\/p>/g, '</li></ul>')
            }
        </div>
        
        <div class="footer">
            <div class="agent-info">
                ${branding?.headshot_url ? `<img src="${branding.headshot_url}" alt="${branding.name}" class="agent-photo">` : ''}
                <div class="agent-details">
                    <h3>${branding?.name || 'Your Real Estate Professional'}</h3>
                    <p>Local Market Expert • ${branding?.neighborhood || 'Your Area'} Specialist</p>
                </div>
            </div>
            
            <p style="margin: 0; font-size: 0.9rem;">
                📧 Stay informed with weekly market insights<br>
                📊 Powered by real-time market data
            </p>
            
            <div class="unsubscribe">
                <p>
                    You received this email because you subscribed to market updates.<br>
                    <a href="{{unsubscribe_url}}">Unsubscribe</a> | 
                    <a href="{{preferences_url}}">Update Preferences</a>
                </p>
            </div>
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
    const requestData: EmailCampaignRequest = await req.json();
    
    if (!requestData.subject || !requestData.content) {
      return new Response(JSON.stringify({ 
        error: 'Subject and content are required' 
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
      .select('name, headshot_url, logo_url, neighborhood, email')
      .eq('user_id', user.id)
      .maybeSingle();

    // Get recipients
    let recipients: EmailRecipient[] = [];
    
    if (requestData.recipientIds && requestData.recipientIds.length > 0) {
      // Use specific recipients
      const { data: selectedRecipients } = await supabaseClient
        .from('newsletter_subscribers')
        .select('id, email, first_name, last_name')
        .eq('user_id', user.id)
        .in('id', requestData.recipientIds)
        .eq('is_active', true);
        
      recipients = (selectedRecipients || []).map(sub => ({
        id: sub.id,
        email: sub.email,
        name: `${sub.first_name || ''} ${sub.last_name || ''}`.trim() || 'Valued Client'
      }));
    } else {
      // Use all active subscribers
      const { data: allSubscribers } = await supabaseClient
        .from('newsletter_subscribers')
        .select('id, email, first_name, last_name')
        .eq('user_id', user.id)
        .eq('is_active', true);
        
      recipients = (allSubscribers || []).map(sub => ({
        id: sub.id,
        email: sub.email,
        name: `${sub.first_name || ''} ${sub.last_name || ''}`.trim() || 'Valued Client'
      }));
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No active recipients found' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create or update campaign record
    let campaignId = requestData.campaignId;
    if (!campaignId) {
      const { data: campaign, error: campaignError } = await supabaseClient
        .from('email_campaigns')
        .insert({
          user_id: user.id,
          campaign_name: `Campaign - ${new Date().toLocaleDateString()}`,
          subject_line: requestData.subject,
          sender_name: requestData.senderName || profile?.name || 'Real Estate Professional',
          sender_email: requestData.senderEmail || profile?.email || 'hello@hyperpulsecontent.com',
          recipients_count: recipients.length,
          status: 'sending',
          send_status: 'sending',
          scheduled_at: requestData.scheduledAt ? new Date(requestData.scheduledAt).toISOString() : null
        })
        .select()
        .single();

      if (campaignError) throw campaignError;
      campaignId = campaign.id;
    }

    // Generate HTML email content
    const htmlContent = generateEmailHTML(requestData.content, profile);

    // Send emails
    console.log(`Sending campaign to ${recipients.length} recipients`);
    
    const emailResults = await sendEmailViaResend(
      recipients,
      requestData.subject,
      htmlContent,
      requestData.senderName || profile?.name || 'Real Estate Professional',
      requestData.senderEmail || profile?.email || 'hello@hyperpulsecontent.com'
    );

    // Save recipient records
    const recipientRecords = emailResults.map(result => ({
      user_id: user.id,
      campaign_id: campaignId,
      recipient_email: result.email,
      recipient_name: recipients.find(r => r.email === result.email)?.name || '',
      delivery_status: result.status,
      bounce_reason: result.error
    }));

    const { error: recipientError } = await supabaseClient
      .from('email_recipients')
      .insert(recipientRecords);

    if (recipientError) {
      console.warn('Failed to save recipient records:', recipientError);
    }

    // Update campaign status
    const successCount = emailResults.filter(r => r.status === 'sent').length;
    const failureCount = emailResults.filter(r => r.status === 'failed').length;

    await supabaseClient
      .from('email_campaigns')
      .update({
        status: failureCount === 0 ? 'sent' : 'partially_sent',
        send_status: 'sent',
        sent_at: new Date().toISOString(),
        recipients_count: successCount
      })
      .eq('id', campaignId);

    // Create success notification
    await supabaseClient.rpc('create_user_notification', {
      p_user_id: user.id,
      p_type: 'campaign_sent',
      p_title: 'Email Campaign Sent! 📧',
      p_message: `Successfully sent to ${successCount} of ${recipients.length} recipients`,
      p_action_url: '/analytics?tab=email',
      p_priority: 'normal',
      p_metadata: {
        campaign_id: campaignId,
        success_count: successCount,
        failure_count: failureCount
      }
    });

    console.log(`Campaign sent: ${successCount} successful, ${failureCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      campaignId,
      results: {
        total: recipients.length,
        sent: successCount,
        failed: failureCount
      },
      message: `Email campaign sent to ${successCount} recipients`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error sending email campaign:', error);
    return new Response(JSON.stringify({
      error: 'Email campaign failed',
      details: error?.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});