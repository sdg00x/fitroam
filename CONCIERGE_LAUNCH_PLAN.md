> **⚠️ SUPERSEDED — May 22, 2026**
>
> This document described the human concierge plan. That approach has been replaced by an AI concierge — see PRODUCT_v5.md and BUILD_STATUS_v2.md.
>
> Kept in repo for historical reasoning only. Do not implement.

# FitRoam — Concierge Launch Plan

**Status:** Living document. Decisions captured here are committed unless explicitly revised.
**Last updated:** May 20, 2026
**Companion to:** PRODUCT_v4.md, fitroam_global_roadmap_v2.html, fitroam_ecosystem_strategy.html
**Author:** Samuel

---

## Part 1 — Why this document exists

PRODUCT_v4 defined what FitRoam is. This plan defines how FitRoam makes its first pound.

The shift this captures: FitRoam was conceived as a discovery layer that redirects users to gym websites to complete bookings. That model fails as a product — retention dies the moment the user leaves the app, trust never compounds because FitRoam never demonstrates competence at the hard part, and revenue requires affiliate programs that most gyms don't run for day passes. A FitRoam built on redirection is a TripAdvisor for gyms. The category we're actually after is closer to Booking.com or Airbnb — products that hold the transaction.

Concierge access is how FitRoam holds the transaction from day one, without requiring gym partnerships before launch. The user pays FitRoam. FitRoam (a real person, manually, at small scale) books the gym on the user's behalf. The user never leaves the app. The transaction is the product.

This plan captures the structural, operational, financial, and legal decisions required to launch concierge cleanly. It is the input to a 6-9 session build sequence that follows the planning phase.

---

## Part 2 — The core decisions

### Launch city
**London only at launch.** Other UK cities (Manchester, Birmingham, Leeds, Edinburgh) are added opportunistically if inbound demand to those cities is meaningful in the first 30 days. International cities (NYC, Toronto, etc.) wait for Stage 2-3 of the global roadmap as per the original plan.

### Booking SLA
**Same-day bookings confirmed within 30 minutes. Advance bookings (24+ hours out) confirmed within 4 hours.**

This is the public promise. It incentivizes users to book in advance (good for the business, good for sleep), and it gives operational headroom for same-day requests without requiring 24/7 vigilance.

Concrete: a user booking access for tomorrow morning at 11pm tonight gets confirmation by 8am tomorrow. A user booking access for right now at 11pm tonight gets confirmation by 11:30pm tonight. A user booking three days out gets confirmation by midday tomorrow at latest.

### Booking promise (the words users see)
**"We always get you in or refund instantly."**

This is the strong version. It's harder to deliver but signals professionalism and confidence — the kind of statement that turns a user into an advocate when it works.

What "get you in" means operationally:
- Gym confirmation received (email or in-app)
- Day pass valid for the requested date and gym
- User can walk in and train without further FitRoam involvement

What "refund instantly" means operationally:
- Full refund of user payment within 5 minutes of failure determination
- Stripe webhook automation for the refund — not manual
- Apology + a credit equal to the FitRoam service fee for next booking

What triggers the refund:
- Gym website rejects booking
- Gym refuses third-party day passes
- Payment by FitRoam's card declined and not resolvable
- Confirmation not received within the SLA window
- User changes mind within 30 minutes of booking (grace period)

### Pricing model (v1, test and adjust)

| Scenario | Margin rule | Example |
|----------|-------------|---------|
| Single day pass | +20% on raw price | £20 → £24 |
| 1-day stay (one visit) | Same as single pass | £20 → £24 |
| 2-7 day stay, day passes optimal | +15% on total | 4 × £20 = £80 → £92 |
| 2-7 day stay, weekly pass optimal | +25% on the weekly pass | £85 weekly → £106 |
| 7-30 day stay, monthly pass optimal | +30% on the monthly pass | £85 monthly → £110 |
| All bookings | Flat £3 concierge fee | added on top |
| All bookings | Stripe fees passed through | ~£0.50-£1 added on top |

Smart pricing logic: the system auto-detects which pass type is cheapest for the user's stay length. Where FitRoam saves the user money (e.g., monthly instead of 14 day passes saves £100+), the margin is higher because the value is higher. The user sees the savings explicitly: "You'd pay £280 in day passes. We're getting you the monthly for £110 — you save £170."

**The principle: users feel grateful, not extorted.** A £30 markup feels fair when the user just saved £170. A 20% markup on a single day pass is acceptable because the user can't really do better on price elsewhere without the friction.

Status: **v1 pricing**, attached to "test and adjust based on real bookings." After 100 bookings we'll have real data on conversion rates, refund frequency, and user sentiment. Adjust then.

### Legal structure
**Agent of record.**

FitRoam acts as the user's authorized agent to purchase gym access on their behalf. The user authorizes the purchase, FitRoam executes the purchase using the user's name and email, the gym sells the access to the user with FitRoam as the booking intermediary.

This structure means:
- Money flows: user pays FitRoam (£29), FitRoam holds £20 in trust for the gym pass, FitRoam keeps £9 as service fee
- Tax: VAT applies only to the £9 service fee, not the £20 pass-through
- Liability: FitRoam is responsible for the booking experience, not the gym's service quality
- Stripe setup: Stripe Connect with destination charges, not standard Stripe

This is the right structure for FitRoam at MVP because:
- It matches what FitRoam actually does (booking on behalf, not reselling)
- It minimizes legal exposure to gyms that haven't partnered with FitRoam
- It positions FitRoam correctly when partnership conversations begin later

### Personal commitment
**Samuel personally handles the first 50-100 bookings.** No virtual assistant, no automation beyond the Stripe webhook for refunds, no shortcuts. This is the "do things that don't scale" phase. The purpose is to gather real data on:

- How long bookings actually take per gym
- Which gyms are smooth (potential first partners)
- Which gyms refuse or are operationally painful (deprioritize or avoid)
- What user behavior looks like after a successful booking (retention)
- What user behavior looks like after a refund (recovery)

After this data is in hand (estimated 6-10 weeks at projected volume), the next phase begins: hiring a part-time virtual assistant and starting partnership conversations with the most-booked gyms.

### Geographic gating at launch
The app is globally usable for discovery. Anyone in the world can browse, search, plan trips, see gyms. But the "Book day pass" CTA only appears for London. Outside London, the user sees discovery and the option to open the gym's own website. This is the architecture already in place via `serviceCoverage.ts`.

The city switcher coverage badge ("INSTANT BOOKING" for London, neutral for other cities) sets expectations honestly.

---

## Part 3 — Pre-launch checklist

These are real-world tasks with real-world lead times. Most must be started before any code is written so they're ready by launch day.

### Legal and tax
- [ ] **Open UK limited company** if not already (Companies House, £100, same-day online filing)
- [ ] **UK business bank account** (Mettle, Tide, Wise Business, or Starling — 24-48 hours typical)
- [ ] **Register for VAT** if anticipating £85K+ revenue, otherwise voluntary registration to allow VAT reclaim on gym purchases (10-15 business days)
- [ ] **Talk to a startup accountant familiar with agent-of-record structures** — budget £500-1500 for setup conversation, then £200-400/month ongoing. Recommended firms: Crunch, Kruze, Bloom Financials, Cooper Parry. Get two opinions before committing.
- [ ] **Draft Terms of Service** with a UK solicitor experienced in marketplaces and agency structures. Must include:
  - FitRoam is the user's authorized booking agent
  - User consent to use their data for booking
  - Service quality disputes between user and gym (FitRoam assists but isn't the service provider)
  - Refund policy (full refund for failed bookings, no refund for user cancellation after gym confirmation)
  - Data protection compliance (UK GDPR)
  - Budget £500-1500 one-time, talk to two firms before picking
- [ ] **Draft Privacy Policy** covering health/fitness data, payment data, location data
- [ ] **UK IPO trademark filing** for "FitRoam" name (£170 for first class, classes 9 + 41 + 42 recommended)
- [ ] **Public liability and professional indemnity insurance** — £200-500/year for early stage

### Payments and infrastructure
- [ ] **Stripe Connect account** with managed accounts setup. Application typically takes 5-10 business days. KYC requirements include business registration, bank account, ID verification.
- [ ] **Webhook infrastructure** for payment events (creation, success, failure, refund). Lives in the API server.
- [ ] **Email delivery service** (Resend, Postmark, or SendGrid) for confirmation emails. ~£10-30/month for low volume.
- [ ] **Push notification setup** for booking status updates (Expo Push Notifications — free at this scale)
- [ ] **SMS fallback** for critical updates if email fails (Twilio or MessageBird, ~£0.05 per SMS) — optional, evaluate after first 50 bookings

### Operations
- [ ] **A dedicated business card** for paying gyms — Mettle and Tide both offer cards instantly with account opening. This card sees high volume of small charges and will trigger fraud detection if it's your personal card.
- [ ] **Email account** like `concierge@fitroam.com` for gym communications and booking notifications. Forwards to your personal email but presents professionally.
- [ ] **A booking ops dashboard** built into the API (web view at `/ops` behind a password) — shows pending bookings, gym website links, user details to enter, status states, refund button. This is part of the code build.
- [ ] **Personal availability commitment**: 30 days of high-availability following launch. No multi-day trips. Phone on. Refund button accessible. After 30 days, evaluate whether to extend solo or bring in VA help.

### Launch criteria
Don't launch publicly until:
- [ ] First 10 friends-and-family test bookings completed end-to-end
- [ ] Refund flow tested with at least one deliberately failed booking
- [ ] Terms of Service published and accepted in onboarding
- [ ] At least 3 different London gym types tested (commercial chain, independent, boutique) to confirm the model works across them
- [ ] You personally have used the booking flow as a user (book yourself a gym pass through the app)

---

## Part 4 — Build sequence

Six sessions of focused work. Each builds on the previous. Order matters.

### Session 1 — Stripe Connect + API foundation
- Stripe Connect setup (live mode + test mode)
- Webhook endpoint at `/api/webhooks/stripe` for payment events
- New `Booking` table in schema:
  - `id`, `userId`, `gymId`, `gymPlaceId`, `dateRequested`, `passType`, `userPaidPence`, `gymCostPence`, `serviceFeePence`, `stripePaymentIntentId`, `status` (pending/confirming/confirmed/failed/refunded), `confirmationEmail`, `failureReason`, `createdAt`, `confirmedAt`, `refundedAt`
- Booking creation endpoint that creates a payment intent without capturing
- Booking retrieval endpoint for the app to poll status

### Session 2 — Booking flow UI (mobile)
- Refactor the existing "I'm going" modal into "Book day pass" for concierge cities
- New booking confirmation screen — "Securing your access" with live status polling
- Push notification registration on first booking
- Success state — booking details, gym address, "how busy it is" placeholder, "add to calendar" CTA
- Failure state — apology, refund confirmation, alternative gym suggestions

### Session 3 — Ops dashboard
- New web route at `/ops` in the API server, password-protected
- List of pending bookings (oldest first), with:
  - User name, email, requested gym, date, pass type
  - Gym website link (one click to open)
  - Status state machine: pending → in-progress → confirmed → failed
  - Notes field for ops history
  - Mark confirmed (sends email + push to user)
  - Mark failed + auto-refund (Stripe refund + email + push)
- Daily summary view — bookings today, revenue today, failures today

### Session 4 — Pricing engine
- Backend service that takes (gym, dateRequested, stayLengthDays) and returns:
  - Recommended pass type (day/weekly/monthly)
  - Gym cost in pence
  - FitRoam markup in pence (per the v1 rules)
  - Concierge fee (£3)
  - Stripe fees estimate
  - User-facing total
  - Savings vs alternative pass types (for the "you save £170" framing)
- Update the booking UI to use this engine
- Smart pricing card before payment: "You're getting the monthly because you save £170 vs day passes"

### Session 5 — Service coverage gating + ToS
- Update gym detail screen to branch: concierge cities show "Book day pass" CTA, non-concierge cities show current "Open website" flow
- Update onboarding to surface Terms of Service acceptance (signed by user before first booking)
- Update Explore coverage badge to show "INSTANT BOOKING — London" when in a concierge city
- Update city switcher to surface coverage status in results

### Session 6 — Email templates + final polish
- Booking confirmation email template (sent when ops marks confirmed)
- Booking failure email template (sent with refund notification)
- Welcome email after first booking
- Send via the configured email service
- Test end-to-end with a real booking using your own card

After session 6: friends-and-family soft launch, then public launch when launch criteria are met.

---

## Part 5 — Risk register

Real things that could go wrong, with mitigations.

### Operational risks

**Risk:** Booking volume exceeds Samuel's personal capacity (>10 bookings/day sustained).
**Mitigation:** Cap visible booking availability in the app. When a daily limit is hit, the "Book day pass" CTA becomes "Waitlist for tomorrow." Soft cap forces sustainability.

**Risk:** Samuel unavailable due to illness, emergency, or burnout.
**Mitigation:** Have one trusted backup person (friend, family) trained to handle the ops dashboard for emergencies. Pre-written response template ready. Plan to extend to a VA at the 30-day evaluation point.

**Risk:** Gym website is down or booking platform changes.
**Mitigation:** The failure pathway triggers — refund instantly, notify user, offer alternatives. Build a small note in the ops dashboard for tracking which gyms have problems.

### Legal and trust risks

**Risk:** A gym chain notices booking volume from one card and accuses FitRoam of reselling.
**Mitigation:** Agent-of-record ToS clearly positions FitRoam as the user's booking agent. Each booking uses the user's name and email. Document the legal position with a solicitor before launch so there's a defensible response.

**Risk:** User claims FitRoam failed to deliver and demands consequential damages (lost gym time, lost training day, etc.).
**Mitigation:** Agent-of-record liability cap is the service fee. ToS explicitly limits FitRoam's liability to the amount paid for the service. Plus professional indemnity insurance for genuine errors.

**Risk:** Negative public review goes viral.
**Mitigation:** Refund-first policy means any failure already comes with money returned. Active monitoring of social media, App Store reviews. Personal response from Samuel to any negative review within 24h.

### Financial risks

**Risk:** Card fraud detection on the gym-paying card blocks bookings.
**Mitigation:** Use a dedicated business card for booking. Notify the card issuer of expected high-frequency small charges to gyms. Have a backup card ready.

**Risk:** Refund volume exceeds revenue (operational unviability).
**Mitigation:** If refund rate exceeds 15% over a week, pause new bookings and triage. Identify failing gyms, deprioritize them. The 15% threshold is the point at which the model breaks economically.

**Risk:** Pricing rules don't match user willingness to pay; conversion is low.
**Mitigation:** v1 pricing is explicitly test-and-adjust. After 100 bookings, review conversion rate, abandonment rate, refund rate. Adjust margins if needed.

---

## Part 6 — Success criteria

What "launched and working" actually looks like:

**First 30 days post-launch:**
- 25+ paid bookings completed
- Refund rate under 15%
- At least 5 users with repeat bookings (returns after first)
- No legal complaints from any gym chain
- Zero security incidents (Stripe, data, etc.)

**60 days post-launch:**
- 100+ paid bookings
- 3 gyms identified as partnership candidates (high volume + smooth ops)
- Initial conversations with 1-2 of those gyms about formal partnership
- VA recruited and trained
- Refund rate under 10%

**90 days post-launch:**
- 250+ paid bookings
- First formal partnership signed
- Monthly revenue covering ops costs (Stripe fees, accountant, email service, etc.) — even if Samuel still unpaid
- Considering: Manchester or Birmingham as second concierge city

**6 months post-launch:**
- 1,000+ bookings cumulative
- 5+ partner gyms (better margins)
- Monthly revenue covering Samuel's living costs at survival rate
- Investor conversations begin — pre-seed deck reflects real revenue, real users, real partnerships

---

## Part 7 — What this commits Samuel to

This document captures real personal commitments. Worth stating them plainly so the eyes are open before signing.

- **Time:** 30 days of high-availability following public launch. Phone on. Booking dashboard checked at minimum every 30 minutes during waking hours, and last-thing-at-night before sleep.
- **Money:** Estimated £2,000-4,000 in pre-launch costs (legal, accounting, trademark, insurance, Stripe setup). Capital should be in place before starting the build.
- **Risk:** Real legal and operational exposure. Mitigated by structure, insurance, and Terms of Service — but not eliminated.
- **Boundary:** No public claims that aren't operationally true. No "instant booking" if it's actually a 30-minute SLA. No "guaranteed access" if there are scenarios where it fails. The strong booking promise (option A — "always get you in or refund instantly") works only if it's defended honestly.
- **Patience:** First 50-100 bookings are loss-leading for sustainability, even if individually profitable. Margin is intentionally compressed by personal time investment to gather data. Profitability per booking scales after partnerships.

---

## Part 8 — Where this fits in the broader roadmap

The global roadmap (Stage 1) said: UK validation, 1K MAU, free, pre-seed potential. This concierge launch plan modifies Stage 1:

- Still UK validation
- Still pre-seed scale (1K-25K MAU target range)
- **No longer free** — revenue from day one via concierge bookings
- Pre-seed conversations happen with real revenue data (3-5x easier to fundraise with revenue than without)

Stages 2-6 of the global roadmap remain as written, with one adjustment: monetisation moves from "Stage 2, 2027" to "Stage 1, 2026." This is a meaningful acceleration. The Stage 2 plan (Toronto + Pro subscription) still makes sense but builds on revenue-already-flowing rather than introducing revenue for the first time.

This document doesn't replace PRODUCT_v4. It sits alongside it. PRODUCT_v4 describes what FitRoam does. This document describes how FitRoam makes money. The two reference each other but cover different surface areas.

---

## Part 9 — Open questions to revisit

Things deliberately not locked here because they need real-world data first:

- **Pricing.** Marked v1, test and adjust. Real data after 100 bookings.
- **SLA exactness.** "Confirmed within 30 minutes" is the target — first 30 days will show whether it's achievable, too aggressive, or too generous.
- **Refund grace period.** 30 minutes is a guess. May need to extend to 24 hours or restrict to "before gym is contacted."
- **Booking cap per day.** A soft limit will exist, but the exact number depends on how long bookings actually take in practice.
- **Manchester or Birmingham as second city.** Depends on inbound demand patterns. May happen at 30 days or 90 days.
- **Subscription tier (FitRoam Pro).** Stage 2 of the roadmap. Likely £6-8/month for unlimited cancellation reminders, priority booking, savings tracking. Don't build until concierge is proven.

---

## Part 10 — How to use this document

**For Samuel:** Read this end-to-end before starting the build. Review weekly during the build phase. Revisit and update after launch based on real data.

**For Claude:** Read this at the start of any concierge-related work. If anything in the build conflicts with this plan, raise it before building. This document and PRODUCT_v4 together are the source of truth.

**Update cadence:** Quarterly during normal operations. Immediately after the first 30 days post-launch. Immediately after any major decision (first partnership signed, first city added, first VA hired).

---

## Changelog

- **May 20, 2026:** Initial document. Written at the end of a session that shipped multi-leg trip planning end-to-end. Captures the shift from "redirect to website" model to concierge transactional model. Companion to PRODUCT_v4 (product) and global roadmap v2 (strategy).
