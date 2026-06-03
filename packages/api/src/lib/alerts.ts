import { Resend } from 'resend'

// Lazy init — avoids crashing if RESEND_API_KEY isn't set in some environments
let resendClient: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!resendClient) resendClient = new Resend(key)
  return resendClient
}

type BookingInterestAlertInput = {
  bookingInterestId: string
  userId: string
  userEmail: string
  userName?: string | null
  gymName: string
  gymCity?: string | null
  gymDayPassUrl?: string | null
  gymDayPassPence?: number | null
  source: string
  pricePence: number
  tripName?: string | null
}

function formatPence(p: number | null | undefined): string {
  if (p === null || p === undefined) return '—'
  return `£${(p / 100).toFixed(2)}`
}

/**
 * Send an alert email to the team when a new booking_interest row is created.
 * Best-effort: never throws — logs failures, returns boolean.
 * This is a fake-door alert — the user has shown intent, we follow up manually.
 */
export async function sendBookingInterestAlert(
  input: BookingInterestAlertInput,
): Promise<boolean> {
  const to = process.env.ALERT_TO_EMAIL
  const from = process.env.ALERT_FROM_EMAIL || 'onboarding@resend.dev'
  const resend = getResend()

  if (!resend || !to) {
    console.warn('[alerts] Resend not configured — skipping alert', {
      hasKey: !!process.env.RESEND_API_KEY,
      hasTo: !!to,
    })
    return false
  }

  const subject = `🟢 New early-access tap: ${input.gymName} (${input.userName ?? input.userEmail})`

  const lines = [
    `<h2>New booking interest captured</h2>`,
    `<p><strong>User:</strong> ${input.userName ?? '(no name)'} &lt;${input.userEmail}&gt;</p>`,
    `<p><strong>Gym:</strong> ${input.gymName}${input.gymCity ? ` (${input.gymCity})` : ''}</p>`,
    `<p><strong>Day pass price:</strong> ${formatPence(input.gymDayPassPence)}</p>`,
    input.gymDayPassUrl
      ? `<p><strong>Direct day-pass link:</strong> <a href="${input.gymDayPassUrl}">${input.gymDayPassUrl}</a></p>`
      : `<p><strong>Direct day-pass link:</strong> —</p>`,
    input.tripName ? `<p><strong>Trip:</strong> ${input.tripName}</p>` : '',
    `<p><strong>Source:</strong> ${input.source}</p>`,
    `<p><strong>Shown price to user:</strong> ${formatPence(input.pricePence)}</p>`,
    `<hr/>`,
    `<p><strong>Action:</strong> reply within ~20 min from your normal email. Forward the day-pass link, frame as personal follow-up.</p>`,
    `<p style="color:#666;font-size:12px">booking_interest id: ${input.bookingInterestId} · user_id: ${input.userId}</p>`,
  ]

  try {
    const res = await Promise.race([
      resend.emails.send({
        from,
        to: [to],
        subject,
        html: lines.filter(Boolean).join('\n'),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Resend timeout after 10s')), 10000)),
    ]) as any
    if ((res as any)?.error) {
      console.error('[alerts] Resend returned error', (res as any).error)
      return false
    }
    console.log('[alerts] booking interest alert sent', { id: input.bookingInterestId })
    return true
  } catch (err) {
    console.error('[alerts] Failed to send', err)
    return false
  }
}
