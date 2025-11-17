import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
  })

  try {
    const supabase = createRouteClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar perfil do coach
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.stripe_account_id) {
      return NextResponse.json({ error: 'Conta Stripe não encontrada' }, { status: 404 })
    }

    const searchParams = req.nextUrl.searchParams
    const limit = Math.min(Number(searchParams.get('limit') || 25), 100)
    const startingAfter = searchParams.get('starting_after') || undefined
    const endingBefore = searchParams.get('ending_before') || undefined
    const statusFilter = searchParams.get('status')?.toLowerCase() || 'all'
    const searchTerm = searchParams.get('search')?.toLowerCase()
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const stripeParams: Stripe.ChargeListParams = {
      limit,
    }

    if (startingAfter) {
      stripeParams.starting_after = startingAfter
    }

    if (endingBefore) {
      stripeParams.ending_before = endingBefore
    }

    if (startDate || endDate) {
      stripeParams.created = {}
      if (startDate) {
        stripeParams.created.gte = Math.floor(new Date(startDate).getTime() / 1000)
      }
      if (endDate) {
        stripeParams.created.lte = Math.floor(new Date(endDate).getTime() / 1000)
      }
    }

    // Buscar pagamentos com os filtros aplicados
    const charges = await stripe.charges.list(stripeParams, {
      stripeAccount: profile.stripe_account_id,
    })

    let filteredCharges = charges.data

    if (statusFilter !== 'all') {
      if (statusFilter === 'refunded') {
        filteredCharges = filteredCharges.filter((charge) => charge.refunded || (charge.amount_refunded || 0) > 0)
      } else {
        filteredCharges = filteredCharges.filter((charge) => charge.status === statusFilter)
      }
    }

    if (searchTerm) {
      filteredCharges = filteredCharges.filter((charge) => {
        const email = charge.billing_details?.email?.toLowerCase() || ''
        const name = charge.billing_details?.name?.toLowerCase() || ''
        const description = charge.description?.toLowerCase() || ''
        return email.includes(searchTerm) || name.includes(searchTerm) || description.includes(searchTerm)
      })
    }

    const summary = filteredCharges.reduce(
      (acc, charge) => {
        const fees = charge.application_fee_amount || 0
        acc.gross += charge.amount || 0
        acc.fees += fees
        acc.net += (charge.amount || 0) - fees
        acc.refunded += charge.amount_refunded || 0
        return acc
      },
      { gross: 0, net: 0, fees: 0, refunded: 0 }
    )

    const payments = filteredCharges.map((charge) => ({
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      created: charge.created,
      description: charge.description || '',
      customer_email: charge.billing_details?.email || '',
      customer_name: charge.billing_details?.name || '',
      payment_method: charge.payment_method_details?.type || 'card',
      refunded: charge.refunded,
      net_amount: (charge.amount || 0) - (charge.application_fee_amount || 0),
      application_fee_amount: charge.application_fee_amount || 0,
      amount_refunded: charge.amount_refunded || 0,
      receipt_url: charge.receipt_url || '',
      invoice_id: typeof charge.invoice === 'string' ? charge.invoice : charge.invoice?.id || null,
      subscription_id:
        typeof charge.subscription === 'string' ? charge.subscription : charge.subscription?.id || null,
    }))

    const nextCursor = charges.has_more && charges.data.length > 0 ? charges.data[charges.data.length - 1].id : null
    const prevCursor = charges.data.length > 0 ? charges.data[0].id : null

    return NextResponse.json({
      payments,
      total: filteredCharges.length,
      has_more: charges.has_more,
      next_cursor: nextCursor,
      prev_cursor: prevCursor,
      summary,
    })
  } catch (error: any) {
    console.error('[List Payments] Erro:', error)
    return NextResponse.json(
      {
        error: error.message || 'Erro ao buscar pagamentos',
      },
      { status: 500 }
    )
  }
}
