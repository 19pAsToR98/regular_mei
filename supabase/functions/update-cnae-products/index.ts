import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { validateApiSecret } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Validate API Secret
  const authResult = validateApiSecret(req);
  if (!authResult.isValid) {
      console.error("[update-cnae-products] Unauthorized access attempt.");
      return authResult.response!;
  }
  
  try {
    const { products } = await req.json();

    if (!Array.isArray(products) || products.length === 0) {
        return new Response(JSON.stringify({ error: 'Missing or invalid products array in body.' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }
    
    // Initialize Supabase client with Service Role Key (Admin access for upsert)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Prepare data for upsert
    const productsPayload = products.map((p: any) => ({
        // Assumimos que o 'id' é gerado externamente ou é o identificador único do produto
        // Se o 'id' for UUID, ele deve ser fornecido. Se não, usaremos 'cnae_code' e 'product_name' como chaves de conflito.
        // Para simplificar, vamos assumir que o 'id' é o identificador único.
        id: p.id,
        cnae_code: p.cnaeCode,
        product_name: p.productName,
        description: p.description,
        link: p.link,
        image_url: p.imageUrl,
        current_price: p.currentPrice,
        free_shipping: p.freeShipping,
        units_sold: p.unitsSold,
        is_full: p.isFull,
        partner_name: p.partnerName,
        updated_at: new Date().toISOString(),
    }));

    // 3. Execute upsert operation
    // Conflict target: 'id' (assuming it's the primary key and unique identifier)
    const { data, error } = await supabaseAdmin
        .from('cnae_products')
        .upsert(productsPayload, { 
            onConflict: 'id',
            ignoreDuplicates: false // Ensure update happens if ID exists
        })
        .select('id');

    if (error) {
        console.error('[update-cnae-products] Upsert error:', error);
        return new Response(JSON.stringify({ error: 'Failed to update products.', details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    console.log(`[update-cnae-products] Successfully upserted ${data.length} products.`);

    return new Response(JSON.stringify({ 
        message: `Successfully updated/inserted ${data.length} products.`,
        updated_ids: data.map(item => item.id)
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[update-cnae-products] General error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});