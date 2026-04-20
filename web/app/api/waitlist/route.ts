import { Resend } from 'resend'
import { NextResponse } from 'next/server'

interface WaitlistBody {
  email: string
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: WaitlistBody

  try {
    body = (await request.json()) as WaitlistBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = body.email?.trim()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID

  if (!apiKey || !audienceId) {
    return NextResponse.json({ error: 'Waitlist not configured' }, { status: 500 })
  }

  const resend = new Resend(apiKey)

  try {
    await resend.contacts.create({
      email,
      audienceId,
      unsubscribed: false,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Resend error:', err)
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
  }
}
