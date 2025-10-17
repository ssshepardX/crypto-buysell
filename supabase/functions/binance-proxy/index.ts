import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Bu fonksiyon, istemciden gelen isteği alır,
// sunucu tarafında güvenli bir şekilde Binance API'sine istek atar
// ve sonucu istemciye geri döndürür.
serve(async (req) => {
  // CORS preflight isteğini işle
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { symbol, interval = '1h', limit = 100 } = await req.json()

    if (!symbol) {
      return new Response(JSON.stringify({ error: 'Symbol is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Supabase projenize eklediğiniz Secret'ı burada alıyoruz.
    const BINANCE_API_KEY = Deno.env.get("BINANCE_API_KEY")
    
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const response = await fetch(binanceUrl, {
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Binance API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})