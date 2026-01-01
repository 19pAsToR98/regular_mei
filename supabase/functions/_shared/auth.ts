// Helper to validate the shared API secret for external webhooks (Issue 2)
export function validateApiSecret(req: Request): { isValid: boolean, response?: Response } {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    const expectedSecret = Deno.env.get('WHATSAPP_API_SECRET');
    if (!expectedSecret) {
        console.error('WHATSAPP_API_SECRET is not configured.');
        return { 
            isValid: false, 
            response: new Response(JSON.stringify({ error: 'Server configuration error.' }), { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }) 
        };
    }

    // Check for the secret in a custom header (e.g., X-API-Secret)
    const providedSecret = req.headers.get('X-API-Secret');

    if (providedSecret !== expectedSecret) {
        console.warn('Unauthorized access attempt to phone endpoint.');
        return { 
            isValid: false, 
            response: new Response(JSON.stringify({ error: 'Unauthorized: Invalid API Secret.' }), { 
                status: 401, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }) 
        };
    }

    return { isValid: true };
}