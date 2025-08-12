import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

// Wompi signature generation for integrity verification
// Follows Wompi's documentation for signature generation

interface SignatureRequest {
  amount: number
  currency: string
  reference: string
  customerEmail: string
}

interface SignatureResponse {
  signature: string
  timestamp: number
}

// Generate Wompi integrity signature
function generateWompiSignature(
  amount: number,
  currency: string,
  reference: string,
  customerEmail: string,
  privateKey: string
): { signature: string; timestamp: number } {
  const timestamp = Math.floor(Date.now() / 1000)
  
  // Concatenate properties in specific order as per Wompi docs
  const concatenatedString = `${amount}${currency}${reference}${customerEmail}${timestamp}`
  
  // Generate HMAC-SHA256 signature
  const hmac = createHmac('sha256', privateKey)
  hmac.update(concatenatedString)
  const signature = hmac.digest('hex')
  
  return { signature, timestamp }
}

// Validate request data
function validateSignatureRequest(data: any): data is SignatureRequest {
  return (
    typeof data.amount === 'number' &&
    typeof data.currency === 'string' &&
    typeof data.reference === 'string' &&
    typeof data.customerEmail === 'string' &&
    data.amount > 0 &&
    data.currency.length > 0 &&
    data.reference.length > 0 &&
    data.customerEmail.length > 0
  )
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  try {
    // Get request body
    const body = await req.json()
    
    // Validate request data
    if (!validateSignatureRequest(body)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request data. Required: amount, currency, reference, customerEmail' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Get environment variables
    const privateKey = Deno.env.get('WOMPI_PRIVATE_KEY')
    const environment = Deno.env.get('WOMPI_ENV') || 'sandbox'
    
    if (!privateKey) {
      console.error('WOMPI_PRIVATE_KEY not configured')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Generate signature
    const { signature, timestamp } = generateWompiSignature(
      body.amount,
      body.currency,
      body.reference,
      body.customerEmail,
      privateKey
    )

    // Log signature generation (for debugging)
    console.log(`Signature generated for reference: ${body.reference}`, {
      amount: body.amount,
      currency: body.currency,
      reference: body.reference,
      customerEmail: body.customerEmail,
      timestamp,
      environment,
      signatureLength: signature.length
    })

    // Return signature
    const response: SignatureResponse = {
      signature,
      timestamp
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Error generating signature:', error)
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
