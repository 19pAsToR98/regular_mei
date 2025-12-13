import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Environment variables must be set in Supabase Secrets:
// GOOGLE_CLIENT_ID
// GOOGLE_REDIRECT_URI (e.g., https://<project-ref>.supabase.co/functions/v1/google-oauth-callback)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing user_id parameter' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI');

    if (!clientId || !redirectUri) {
        console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI environment variables.');
        return new Response(JSON.stringify({ error: 'Server configuration error.' }), { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // Scopes required for reading calendar events and refreshing tokens
    const scope = 'https://www.googleapis.com/auth/calendar.readonly';
    
    // Use userId as the state parameter for security and context
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` + // Crucial for getting a refresh token
      `prompt=consent&` + // Crucial for forcing refresh token retrieval
      `state=${userId}`;

    // Redirect the user to Google's authorization page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': authUrl,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('General error in google-oauth-start:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});