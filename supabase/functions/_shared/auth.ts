import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

// Helper to validate the shared API secret for external webhooks (Issue 2)
export function validateApiSecret(req: Request): { isValid: boolean, response?: Response } {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-secret',
    };

    // Renomeado para EXTERNAL_API_SECRET para ser mais genérico
    const expectedSecret = Deno.env.get('EXTERNAL_API_SECRET');
    
    // CRITICAL: Check if the secret is defined in the environment
    if (!expectedSecret) {
        console.error('[validateApiSecret] EXTERNAL_API_SECRET is not configured.');
        return { 
            isValid: false, 
            response: new Response(JSON.stringify({ error: 'Server configuration error: Missing EXTERNAL_API_SECRET.' }), { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }) 
        };
    }

    // Check for the secret in a custom header (e.g., X-API-Secret)
    const providedSecret = req.headers.get('X-API-Secret');

    if (providedSecret !== expectedSecret) {
        console.warn('[validateApiSecret] Unauthorized access attempt. Invalid API Secret.');
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