import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { cnpj, name, email, amount, description, billingType, creditCard, creditCardHolderInfo } = await req.json();

    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    const ASAAS_URL = Deno.env.get('ASAAS_API_URL') || "https://sandbox.asaas.com/api/v3";

    if (!ASAAS_API_KEY) {
        return new Response(JSON.stringify({ error: 'Asaas API Key not configured.' }), { 
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // 1. Find or Create Customer
    const searchResponse = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${cnpj.replace(/[^\d]/g, '')}`, {
        headers: { 'access_token': ASAAS_API_KEY }
    });
    const searchData = await searchResponse.json();
    
    let customerId = '';
    if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
    } else {
        const createCustResponse = await fetch(`${ASAAS_URL}/customers`, {
            method: 'POST',
            headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                cpfCnpj: cnpj.replace(/[^\d]/g, ''),
                email: email,
                notificationDisabled: false
            })
        });
        const newCustomer = await createCustResponse.json();
        if (newCustomer.errors) throw new Error(newCustomer.errors[0].description);
        customerId = newCustomer.id;
    }

    // 2. Prepare Payment Payload
    const paymentPayload: any = {
        customer: customerId,
        billingType: billingType || 'PIX',
        value: amount,
        dueDate: new Date().toISOString().split('T')[0],
        description: description,
        externalReference: `DASN_${cnpj.replace(/[^\d]/g, '')}_${Date.now()}`
    };

    // Se for cartão, adiciona os dados do cartão e do titular
    if (billingType === 'CREDIT_CARD' && creditCard) {
        paymentPayload.creditCard = creditCard;
        paymentPayload.creditCardHolderInfo = creditCardHolderInfo;
        paymentPayload.remoteIp = req.headers.get('x-real-ip') || '127.0.0.1';
    }

    // 3. Create Payment
    const paymentResponse = await fetch(`${ASAAS_URL}/payments`, {
        method: 'POST',
        headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload)
    });
    const payment = await paymentResponse.json();
    
    if (payment.errors) {
        return new Response(JSON.stringify({ error: payment.errors[0].description }), { 
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // 4. Get Pix QR Code (apenas se for PIX)
    let pixData = { payload: null, encodedImage: null };
    if (billingType === 'PIX') {
        const pixResponse = await fetch(`${ASAAS_URL}/payments/${payment.id}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });
        pixData = await pixResponse.json();
    }

    return new Response(JSON.stringify({ 
        paymentId: payment.id,
        status: payment.status,
        invoiceUrl: payment.invoiceUrl,
        pixCopyPaste: pixData.payload,
        pixQrCode: pixData.encodedImage,
        amount: amount,
        billingType: billingType
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[create-asaas-payment] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})