import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Environment variables must be set in Supabase Secrets:
// GOOGLE_CLIENT_ID
// GOOGLE_CLIENT_SECRET
// GOOGLE_REDIRECT_URI

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const userId = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const redirectBase = url.origin.replace('/functions/v1', ''); // Base URL of the app

  if (errorParam) {
      console.error('Google OAuth Error:', errorParam);
      return Response.redirect(`${redirectBase}/?integration_error=Google authorization denied: ${errorParam}`);
  }

  if (!code || !userId) {
    return Response.redirect(`${redirectBase}/?integration_error=Missing code or user ID in callback.`);
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

  if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Google OAuth configuration secrets.');
      return Response.redirect(`${redirectBase}/?integration_error=Server configuration error.`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return Response.redirect(`${redirectBase}/?integration_error=Failed to exchange code for tokens.`);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!refresh_token) {
        console.error('No refresh token received. User must grant offline access.');
        return Response.redirect(`${redirectBase}/?integration_error=Offline access not granted. Please try again.`);
    }

    // 2. Store the refresh token securely in Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const expiresAt = new Date(Date.now() + (expires_in * 1000)).toISOString();

    const { error: dbError } = await supabaseAdmin
      .from('user_integrations')
      .upsert({
        user_id: userId,
        service_name: 'google_calendar',
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expiresAt,
        metadata: { calendar_id: 'primary' } // Default to primary calendar
      }, { onConflict: 'user_id, service_name' });

    if (dbError) {
      console.error('Supabase DB Error:', dbError);
      return Response.redirect(`${redirectBase}/?integration_error=Failed to save integration data.`);
    }

    // 3. Redirect back to the application with success status
    return Response.redirect(`${redirectBase}/?integration_status=success`);

  } catch (error) {
    console.error('General error in google-oauth-callback:', error);
    return Response.redirect(`${redirectBase}/?integration_error=Internal server error during callback.`);
  }
});