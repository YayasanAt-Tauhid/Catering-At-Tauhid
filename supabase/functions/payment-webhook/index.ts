import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

serve(async (req) => {
    try {
        const notification = await req.json()

        console.log('Received webhook notification:', notification)

        // Verify signature from Midtrans
        const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
        const orderId = notification.order_id
        const statusCode = notification.status_code
        const grossAmount = notification.gross_amount

        const signatureKey = `${orderId}${statusCode}${grossAmount}${serverKey}`
        const encoder = new TextEncoder()
        const data = encoder.encode(signatureKey)
        const hashBuffer = await crypto.subtle.digest('SHA-512', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const calculatedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        if (calculatedSignature !== notification.signature_key) {
            console.error('Invalid signature')
            return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Create Supabase admin client (using service role key for webhook)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Determine order status based on transaction status
        let orderStatus = 'pending'
        const transactionStatus = notification.transaction_status
        const fraudStatus = notification.fraud_status

        if (transactionStatus === 'capture') {
            if (fraudStatus === 'accept') {
                orderStatus = 'paid'
            }
        } else if (transactionStatus === 'settlement') {
            orderStatus = 'paid'
        } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
            orderStatus = transactionStatus === 'expire' ? 'expired' : 'failed'
        } else if (transactionStatus === 'pending') {
            orderStatus = 'pending'
        }

        // Check if this is a BULK payment (multiple orders)
        const isBulkPayment = orderId.startsWith('BULK-')
        
        if (isBulkPayment) {
            // For bulk payments, find all orders with this transaction_id
            console.log(`Processing bulk payment: ${orderId}`)
            
            const { data: orders, error: fetchError } = await supabaseClient
                .from('orders')
                .select('id')
                .eq('transaction_id', orderId)

            if (fetchError) {
                console.error('Error fetching orders for bulk payment:', fetchError)
                throw fetchError
            }

            if (!orders || orders.length === 0) {
                console.log(`No orders found for bulk payment ${orderId}`)
                return new Response(
                    JSON.stringify({ success: true, message: 'No orders found for this transaction' }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }
                )
            }

            // Update all orders with this transaction_id
            const orderIds = orders.map(o => o.id)
            const { error: updateError } = await supabaseClient
                .from('orders')
                .update({
                    status: orderStatus,
                    updated_at: new Date().toISOString(),
                })
                .in('id', orderIds)

            if (updateError) {
                console.error('Failed to update bulk orders:', updateError)
                throw updateError
            }

            console.log(`Bulk payment ${orderId}: Updated ${orderIds.length} orders to status: ${orderStatus}`)
            console.log('Updated order IDs:', orderIds)

            return new Response(
                JSON.stringify({ success: true, message: `Updated ${orderIds.length} orders` }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            )
        }

        // Single order payment - validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

        if (!uuidRegex.test(orderId)) {
            console.log(`Invalid UUID format for order_id: ${orderId} - likely a test notification`)
            return new Response(
                JSON.stringify({ success: true, message: 'Test notification received (invalid UUID)' }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            )
        }

        const { data: existingOrder, error: fetchError } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('id', orderId)
            .maybeSingle()

        if (fetchError) {
            console.error('Error fetching order:', fetchError)
            throw fetchError
        }

        // If order doesn't exist (e.g., test notification), return success anyway
        if (!existingOrder) {
            console.log(`Order ${orderId} not found - likely a test notification`)
            return new Response(
                JSON.stringify({ success: true, message: 'Test notification received' }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            )
        }

        // Update order status in database
        const { error: updateError } = await supabaseClient
            .from('orders')
            .update({
                status: orderStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)

        if (updateError) {
            console.error('Failed to update order:', updateError)
            throw updateError
        }

        console.log(`Order ${orderId} updated to status: ${orderStatus}`)

        return new Response(
            JSON.stringify({ success: true, message: 'Notification processed' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Webhook error:', error)
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
})
