import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { isValidEmail } from '@/lib/email'

interface WaitlistBody {
  email: string
}

// Per-instance rate limiter: max 5 submissions per IP per 60s window.
// In-memory, resets on cold start. Production: replace with Vercel KV or middleware.
const ipLog = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT = 5
const WINDOW_MS = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()

  // Prune expired entries to prevent unbounded Map growth in warm instances.
  for (const [key, val] of ipLog) {
    if (now - val.windowStart > WINDOW_MS) ipLog.delete(key)
  }

  const entry = ipLog.get(ip)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    ipLog.set(ip, { count: 1, windowStart: now })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

export async function POST(request: Request): Promise<NextResponse> {
  const headersList = await headers()

  // Prefer x-real-ip (Vercel's verified client IP) over x-forwarded-for,
  // which can be spoofed by including a fake IP as the first entry.
  const ip =
    headersList.get('x-real-ip') ??
    headersList.get('x-forwarded-for')?.split(',').at(-1)?.trim() ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: WaitlistBody

  try {
    body = (await request.json()) as WaitlistBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()

  if (!email || !isValidEmail(email)) {
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
