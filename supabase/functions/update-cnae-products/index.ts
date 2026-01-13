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
        // Se o array estiver vazio, ainda excluímos o catálogo, mas não inserimos nada.
        console.warn("[update-cnae-products] Received empty products array. Will clear existing catalog.");
    }
    
    // Initialize Supabase client with Service Role Key (Admin access)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // --- 2. DELETE ALL EXISTING PRODUCTS ---
    console.log("[update-cnae-products] Deleting all existing products from cnae_products table.");
    const { error: deleteError } = await supabaseAdmin
        .from('cnae_products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows (using a dummy condition that is always true)

    if (deleteError) {
        console.error('[update-cnae-products] Delete error:', deleteError);
        return new Response(JSON.stringify({ error: 'Failed to clear existing products.', details: deleteError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    console.log("[update-cnae-products] Existing catalog cleared successfully.");


    // --- 3. INSERT NEW PRODUCTS ---
    let insertedCount = 0;
    if (products.length > 0) {
        const productsPayload = products.map((p: any) => ({
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

        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('cnae_products')
            .insert(productsPayload)
            .select('id');

        if (insertError) {
            console.error('[update-cnae-products] Insert error:', insertError);
            return new Response(JSON.stringify({ error: 'Failed to insert new products.', details: insertError.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        insertedCount = insertData.length;
    }

    console.log(`[update-cnae-products] Successfully inserted ${insertedCount} new products.`);

    return new Response(JSON.stringify({ 
        message: `Catalog completely replaced. Deleted all previous entries and inserted ${insertedCount} new products.`,
        inserted_count: insertedCount
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