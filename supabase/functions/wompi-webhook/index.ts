import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Wompi webhook handler for payment verification
// Validates webhook signatures and updates order status

interface WompiWebhookEvent {
  event: string
  data: {
    id: string
    reference: string
    status: string
    amount: number
    currency: string
    customer_email: string
    payment_method: {
      type: string
      installments?: number
    }
    created_at: string
    updated_at: string
  }
  timestamp: number
  checksum: string
}

interface OrderUpdate {
  status: 'paid' | 'failed' | 'pending' | 'cancelled'
  payment_id?: string
  payment_method?: string
  paid_at?: string
  is_verified: boolean
}

// Validate Wompi webhook signature
function validateWebhookSignature(
  body: string,
  checksum: string,
  webhookSecret: string
): boolean {
  try {
    const hmac = createHmac('sha256', webhookSecret)
    hmac.update(body)
    const expectedChecksum = hmac.digest('hex')
    
    return checksum === expectedChecksum
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}

// Map Wompi status to order status
function mapWompiStatusToOrderStatus(wompiStatus: string): OrderUpdate['status'] {
  switch (wompiStatus.toUpperCase()) {
    case 'APPROVED':
      return 'paid'
    case 'DECLINED':
    case 'ERROR':
      return 'failed'
    case 'PENDING':
      return 'pending'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'pending'
  }
}

// Update order in database
async function updateOrder(
  supabase: any,
  reference: string,
  orderUpdate: OrderUpdate,
  paymentData: any
) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: orderUpdate.status,
        payment_id: orderUpdate.payment_id,
        payment_method: orderUpdate.payment_method,
        paid_at: orderUpdate.paid_at,
        is_verified: orderUpdate.is_verified,
        updated_at: new Date().toISOString()
      })
      .eq('order_number', reference)
      .select()

    if (error) {
      console.error('Error updating order:', error)
      throw error
    }

    console.log(`Order updated successfully: ${reference} -> ${orderUpdate.status}`)
    return data
  } catch (error) {
    console.error('Failed to update order:', error)
    throw error
  }
}

// Send confirmation email
async function sendConfirmationEmail(supabase: any, reference: string) {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', reference)
      .single()

    if (order) {
      // Invoke email function
      await supabase.functions.invoke('resend-email', {
        body: { order }
      })
      console.log(`Confirmation email sent for order: ${reference}`)
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error)
    // Don't fail the webhook for email errors
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Event-Checksum',
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
    // Get webhook secret
    const webhookSecret = Deno.env.get('WOMPI_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('WOMPI_WEBHOOK_SECRET not configured')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Get request body and checksum
    const body = await req.text()
    const checksum = req.headers.get('X-Event-Checksum')
    
    if (!checksum) {
      console.error('Missing X-Event-Checksum header')
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Validate webhook signature
    if (!validateWebhookSignature(body, checksum, webhookSecret)) {
      console.error('Invalid webhook signature')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Parse webhook event
    const webhookEvent: WompiWebhookEvent = JSON.parse(body)
    
    console.log('Webhook received:', {
      event: webhookEvent.event,
      reference: webhookEvent.data.reference,
      status: webhookEvent.data.status,
      paymentId: webhookEvent.data.id
    })

    // Only process transaction.updated events
    if (webhookEvent.event !== 'transaction.updated') {
      console.log(`Ignoring event: ${webhookEvent.event}`)
      return new Response(JSON.stringify({ status: 'ignored' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing')
      return new Response(JSON.stringify({ error: 'Database configuration error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Map payment status
    const orderStatus = mapWompiStatusToOrderStatus(webhookEvent.data.status)
    
    // Prepare order update
    const orderUpdate: OrderUpdate = {
      status: orderStatus,
      payment_id: webhookEvent.data.id,
      payment_method: webhookEvent.data.payment_method.type,
      is_verified: orderStatus === 'paid'
    }

    // Add paid_at timestamp for successful payments
    if (orderStatus === 'paid') {
      orderUpdate.paid_at = new Date().toISOString()
    }

    // Update order in database
    await updateOrder(supabase, webhookEvent.data.reference, orderUpdate, webhookEvent.data)

    // Send confirmation email for successful payments
    if (orderStatus === 'paid') {
      await sendConfirmationEmail(supabase, webhookEvent.data.reference)
    }

    // Log successful processing
    console.log(`Webhook processed successfully: ${webhookEvent.data.reference} -> ${orderStatus}`)

    return new Response(JSON.stringify({ 
      status: 'success',
      orderStatus,
      reference: webhookEvent.data.reference
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
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
