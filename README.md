# Andhra Pradesh Citizen Connect

# Problems@AP — Master Frontend Design & Product UI Prompt

Build the frontend for **Problems@AP**, a public citizen-driven problem reporting and discovery platform for Andhra Pradesh.

This is NOT an AI SaaS dashboard.

This is NOT a generic complaint-management template.

This is NOT a government portal redesign.

This is a serious, modern, citizen-first public platform where people can discover and report real-world problems affecting ordinary citizens across Andhra Pradesh.

The product should feel like a real public product that could launch, not an AI-generated prototype.

---

# 1. PRODUCT PURPOSE

Problems@AP exists around one simple principle:

> **A problem does not stop being a problem because nobody reported it.**

Citizens should be able to:

* Discover problems reported around Andhra Pradesh
* Browse problems by department/ministry
* Browse problems by category
* See problems near their location
* Report a problem without creating an account
* Provide the problem description
* Provide location/GPS
* Provide the report timestamp automatically
* Attach photographic evidence
* See the current status of a reported problem
* See whether other citizens have reported/confirmed the same problem
* Open a problem and understand what is happening
* Track a problem through its public status/history

The frontend must make all of this extremely easy.

---

# 2. VERY IMPORTANT PRODUCT CONSTRAINT

There is NO citizen authentication in this version.

Do NOT create:

* Login
* Sign up
* Password
* OTP
* Google authentication
* Profile pages
* User accounts
* Account dashboards
* Social profiles

The citizen does not need to identify themselves.

The reporting flow should rely on:

* GPS/location
* Automatic timestamp
* Problem description
* Evidence/photo
* Anonymous report ID

After submission, generate an anonymous report reference such as:

`AP-7F92K4`

The user can use this reference to revisit their report.

Do not expose private precise coordinates publicly.

Public interfaces should show an appropriate approximate location/area.

---

# 3. STRICT FEATURE SCOPE

Build ONLY the following product surfaces.

## A. Home

Purpose:

Introduce Problems@AP and immediately let citizens:

* Report a problem
* Explore existing problems
* Search/discover problems
* See major problem categories
* See department-wise problem activity
* See recent/trending problems
* See the geographic distribution of problems

Do NOT add:

* Blog
* Pricing
* Testimonials
* Newsletter
* AI assistant
* Chatbot
* Marketing gimmicks
* Fake company logos
* "Trusted by..."
* SaaS feature grids
* Startup language

---

## B. Explore Problems

A public problem discovery interface.

Users can:

* Search
* Filter by category
* Filter by department
* Filter by location
* Filter by status
* Sort by recent
* Sort by nearby
* Sort by most reported

Problems should be represented clearly and compactly.

Each problem card/list item should communicate:

* Problem title
* Category
* Department
* Approximate location
* Reported time
* Number of related reports
* Status
* Evidence indicator

The interface should feel closer to a refined combination of:

**Airbnb discovery + Linear issue management + Intercom information hierarchy**

than a government complaint table.

---

# 4. DEPARTMENT / MINISTRY DISCOVERY

Problems@AP must support department-wise discovery.

The departments include the Andhra Pradesh government areas discussed for this product, including:

* General Administration
* Law & Order
* Public Enterprises
* Panchayati Raj
* Rural Development & Rural Water Supply
* Environment, Forest, Science & Technology
* Human Resources Development
* IT Electronics & Communication
* Real-Time Governance
* Agriculture
* Co-operation
* Marketing
* Animal Husbandry
* Dairy Development
* Fisheries
* Mines & Geology
* Excise
* Food & Civil Supplies
* Consumer Affairs
* Municipal Administration & Urban Development
* Home Affairs & Disaster Management
* Health
* Family Welfare & Medical Education
* Water Resources Development
* Law & Justice
* Minority Welfare
* Endowments
* Finance & Planning
* Commercial Taxes
* Legislative Affairs
* Revenue
* Housing
* Information & Public Relations
* Social Welfare
* Disabled & Senior Citizen Welfare
* Sachivalayam & Village Volunteer
* Energy
* Tourism
* Culture & Cinematography
* Women & Child Welfare
* Tribal Welfare
* Roads & Buildings
* Infrastructure & Investments
* Industries & Commerce
* Food Processing
* BC Welfare
* Economically Weaker Sections Welfare
* Handlooms & Textiles
* Labour
* Factories, Boilers & Insurance Medical Services
* MSME
* NRI Empowerment & Society for Elimination of Rural Poverty

However:

DO NOT dump all departments into a visually overwhelming homepage.

Use a clean department directory.

Allow citizens to enter naturally through the problem itself.

For example:

`Drinking Water`

→ `Rural Development & Rural Water Supply`

`Road Damage`

→ `Roads & Buildings`

`Drainage`

→ `Municipal Administration & Urban Development`

`Land / Revenue Issue`

→ `Revenue`

The citizen should not need to understand government administrative terminology before reporting a problem.

---

# 5. REPORT A PROBLEM

This is the most important interaction in the entire product.

The reporting flow must be exceptionally simple.

Use a focused multi-step or progressive form, NOT a giant government-style form.

Suggested flow:

### Step 1

"What is the problem?"

Allow the citizen to choose a simple category.

Examples:

* Roads
* Drinking Water
* Drainage
* Garbage & Cleanliness
* Electricity & Street Lights
* Public Transport
* Health
* Government Services
* Land & Revenue
* Education
* Environment
* Other

### Step 2

"Tell us what happened."

Large, comfortable text area.

### Step 3

"Where is it happening?"

Request browser/device location.

Show:

* Location obtained
* Approximate area
* Map confirmation

Do not expose exact coordinates publicly.

### Step 4

"Add evidence"

Allow photographic evidence.

Keep this simple.

Do not add video upload in this version.

### Step 5

Automatic metadata:

* Timestamp
* Location accuracy
* Anonymous report ID

The user should NOT manually enter these.

### Step 6

Review and submit.

The final screen should clearly communicate:

> Your problem has been reported.

Show the report reference.

---

# 6. PROBLEM DETAIL PAGE

Every public problem should have a dedicated page.

Structure:

### Header

Problem title

Category

Department

Status

Approximate location

Reported date/time

### Main content

Problem description

Evidence/photos

Map/location area

### Community signal

Show:

* Number of related reports
* Number of citizens confirming the issue
* Whether the problem appears to be recurring

Do NOT pretend community confirmation means government verification.

Use precise language such as:

"Reported by 18 citizens"

"Confirmed by 11 local reports"

"Official response" only if an actual response exists.

### Timeline

Show:

Reported

→ Related reports

→ Status updates

→ Resolution

Keep the timeline clean and factual.

---

# 7. MAP / LOCATION EXPERIENCE

Location is fundamental to Problems@AP.

Use the map as a useful product surface, not decoration.

Citizens should be able to:

* View problem locations
* Explore nearby problems
* Open problem markers
* Filter problems by category
* Understand clusters of problems

The map should never dominate the entire product.

It is a tool for understanding problems geographically.

Use restrained markers and clustering.

Do not use rainbow-colored map markers.

Do not use excessive map UI.

---

# 8. STATUS SYSTEM

Use a restrained status system.

Possible states:

* Reported
* Under Review
* Forwarded
* Action Initiated
* Resolved
* Closed

Status should be visually understandable but not visually loud.

Use subtle semantic colors only where necessary.

Do not create giant glowing badges.

Do not make every card colorful.

---

# 9. DESIGN DNA — USE THE FIVE REFERENCES

The five supplied design systems are the foundation.

They are:

1. Airbnb
2. Apple
3. Intercom
4. Linear
5. Stripi Inspired / Stripe

Do NOT literally reproduce their branding.

Translate their strongest design principles into Problems@AP.

---

# 10. AIRBNB INFLUENCE

Use Airbnb for:

* Citizen-friendly discovery
* Location-first thinking
* Search experience
* Category browsing
* Comfortable card layouts
* Human visual language
* Soft but controlled corner radius
* Strong photography/evidence presentation
* Generous whitespace
* Easy scanning

Airbnb's source uses a clean white canvas, restrained typography, soft rounded cards, pill search surfaces and photo-led cards.

Adapt this to:

Problem cards instead of property cards.

Problem evidence instead of property photography.

Problem categories instead of travel categories.

Problem location instead of destination discovery.

Do NOT copy Airbnb's Rausch pink.

Do NOT use Airbnb's branding.

---

# 11. APPLE INFLUENCE

Use Apple for:

* Visual restraint
* Typography
* Whitespace
* Product-first presentation
* Minimal chrome
* Strong section rhythm
* Very limited shadows
* Clear hierarchy
* Calm interfaces

Apple's reference deliberately keeps UI chrome almost invisible and avoids decorative gradients and excessive shadows.

Use this principle heavily.

Problems@AP should feel confident because the information is clear, not because the UI is shouting.

IMPORTANT:

This product is LIGHT THEME ONLY.

Do NOT use Apple's dark product tiles.

Do NOT create dark/light alternating sections.

Use only:

* White
* Warm off-white
* Very light neutral surfaces
* Charcoal / near-black typography
* Restrained semantic accents

---

# 12. INTERCOM INFLUENCE

Use Intercom for:

* Warm cream canvas
* Editorial feeling
* Charcoal typography
* White lifted cards
* Hairline borders
* Minimal elevation
* Clean forms
* Calm product presentation
* Structured information

Intercom explicitly uses a soft cream-white canvas rather than pure white, with white cards and charcoal type.

Use this as one of the primary visual foundations.

But DO NOT use Intercom's Fin Orange as the brand color.

That orange belongs to Intercom's product identity, not Problems@AP. The source itself says it is a product-specific accent rather than the system primary.

---

# 13. LINEAR INFLUENCE

Linear is the structural reference.

Use Linear for:

* Issue/problem hierarchy
* Status treatment
* Dense information presentation
* Problem lists
* Filters
* Structured metadata
* Clear navigation
* Product-like precision
* Excellent spacing discipline
* Hairline borders
* Information density

Linear's source is dark, so DO NOT copy its dark canvas.

Instead translate:

Linear's issue list
→ Problems@AP problem explorer

Linear's status badge
→ Problems@AP status

Linear's project information
→ Problems@AP department/location information

Linear's dense product UI
→ Problems@AP civic information

Linear's hierarchy
→ Problems@AP information architecture

Keep the final product entirely light.

---

# 14. STRIPI / STRIPE INFLUENCE

Use this reference selectively.

Take:

* Excellent numerical hierarchy
* Data readability
* Dashboard information organization
* Strong form structure
* Thin typography
* Clear transactional interactions
* Carefully structured cards

The source uses a strong gradient mesh and indigo identity.

DO NOT copy those visual elements.

Specifically:

NO gradient mesh.

NO purple/indigo SaaS hero.

NO atmospheric blobs.

NO generic Stripe-style financial SaaS aesthetic.

Only borrow the structural discipline.

---

# 15. FINAL VISUAL LANGUAGE

Problems@AP must feel:

* Professional
* Civic
* Trustworthy
* Modern
* Calm
* Human
* Editorial
* Precise
* Lightweight
* Mature
* Production-ready

It must NOT feel:

* AI-generated
* Generic SaaS
* Startup landing page
* Government portal
* Dashboard template
* Cryptocurrency app
* Fintech application
* Social media platform
* Marketing website
* Prototype

---

# 16. COLOR SYSTEM

This is extremely important.

DO NOT use the typical AI SaaS blue gradient.

Absolutely NO:

* blue-purple gradient
* indigo glow
* blue tinted cards
* purple backgrounds
* cyan glow
* glassmorphism
* neon borders
* gradient buttons
* gradient text
* glowing map markers

The visual foundation should be:

### Canvas

Warm off-white / soft cream.

Approximate direction:

`#F6F3EE`

### Surface

Pure white:

`#FFFFFF`

### Primary text

Charcoal:

`#171717`

### Secondary text

Warm neutral gray:

`#65635F`

### Tertiary text

`#8B8984`

### Borders

Very subtle warm gray:

`#DEDAD4`

### Secondary surface

`#F2EFEA`

Use ONE restrained brand accent for primary interaction.

Do not make it conventional SaaS blue.

Prefer a sophisticated civic accent such as a muted terracotta / vermilion / earthy red-orange, used very sparingly.

Example direction:

`#C65A3A`

But do NOT flood the interface with it.

The interface should remain approximately:

90% neutral surfaces

8% typography / borders

2% accent

Semantic colors may be used only where their meaning requires them.

---

# 17. TYPOGRAPHY

Do not use the typical:

Inter + giant bold 72px SaaS heading + gradient text.

Instead create a hybrid typographic system inspired by:

* Apple's quiet precision
* Intercom's editorial typography
* Linear's information hierarchy
* Airbnb's modest display weights
* Stripi's lighter editorial density

Use an excellent modern open-source font.

Preferred:

`Inter`

or

`Geist`

or another contemporary neutral grotesk.

Do not use proprietary fonts that cannot reliably ship.

Display:

* Medium / semibold
* Tight tracking
* Never unnecessarily bold

Body:

* Regular
* Comfortable line-height
* Excellent readability

Problem metadata:

* Small
* Structured
* High contrast
* Easy to scan

Avoid excessive uppercase labels.

Avoid tiny unreadable text.

---

# 18. LAYOUT

Use a maximum content width around 1200–1280px.

Keep large margins.

Use an 8px-based spacing system.

Major spacing:

* 8
* 12
* 16
* 24
* 32
* 48
* 64
* 80

Do not make everything float inside cards.

This is important.

Use:

* flat editorial sections
* white cards only where they improve grouping
* hairline separators
* restrained borders

Do NOT make every section a floating rounded rectangle.

---

# 19. CARDS

Cards should feel closer to:

Intercom + Apple + Airbnb

than generic SaaS.

Preferred:

* White background
* 1px subtle border
* 8–16px radius depending on hierarchy
* Minimal or no shadow
* Strong internal spacing
* Clear typography

No:

* giant shadows
* glass
* gradients
* glowing borders
* excessive rounded pills

---

# 20. NAVIGATION

Desktop:

Left:

**Problems@AP**

Center:

* Explore Problems
* Departments
* Map
* How It Works

Right:

**Report a Problem**

The primary action should be immediately visible.

Do not add unnecessary links.

Do not add:

* Pricing
* Login
* Signup
* Profile
* Blog
* Careers
* AI assistant

Mobile:

Use:

Problems@AP + hamburger

Keep:

**Report a Problem**

highly accessible.

---

# 21. HOMEPAGE STRUCTURE

Create this exact hierarchy.

## Navigation

Problems@AP

Explore Problems

Departments

Map

How It Works

Report a Problem

---

## Hero

Headline:

**A problem doesn't stop being a problem because nobody reported it.**

Supporting copy:

**Report problems affecting your area. See what citizens are experiencing across Andhra Pradesh.**

Primary CTA:

**Report a Problem**

Secondary:

**Explore Problems**

The hero should be visually calm.

No giant gradient.

No animated background.

No illustration overload.

A subtle Andhra Pradesh geographic/map visual may be used if it genuinely improves the composition.

---

## Problem Snapshot

Show a small set of real-looking product metrics:

* Problems Reported
* Under Review
* Resolved
* Reports This Month

Keep these factual and visually restrained.

Do not invent absurd numbers.

Use clearly mock/demo data during development.

---

## Explore by Problem

Show practical citizen categories:

Roads

Water

Drainage

Garbage

Electricity

Street Lights

Public Transport

Health

Government Services

Land & Revenue

Environment

Other

Use a clean category grid.

---

## Problems Near You

Location-aware section.

Show:

* nearby problems
* category
* approximate location
* distance
* status

Make the location experience feel natural.

---

## Department View

Show a clean directory of government departments.

Each department should display:

* Department name
* Number of reported problems
* Number currently unresolved

Keep this compact.

---

## Recent Problems

Use image/evidence-led cards.

Each card:

* evidence image
* category
* title
* location
* time
* report count
* status

Use Airbnb's content discovery discipline without copying its branding.

---

## Map Preview

A clean map showing problem clusters across Andhra Pradesh.

CTA:

**Explore the Map**

---

## Footer

Minimal.

Problems@AP

Short explanation.

Navigation.

Privacy.

Terms.

Report a Problem.

No giant marketing footer.

---

# 22. MICRO-INTERACTIONS

Keep animation extremely restrained.

Use animation only when it improves comprehension.

Allowed:

* subtle hover transition
* button press feedback
* card hover lift of 1–2px
* map marker transition
* smooth drawer opening
* subtle page transitions
* loading skeletons

Not allowed:

* parallax
* floating blobs
* animated gradients
* cursor-following effects
* excessive scale animations
* bouncing cards
* spinning decorative icons
* auto-playing carousels
* scroll-jacking
* dramatic entrance animations

The product should feel fast even if animation is disabled.

---

# 23. FORMS

Forms should follow the combination of:

Airbnb's friendly reporting surface

*

Apple's clean input treatment

*

Intercom's restrained form system

*

Linear's precision

Use:

* clear labels
* large readable fields
* obvious focus state
* no glowing focus rings
* no unnecessary helper text
* strong validation messages
* comfortable spacing

The location step should feel especially polished.

---

# 24. ACCESSIBILITY

Build proper accessibility from the beginning.

Requirements:

* keyboard navigation
* visible focus states
* semantic HTML
* accessible labels
* 44px minimum touch targets where practical
* good color contrast
* reduced-motion support
* screen-reader-friendly form labels
* accessible map controls
* accessible status indicators

Do not communicate important status information using color alone.

---

# 25. RESPONSIVE DESIGN

Do not simply shrink desktop.

Design deliberately for:

* 1440px+
* 1280px
* 1024px
* 768px
* 640px
* 480px
* 390px

Desktop:

* spacious
* two-column compositions where appropriate
* map + list combinations
* dense but readable problem grids

Tablet:

* reduce columns
* preserve hierarchy
* simplify map/list composition

Mobile:

* single column
* large touch targets
* sticky Report a Problem CTA where appropriate
* compact navigation
* filters become a clean bottom sheet or drawer
* map/list switching should be simple

## The supplied references consistently emphasize deliberate breakpoint behavior, collapsing grids and accessible touch targets rather than merely shrinking desktop layouts.

# 26. MODERN FRONTEND IMPLEMENTATION

Use a current production-quality frontend stack.

Preferred:

* Next.js
* React
* TypeScript
* Tailwind CSS
* CSS variables for design tokens
* modern component architecture
* accessible primitives where useful
* MapLibre or Leaflet for maps

Do not build this like a 2021 dashboard.

Avoid:

* giant component files
* hardcoded repeated styles
* arbitrary spacing everywhere
* inline color chaos
* unnecessary dependencies
* animation libraries for tiny transitions
* massive UI component libraries when simple components are better

Use a small, coherent design system.

---

# 27. COMPONENT ARCHITECTURE

Create reusable components such as:

* `SiteHeader`
* `PrimaryButton`
* `SecondaryButton`
* `ProblemCard`
* `ProblemList`
* `ProblemStatus`
* `ProblemCategory`
* `DepartmentCard`
* `DepartmentDirectory`
* `LocationBadge`
* `EvidenceGallery`
* `ReportProblemForm`
* `LocationPicker`
* `MapPreview`
* `ProblemMap`
* `FilterBar`
* `SearchField`
* `ProblemTimeline`
* `CommunitySignal`
* `SiteFooter`

Keep the component system simple.

Do not create dozens of abstractions for the sake of architecture.

---

# 28. DATA MODEL FOR FRONTEND MOCK DATA

Use realistic Andhra Pradesh examples.

Examples:

### Problem

"Drinking water unavailable for 5 days"

Category:

Drinking Water

Department:

Rural Development & Rural Water Supply

Location:

Visakhapatnam

Status:

Reported

Reports:

18

---

### Problem

"Large potholes near main road"

Category:

Roads

Department:

Roads & Buildings

Location:

Rajahmundry

Status:

Under Review

Reports:

12

---

### Problem

"Drainage overflow after rainfall"

Category:

Drainage

Department:

Municipal Administration & Urban Development

Location:

Vijayawada

Status:

Action Initiated

Reports:

24

Use fictional/demo data clearly enough that users cannot mistake it for official government statistics.

---

# 29. DO NOT INVENT GOVERNMENT CLAIMS

Problems@AP is a citizen reporting platform.

Never make the interface imply:

* Government endorsement
* Government ownership
* Official grievance integration
* Official verification

unless that functionality actually exists.

Use neutral language:

"Reported"

"Citizen reports"

"Community confirmed"

"Under review"

"Official response"

only when an actual official response exists.

---

# 30. NO EXTRA FEATURES

This instruction is extremely important.

Do not add features merely because they are common in SaaS applications.

Do NOT add:

* Authentication
* Profiles
* Likes
* Followers
* Messaging
* AI chatbot
* AI assistant
* Notifications center
* Gamification
* Leaderboards
* Badges
* Points
* Rewards
* Subscriptions
* Payments
* Premium accounts
* Newsletter
* Blog
* Comments system
* Social feed
* Dark mode
* Theme switcher
* Multiple color themes
* Cryptocurrency nonsense
* Complex admin UI
* Analytics suite
* CRM
* Marketing automation
* Chat support
* Calendar
* Calendar booking
* Unnecessary onboarding

Build the product we described.

Nothing more.

---

# 31. LIGHT THEME IS NON-NEGOTIABLE

There is only ONE visual mode:

**LIGHT**

Do not create dark mode.

Do not create automatic system theme switching.

Do not create a theme selector.

The product must remain visually consistent.

---

# 32. MOST IMPORTANT VISUAL RULE

If a design decision makes the interface look like:

"another AI SaaS startup"

remove it.

If it looks like:

"generic Tailwind dashboard"

remove it.

If it looks like:

"government website from 2014"

remove it.

If it looks like:

"beautiful Dribbble prototype that nobody could actually use"

remove it.

The final result should feel like an established public product.

---

# 33. DESIGN PRIORITY ORDER

When the five references conflict, use this priority:

### 1. Apple

Visual restraint, typography, whitespace, clarity.

### 2. Intercom

Warm editorial canvas, cards, information presentation.

### 3. Airbnb

Citizen discovery, location, search, evidence imagery, human interaction.

### 4. Linear

Problem management, status, information density, precision.

### 5. Stripi / Stripe

Data hierarchy, forms, numerical clarity and structured product UI.

Never let the visual identity of any reference overpower Problems@AP itself.

---

# 34. FINAL QUALITY BAR

Before considering the frontend complete, inspect it as if this were a real product launch.

Ask:

* Does this look like a real civic platform?
* Can a citizen understand it in five seconds?
* Can someone report a problem without an account?
* Is the reporting flow obvious?
* Is location information clear?
* Are problem cards easy to scan?
* Can people understand department ownership?
* Does the map feel useful?
* Does the page feel calm?
* Is there enough whitespace?
* Is there too much UI?
* Is anything unnecessary?
* Does anything look like generic AI SaaS?
* Is there any blue/purple SaaS gradient?
* Is there excessive animation?
* Is every component actually useful?
* Does mobile feel intentionally designed?
* Does the interface look production-ready rather than generated?

If any answer is wrong, refine the interface before adding anything else.

## FINAL DIRECTION

Build **Problems@AP** as if:

Apple designed the visual restraint.

Intercom designed the editorial surface.

Airbnb designed the citizen discovery experience.

Linear designed the problem-management structure.

Stripi/Stripe designed the information hierarchy.

But Problems@AP itself owns the final identity.

The result should be **quiet, serious, highly usable, modern, warm, civic and unmistakably original**.

Do not make it look like a combination of five websites.

Make it look like one coherent product that learned the right lessons from five excellent design systems.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cf05f14f-6c2c-48f5-b641-75013c665bce).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
