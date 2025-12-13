import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Environment variables must be set in Supabase Secrets:
// GOOGLE_CLIENT_ID
// GOOGLE_CLIENT_SECRET

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const { userId, timeMin, timeMax } = await req.json();

    if (!userId || !timeMin || !timeMax) {
        return new Response(JSON.stringify({ error: 'Missing required fields: userId, timeMin, timeMax' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Retrieve integration data
    const { data: integration, error: integrationError } = await supabaseAdmin
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('service_name', 'google_calendar')
        .single();

    if (integrationError || !integration) {
        return new Response(JSON.stringify({ error: 'Google Calendar integration not found.' }), { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    let accessToken = integration.access_token;
    const expiresAt = new Date(integration.expires_at);
    const now = new Date();

    // 2. Check if token needs refresh (e.g., if it expires in the next 5 minutes)
    if (expiresAt.getTime() < now.getTime() + (5 * 60 * 1000)) {
        
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

        if (!clientId || !clientSecret) {
            console.error('Missing Google OAuth configuration secrets for refresh.');
            return new Response(JSON.stringify({ error: 'Server configuration error (missing secrets).' }), { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        }

        // Perform token refresh
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: integration.refresh_token,
                grant_type: 'refresh_token',
            }),
        });

        if (!refreshResponse.ok) {
            const errorText = await refreshResponse.text();
            console.error('Token refresh failed:', errorText);
            // Delete integration if refresh fails (token is likely revoked or expired)
            await supabaseAdmin.from('user_integrations').delete().eq('id', integration.id);
            return new Response(JSON.stringify({ error: 'Failed to refresh token. Please reconnect Google Calendar.' }), { 
                status: 401, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        }

        const refreshTokens = await refreshResponse.json();
        accessToken = refreshTokens.access_token;
        const newExpiresAt = new Date(now.getTime() + (refreshTokens.expires_in * 1000)).toISOString();

        // Update database with new access token and expiry
        await supabaseAdmin
            .from('user_integrations')
            .update({ access_token: accessToken, expires_at: newExpiresAt })
            .eq('id', integration.id);
    }

    // 3. Fetch calendar events
    const calendarId = integration.metadata?.calendar_id || 'primary';
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `singleEvents=true&` +
        `orderBy=startTime`;

    const eventsResponse = await fetch(calendarUrl, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text();
        console.error('Google Calendar API Error:', errorText);
        return new Response(JSON.stringify({ error: 'Failed to fetch events from Google Calendar.' }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    const eventsData = await eventsResponse.json();

    return new Response(JSON.stringify({ message: 'Events retrieved successfully', events: eventsData.items }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('General error in get-google-calendar-events:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});