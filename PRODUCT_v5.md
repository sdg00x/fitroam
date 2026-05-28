# FitRoam — Product v5

**Status:** Active product spec. Supersedes PRODUCT_v4.
**Last updated:** May 22, 2026
**Author:** Samuel + Claude

---

## One-line positioning

**FitRoam is the gym-finder for travellers, with an AI concierge that does the planning for you.**

That's it. Everything else — passport, trips, matching, profile — supports that line.

---

## Product evolution — North Star vs v1 reality

**North Star (eventual product):** Walk-in temporary access. A traveller lands in any city, opens FitRoam, sees gyms that take walk-ins today, sees prices, gets in the door with a QR or short booking. End-to-end transactional. This is the dream.

**v1 reality:** Intelligence and planning. Without gym partnerships and without scraped pricing data, we cannot deliver the transactional product yet. So v1 is the **intelligence layer** that earns the right to build the transactional layer later.

### Why this sequencing makes sense

- Gym partnerships take months per chain and require negotiation power. We have neither yet.
- Building the marketplace before having users is backwards — gyms will not partner with an empty app.
- The intelligence product is genuinely useful on its own (Strava, Komoot, AllTrails all charge for the intelligence layer, not for brokering activities).
- Every user we onboard for intelligence is a user we can leverage in partnership conversations later ("we have 5K active users walking into your gym monthly — let us integrate booking").

### What v1 commits to

- Match engine that genuinely differentiates gyms by activity, equipment, location, hours, rating
- Trip planning across cities
- AI concierge (the headline value, gates the subscription)
- Fitness passport — long-term habit hook AND future partnership leverage
- "Log visit" semantics — we are NOT brokering access, the user is logging what they did

### What v1 explicitly does NOT do

- Broker bookings or transactions
- Promise pricing accuracy (we don't have the data)
- Guarantee gym entry
- Take a commission per visit
- Verify the user actually got in

### v1.x and v2 trajectory

- **v1.0:** Intelligence + subscription. Ship in 6-8 weeks. Earn users.
- **v1.x:** Add price-on-demand via AI concierge (Phase 2). Manual pricing layer for top 100 gyms per city (paid contractor work). Start partnership conversations with major UK chains.
- **v2.0:** Integrated booking with partnered chains. Real walk-in access in launch markets. Per-transaction revenue stream alongside subscription.

The North Star stays in view. Every v1 decision is measured against whether it earns the right to v2.

## What changed from v4

Two strategic decisions made in late May 2026:

### 1. Routes and Parks pillars scrapped

PRODUCT_v4 framed FitRoam as a multi-pillar fitness travel app — gyms, running routes, outdoor parks. v5 drops routes and parks entirely.

**Reasoning:** Strava, Komoot, AllTrails, and OSM-powered apps already solve route discovery extremely well. Outdoor calisthenics maps exist as community-maintained projects. Trying to compete in those verticals would dilute FitRoam's focus and waste build time on undifferentiated features.

**Implication:** FitRoam is now a focused gym-discovery product. Anyone wanting routes uses Strava. Anyone wanting parks uses OSM. FitRoam owns the gym vertical for travelling fitness people.

This sharpens the pitch. Specialist beats generalist when the specialty is undersolved — and gyms for travellers genuinely is undersolved.

### 2. Human concierge replaced by AI concierge

PRODUCT_v4 had a human concierge as the premium tier — curated gym selection, personalised recommendations, human support. v5 replaces this with an AI concierge layer powered by a Claude or OpenAI integration.

**Reasoning:** Human concierge doesn't scale, requires city-by-city rollout, has high operational cost, and is the biggest single source of risk in the business model. AI concierge with access to the user's profile, trips, gym data, and match engine can deliver 80% of the value at near-zero marginal cost, available globally on day one.

**Implication:** The differentiation moves from "human curation" to "AI that knows your full context and orchestrates the app for you." This is a more durable moat — your data plus your matching logic plus a constrained AI is harder to replicate than hiring concierges.

The AI is **constrained to FitRoam's data and tools** — not a free-roaming LLM. It can call match engine queries, read user profile, check trips, suggest gyms. It cannot invent gyms, recommend places outside the database, or freelance answers.

**User control:** Some users will love the AI, some will find it intrusive. FitRoam respects that — there's a setting to hide the AI assistant entirely. Hide it and you have a clean gym-discovery app. Show it and you have a personal fitness travel agent.

---

## The product

### Core promise

Land in any city. Open FitRoam. Find a gym that matches how you actually train, within your budget, in walking distance, with the equipment you need today. Get day-pass or short-term access without the friction.

### Core features

**1. Smart gym matching.** Match score per gym based on training pattern, primary activity, facilities, lifestyle preferences, priorities, budget, and proximity. The match engine is the core IP.

**2. Fitness passport.** Every gym you train at adds a stamp. Cities visited, gyms accessed, sessions logged. Travel-fitness identity, built by use.

**3. Multi-leg trip planning.** Plan a trip with multiple cities, see your training plan across legs, save gyms for each leg. Built-in budget tracking per trip.

**4. Today's training.** Daily prompt — based on your training pattern, here's what you're training today, here's what equipment you need, here's a gym near you that fits. Daily-use hook.

**5. AI concierge** (gated, hideable). Ask FitRoam in natural language: "Plan a 5-day trip to Lisbon with PPL gyms," "Find me a push-friendly gym near Soho," "Book a day pass at the top match for Saturday." The AI uses your profile, trips, and the match engine to answer. Available from a floating button on every screen, hideable in Settings.

### Activities supported (v1)

**Lifting, CrossFit, Calisthenics, Staying in shape, Powerlifting, Bodybuilding.** The match engine and AI concierge serve these activities fully.

**Running** — supported as a planning element, not a tracking product. v1 surfaces 3-5 popular running routes per city (sourced from OSM or public route data), viewable on Trip Detail and known to the AI concierge. We do not build run tracking, route creation, social features, or GPX export. Strava remains the place to actually do the running.

**Pilates and Yoga — v1.1 consideration.** Not supported in v1.

**Everything else** (cycling, swimming, climbing, martial arts, group classes) — out of scope.

## What FitRoam does not do

- Running routes (use Strava / Komoot)
- Outdoor calisthenics parks (use OSM / community maps)
- Yoga studios, climbing gyms, swimming pools (out of scope for v1 — gym-first)
- Workout programming (use Hevy / Strong / your coach)
- Nutrition tracking (use MyFitnessPal / Cronometer)
- Personal training booking (out of scope — adjacent business)
- Hotel / flight booking (use Booking.com / Skyscanner)

Saying no to these is the product.

---

## Target user

**Primary:** Fitness-conscious remote workers and travelling professionals who train consistently and don't want their travel schedule to break their routine. Lift weights, do CrossFit, or have a structured training plan. Travel 2-10 times per year, mix of business and leisure.

**Secondary:** Digital nomads who relocate every few weeks. Need a sustainable training setup wherever they land.

**Not the target:** Casual gym-goers who use the gym at home and don't care while travelling. Tourist hotel-gym users. People whose training is fully bodyweight.

---

## AI concierge — detail

### Capabilities

**Plan:** "Plan my gym trip to Lisbon next week" → AI reads upcoming trip, suggests gym options per day based on training pattern, returns curated plan.

**Find:** "Push-friendly gym near my hotel under £20/day" → AI calls match engine with relevant filters, returns top matches with brief reasoning.

**Compare:** "Is PureGym Piccadilly or The Gym Group better for my training?" → AI looks at both gyms, references user's profile, gives a recommendation with reasoning.

**Remember:** "What gyms have I trained at in Berlin?" → AI reads passport, returns visited gyms with dates.

**Act (Phase 2):** "Book a day pass at the top match for Saturday morning" → AI calls access endpoint, confirms, returns confirmation. Requires explicit user approval before destructive actions.

### Constraints

- Only reads/writes FitRoam data — does not invent gyms or hallucinate facts.
- Always returns real gym references with IDs the user can tap into.
- Pricing and availability information sourced from the database, not generated.
- No advice about training programming (out of scope).
- No advice about non-gym fitness (out of scope).

### Placement

- Floating sparkle button (acid green, FitRoam-branded) on every screen, bottom-right above the tab bar.
- Tap opens a sheet — message thread, input field, voice input button.
- Each message can include action chips ("View this gym," "Add to trip," "Compare").
- Hideable globally in Settings → "Show AI assistant."

### User trust principles

- AI shows its sources. "I found this gym in your match results" / "From your trip to Lisbon."
- Destructive actions require confirmation.
- AI says "I don't know" rather than guessing.
- User can correct the AI inline ("That's not what I meant") and the conversation adjusts.

---

## Business model

### Working hypothesis (to be validated post-launch)

**Free tier:**
- Browse gyms, see matches, plan trips
- Save unlimited gyms to passport
- Basic AI concierge (limited queries per day)

**Paid tier (~£5-10/month):**
- Unlimited AI concierge
- Priority match scoring
- Advanced filters (open at specific hour, equipment-specific)
- Trip cost optimization

Affiliate revenue from gym partnerships is a possible secondary stream but not relied on for launch economics.

To be confirmed before TestFlight launch.

---

## Brand and tone

**Voice:** Direct, knowledgeable, slightly opinionated. The kind of friend who's a serious lifter and travels a lot.

**Visual:** Dark, confident, focused. Acid green accent. Clean typography. Real photos of real gyms, not stock images. No fluff.

**Anti-patterns:**
- Generic fitness wellness aesthetic (gradients, soft pastels, mindfulness imagery)
- Overly enthusiastic copy ("Let's crush your goals!")
- Gamification gimmicks (streaks, badges beyond the passport, leaderboards)

---

## Out of scope for v1 launch

- Routes pillar (permanently scrapped)
- Parks pillar (permanently scrapped)
- Yoga / climbing / swimming verticals
- Social features (following, sharing, leaderboards)
- Workout programming
- Nutrition tracking
- Community / forums
- Multi-language support (English only at launch)
- Currency conversion beyond GBP/EUR/USD

These exist as deliberate exclusions. Don't reintroduce without explicit reasoning.

---

## Success metrics for v1

- 500 active users in first 90 days
- 50% of users complete at least one gym visit through the app
- 30% of users plan a trip in the app
- AI concierge used by 60% of users who don't disable it
- 10% conversion to paid tier
- 4.5+ App Store rating

These are aspirational, not guaranteed. Used to direction-set, not to chase.

---

## Decision log

Maintained here to preserve reasoning for future-self and team:

- **May 22, 2026:** Routes and Parks pillars scrapped. Reason: undifferentiated, dilutes focus, existing apps solve it well.
- **May 22, 2026:** Human concierge replaced with AI concierge. Reason: scales globally, near-zero marginal cost, durable moat via constrained AI over FitRoam data.
- **May 22, 2026:** AI assistant hideable in Settings. Reason: respect user choice, de-risk feature for users who find AI intrusive.
- **May 22, 2026:** Product evolution sequenced. v1 = intelligence/planning (achievable solo, 6-8 weeks). North Star = walk-in temporary access (requires gym partnerships, deferred to v2). v1 earns the right to v2.
- **May 22, 2026:** Pricing data not collected for v1. Cannot honestly score budget or filter by price. "Get access" reframed as "Visit gym / Log visit" — we direct, we don't broker. AI concierge in Phase 2 will fetch pricing from gym websites on demand.
- **May 22, 2026:** Running routes added back to v1 as planning element (view-only, sourced from OSM/public data). Strict scope: no tracking, no creation, no social, no GPX. Argument for inclusion: FitRoam is a planning surface; runners planning trips deserve to see route options alongside gym options.
- **May 22, 2026:** Strava and Whoop integrations evaluated and deferred to post-launch. Neither blocks v1 value prop. Reasons to defer: Strava API approval takes weeks, neither integration solves a problem that breaks the product, better as v1.1/v1.2 press moments.
- **May 22, 2026:** Priority filter list trimmed to what we can honestly score from Google Places data. Removed: cleanliness, quiet, community, beginner-friendly, serious-only. Kept: 24hr, deadlift platform, equipment variety. Reason: respect user choice, de-risk feature for users who find AI intrusive.

