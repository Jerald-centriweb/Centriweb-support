# How The Multi-Tenant SaaS Platform Works

## 🎯 Executive Summary

This is a **multi-tenant SaaS platform** that provides GoHighLevel agencies with an intelligent support portal for their clients. Unlike commodity knowledge bases, this platform:

- **Tracks user behavior** to predict who needs help (health scoring)
- **Adapts content** per agency (tenant customization)
- **Measures ROI** (tickets prevented via self-service)
- **Provides voice input** for accessibility and convenience

**Target Market**: GoHighLevel agency owners
**Pricing**: $97-$497+/month
**Positioning**: "Client Success OS" not "Knowledge Base Widget"

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  React + TypeScript + TailwindCSS + Framer Motion          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Tenant     │  │   Content    │  │  Analytics   │    │
│  │   Context    │  │   Hook       │  │   Library    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│         ↓                  ↓                  ↓            │
└─────────┼──────────────────┼──────────────────┼───────────┘
          ↓                  ↓                  ↓
┌─────────┼──────────────────┼──────────────────┼───────────┐
│         ↓                  ↓                  ↓            │
│              VERCEL SERVERLESS FUNCTIONS                   │
│                                                             │
│  /api/tenants/*    /api/content/*    /api/analytics/*     │
│                                                             │
└─────────┼──────────────────┼──────────────────┼───────────┘
          ↓                  ↓                  ↓
┌─────────┴──────────────────┴──────────────────┴───────────┐
│                                                             │
│                    SUPABASE (PostgreSQL)                    │
│                                                             │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌─────────┐│
│  │ tenants  │  │  content  │  │ analytics  │  │  health │││
│  │          │  │   items   │  │   events   │  │  scores │││
│  └──────────┘  └───────────┘  └────────────┘  └─────────┘││
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│                                                             │
│  ┌──────────────┐              ┌──────────────┐           │
│  │  OpenAI API  │              │     GHL      │           │
│  │   (Whisper)  │              │     API      │           │
│  └──────────────┘              └──────────────┘           │
│      (Optional)                  (Future)                  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend**:
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Client-side routing (HashRouter for iframe compatibility)
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management (badges, user stats)
- **Lucide React** - Icons

**Backend**:
- **Vercel** - Hosting + serverless functions
- **Supabase** - PostgreSQL database with real-time capabilities
- **OpenAI Whisper** - Voice transcription (optional premium feature)

**Browser APIs**:
- **Web Speech API** - Voice input (free tier)
- **MediaRecorder API** - Audio capture (for Whisper upgrade)

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App.tsx
├── TenantProvider (wraps entire app)
│   └── ToastProvider
│       └── HashRouter
│           └── Layout
│               ├── Header
│               │   ├── Logo (tenant branding)
│               │   ├── SearchButton (⌘K)
│               │   └── ThemeToggle
│               │
│               ├── Sidebar
│               │   ├── NavItem: Dashboard
│               │   ├── NavItem: Guides
│               │   ├── NavItem: AI Chat
│               │   └── NavItem: Support
│               │
│               └── Main Content (Router)
│                   ├── DashboardPage
│                   ├── GuidesPage
│                   │   ├── CategoryList
│                   │   └── GuideDetailWrapper
│                   │       └── GuideViewer
│                   ├── ChatPage
│                   │   └── ChatInterface
│                   │       └── VoiceInput (feature-gated)
│                   └── SupportPage
│
├── CommandMenu (⌘K search)
├── BadgeNotification (feature-gated)
└── FloatingAssistant (feature-gated)
```

### Key Contexts & Hooks

#### TenantContext

**Purpose**: Provides tenant configuration throughout the app

**Location**: `/contexts/TenantContext.tsx`

**What it does**:
1. Detects tenant from URL (query param → subdomain → custom domain)
2. Fetches tenant config from `/api/tenants/[slug]/config`
3. Provides tenant data via `useTenant()` hook
4. Applies branding (logo, colors, company name)
5. Enables/disables features based on plan

**Example Usage**:
```tsx
import { useTenant, useFeature } from './contexts/TenantContext';

const MyComponent = () => {
  const { config, isLoading } = useTenant();
  const badgesEnabled = useFeature('badges');

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1>{config.branding.companyName} Support</h1>
      {badgesEnabled && <BadgeSystem />}
    </div>
  );
};
```

#### useContent Hook

**Purpose**: Fetches dynamic content with automatic fallback

**Location**: `/hooks/useContent.ts`

**What it does**:
1. Calls `/api/content/categories` with tenant ID
2. Applies content inheritance (base + overrides + custom)
3. Falls back to static data if API fails
4. Shows warning banner when using fallback

**Example Usage**:
```tsx
import { useContent } from './hooks/useContent';

const GuidesPage = () => {
  const { categories, isLoading, useFallback } = useContent();

  if (isLoading) return <Spinner />;

  return (
    <div>
      {useFallback && <Warning>Using static content</Warning>}
      {categories.map(cat => <CategoryCard category={cat} />)}
    </div>
  );
};
```

---

## 🔄 Core Workflows

### 1. Tenant Loading (First Visit)

```
┌────────────────────────────────────────────────────────────┐
│ User visits: https://acme-agency.supportos.io             │
└────────────────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────┐
         │ lib/tenant-   │
         │ loader.ts     │  Detects tenant from subdomain
         └───────┬───────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Call: /api/tenants/by-domain          │
         │ Params: domain=acme-agency.supportos.io│
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────┐
         │ Supabase      │  SELECT * FROM tenants
         │ Query         │  WHERE domain = 'acme-agency.supportos.io'
         └───────┬───────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Return tenant config:                 │
         │ - ID, slug, plan                      │
         │ - Branding (logo, colors)             │
         │ - Features (guides, AI, voice, etc.)  │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────┐
         │ TenantContext │  Stores config in React context
         │ Provider      │
         └───────┬───────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ App renders with:                     │
         │ - Acme Agency logo in header          │
         │ - Acme's brand colors applied         │
         │ - Features enabled per their plan     │
         └───────────────────────────────────────┘
```

**Key Files**:
- `/lib/tenant-loader.ts` - Detection logic
- `/api/tenants/by-domain.ts` - API endpoint
- `/contexts/TenantContext.tsx` - React context

---

### 2. Content Loading with Inheritance

```
┌────────────────────────────────────────────────────────────┐
│ User navigates to /guides                                  │
└────────────────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────┐
         │ useContent()  │  Hook in GuidesPage
         │ hook          │
         └───────┬───────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Call: /api/content/categories         │
         │ Params: tenantId=acme-agency-uuid     │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────┐
         │ Supabase      │  Fetch content_items
         │ Queries       │
         └───────┬───────┘
                 ↓
         ┌───────────────────────────────────────────────────┐
         │ Query 1: Base content (tenant_id = NULL)         │
         │ SELECT * FROM content_items                       │
         │ WHERE tenant_id IS NULL AND type = 'guide'        │
         │                                                   │
         │ Result: 6 base guides (Getting Started, CRM, etc.)│
         └───────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────────────────┐
         │ Query 2: Tenant content (tenant_id = acme-uuid)  │
         │ SELECT * FROM content_items                       │
         │ WHERE tenant_id = 'acme-uuid' AND type = 'guide'  │
         │                                                   │
         │ Result: 2 custom guides + 1 override             │
         └───────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────────────────┐
         │ INHERITANCE ALGORITHM                             │
         │                                                   │
         │ 1. Start with base content (6 guides)            │
         │                                                   │
         │ 2. Apply tenant overrides:                        │
         │    - "Welcome to GoHighLevel" (base)              │
         │      → OVERRIDDEN BY →                            │
         │    - "Welcome to Acme's GHL" (tenant override)    │
         │                                                   │
         │ 3. Add tenant custom content:                     │
         │    - "Acme-Specific Setup Guide"                  │
         │    - "How to Use Acme's Templates"                │
         │                                                   │
         │ Final result: 7 guides (5 base + 1 override + 2  │
         │                         custom)                   │
         └───────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Return to frontend:                   │
         │ - Grouped by category                 │
         │ - With inheritance applied            │
         │ - Cached for 5 minutes                │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────┐
         │ GuidesPage    │  Displays guides to user
         │ renders       │
         └───────────────┘
```

**Key Files**:
- `/api/content/guides.ts` - Inheritance algorithm
- `/hooks/useContent.ts` - React hook
- `/pages/GuidesPage.tsx` - UI rendering

**Why this matters**:
- Agencies can customize content for their clients
- Base grey-label content reduces setup time
- Changes to base content auto-propagate to all tenants
- Agencies can override specific guides with their own branding

---

### 3. Analytics Event Tracking

```
┌────────────────────────────────────────────────────────────┐
│ User opens guide: "Setting Up Your First Sub-Account"     │
└────────────────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ GuideViewer.tsx                       │
         │ useEffect(() => {                     │
         │   analytics.trackGuideView(...)       │
         │   timeTracker = new TimeTracker()     │
         │ }, [])                                │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ lib/analytics.ts                      │
         │                                       │
         │ function trackGuideView(              │
         │   guideId, category, title            │
         │ ) {                                   │
         │   const context = getTenantContext()  │
         │   trackEvent('guide_view', {          │
         │     guideId, category, title,         │
         │     tenantId: context.tenantId,       │
         │     userId: context.userId,           │
         │     subAccountId: context.subAccountId│
         │   })                                  │
         │ }                                     │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ POST /api/analytics/events            │
         │                                       │
         │ {                                     │
         │   tenantId: "acme-uuid",              │
         │   subAccountId: "sub-123",            │
         │   userId: "user-456",                 │
         │   eventType: "guide_view",            │
         │   eventData: {                        │
         │     guideId: "base-guide-002",        │
         │     category: "getting_started",      │
         │     title: "Setting Up..."            │
         │   },                                  │
         │   timestamp: "2024-01-20T10:30:00Z"   │
         │ }                                     │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Supabase INSERT                       │
         │                                       │
         │ INSERT INTO analytics_events (        │
         │   tenant_id, sub_account_id,          │
         │   user_id, event_type, event_data,    │
         │   created_at                          │
         │ ) VALUES (...)                        │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Event stored in database              │
         │ Ready for health scoring analysis     │
         └───────────────────────────────────────┘

         ... 30 seconds later ...

         ┌───────────────────────────────────────┐
         │ GuideViewer unmounts (user leaves)    │
         │                                       │
         │ useEffect cleanup:                    │
         │   timeTracker.trackCompletion()       │
         │                                       │
         │ Checks elapsed time: 45 seconds       │
         │ ✓ Over 30 second threshold            │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ analytics.trackGuideComplete(         │
         │   guideId,                            │
         │   timeSpent: 45                       │
         │ )                                     │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Another event saved:                  │
         │ event_type: "guide_complete"          │
         │ event_data: { timeSpentSeconds: 45 }  │
         └───────────────────────────────────────┘
```

**Tracked Events**:
- `guide_view` - User opens a guide
- `guide_complete` - User reads for 30+ seconds
- `search` - User searches for content
- `ai_chat_start` - User opens AI chat
- `ai_chat_message` - User/AI sends message
- `ticket_submit` - User submits support ticket
- `page_view` - User visits a page
- `voice_input_start` - User uses voice input

**Key Files**:
- `/lib/analytics.ts` - Analytics API (250 lines)
- `/api/analytics/events.ts` - Backend endpoint
- All page components - Integrated tracking

**Why this matters**:
- Every interaction is tracked
- Data feeds into health scoring
- Identifies confusion patterns
- Measures self-service ROI

---

### 4. Health Scoring Algorithm

```
┌────────────────────────────────────────────────────────────┐
│ Cron job runs daily (or on-demand via admin dashboard)    │
└────────────────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ lib/health-scoring.ts                 │
         │                                       │
         │ function calculateHealthScore(        │
         │   events: AnalyticsEvent[]            │
         │ )                                     │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────────────────┐
         │ Fetch events for sub-account (last 30 days)      │
         │                                                   │
         │ SELECT * FROM analytics_events                    │
         │ WHERE sub_account_id = 'sub-123'                  │
         │   AND created_at > NOW() - INTERVAL '30 days'     │
         └───────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────────────────┐
         │ ANALYZE EVENTS                                    │
         │                                                   │
         │ guide_view events: 25                             │
         │ guide_complete events: 12                         │
         │ search events: 35 (HIGH)                          │
         │ repeat_searches: 8 (on same topics)               │
         │ ai_chat sessions: 6                               │
         │ ticket_submit events: 15 (HIGH)                   │
         │ critical_tickets: 2 (CRITICAL)                    │
         └───────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────────────────┐
         │ CALCULATE SCORE (start at 50)                     │
         │                                                   │
         │ POSITIVE SIGNALS:                                 │
         │ ✓ 25 guide views (10+) → +15 points              │
         │ ✓ 12 guide completes (5+) → +10 points           │
         │                                                   │
         │ NEGATIVE SIGNALS:                                 │
         │ ✗ 35 searches (>20) → -10 points                 │
         │ ✗ 8 repeat searches (>3) → -15 points            │
         │ ✗ 15 tickets (>10) → -15 points                  │
         │ ✗ 2 critical tickets → -30 points                │
         │                                                   │
         │ FINAL SCORE: 50 + 15 + 10 - 10 - 15 - 15 - 30    │
         │            = 5 (CRITICAL RISK)                    │
         └───────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────────────────┐
         │ IDENTIFY CONFUSION TOPICS                         │
         │                                                   │
         │ Analyze search queries:                           │
         │ - "how to create pipeline" (searched 4 times)     │
         │ - "workflow not triggering" (searched 3 times)    │
         │ - "automation setup" (searched 3 times)           │
         │                                                   │
         │ Top confusion topics:                             │
         │ 1. pipelines                                      │
         │ 2. workflows                                      │
         │ 3. automation                                     │
         └───────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────────────────┐
         │ GENERATE RECOMMENDATION                           │
         │                                                   │
         │ Score: 5 → Tier: "Critical Risk"                 │
         │                                                   │
         │ Recommendation:                                   │
         │ "URGENT: Contact immediately. High ticket volume, │
         │  critical issues, and excessive searching indicate│
         │  user is severely struggling. Schedule emergency  │
         │  onboarding call. Consider refund risk."          │
         └───────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ SAVE TO DATABASE                      │
         │                                       │
         │ INSERT INTO health_scores (           │
         │   sub_account_id,                     │
         │   score: 5,                           │
         │   tier: "Critical Risk",              │
         │   metrics: {...},                     │
         │   positive_signals: [...],            │
         │   negative_signals: [...],            │
         │   confusion_topics: [...],            │
         │   recommendation: "..."               │
         │ )                                     │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ TRIGGER ALERTS                        │
         │                                       │
         │ - Send email to agency owner          │
         │ - Show alert in admin dashboard       │
         │ - Create task for support team        │
         │ - Optional: Webhook to GHL            │
         └───────────────────────────────────────┘
```

**Health Score Tiers**:
- **80-100**: Thriving (green) - Actively learning, low tickets
- **60-79**: Healthy (blue) - Good engagement, occasional support
- **40-59**: At Risk (yellow) - Needs attention, confusion signals
- **20-39**: Critical Risk (orange) - High tickets, excessive searching
- **0-19**: Emergency (red) - System down or severe issues

**Key Files**:
- `/lib/health-scoring.ts` - Scoring algorithm (300 lines)
- Cron job (to be implemented by backend dev)

**Why this is your competitive advantage**:
- **Predictive**: Know who needs help BEFORE they churn
- **Actionable**: Specific recommendations per user
- **ROI Measurable**: Track tickets prevented
- **Unique**: Competitors don't have this

---

### 5. Voice Input Flow

**Web Speech API (Free Tier)**:

```
┌────────────────────────────────────────────────────────────┐
│ User clicks microphone button in chat                     │
└────────────────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ VoiceInput.tsx                        │
         │                                       │
         │ Check browser support:                │
         │ - Chrome/Edge: ✓                      │
         │ - Safari iOS 14.5+: ✓                 │
         │ - Firefox: ✗ (show disabled)          │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Request microphone permission         │
         │ navigator.mediaDevices.getUserMedia() │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Initialize SpeechRecognition          │
         │                                       │
         │ const recognition =                   │
         │   new webkitSpeechRecognition()       │
         │                                       │
         │ recognition.continuous = true         │
         │ recognition.interimResults = true     │
         │ recognition.lang = 'en-US'            │
         │                                       │
         │ recognition.start()                   │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Button shows recording state:         │
         │ - Red pulsing background              │
         │ - Pulsing indicator dot               │
         │ - "Stop recording" tooltip            │
         └───────────────────────────────────────┘
                 ↓
         ... user speaks: "How do I create a pipeline?" ...
                 ↓
         ┌───────────────────────────────────────┐
         │ recognition.onresult fires            │
         │                                       │
         │ Interim results (real-time):          │
         │ - "How"                               │
         │ - "How do I"                          │
         │ - "How do I create"                   │
         │ - "How do I create a pipeline"        │
         │                                       │
         │ Display in tooltip above button       │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Final result received:                │
         │ "How do I create a pipeline?"         │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ ChatInterface.handleVoiceTranscript() │
         │                                       │
         │ setInput("How do I create a           │
         │           pipeline?")                 │
         │                                       │
         │ User can now review/edit before       │
         │ sending (or auto-send if configured)  │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ analytics.trackEvent(                 │
         │   'voice_input_success', {...}        │
         │ )                                     │
         └───────────────────────────────────────┘
```

**Whisper API (Premium Tier)**:

```
┌────────────────────────────────────────────────────────────┐
│ User clicks microphone button                             │
└────────────────┬───────────────────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ MediaRecorder API starts capturing    │
         │                                       │
         │ const recorder = new MediaRecorder(   │
         │   stream,                             │
         │   { mimeType: 'audio/webm' }          │
         │ )                                     │
         │                                       │
         │ recorder.start()                      │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Button shows recording:               │
         │ - Timer: 00:03                        │
         │ - Waveform animation                  │
         │ - "Click to stop"                     │
         └───────────────────────────────────────┘
                 ↓
         ... user speaks for 5 seconds ...
                 ↓
         ┌───────────────────────────────────────┐
         │ User clicks stop                      │
         │                                       │
         │ recorder.stop()                       │
         │                                       │
         │ Creates audio blob (webm format)      │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Send to backend                       │
         │                                       │
         │ const formData = new FormData()       │
         │ formData.append('audio', audioBlob)   │
         │ formData.append('language', 'en')     │
         │                                       │
         │ POST /api/voice/transcribe            │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Backend: /api/voice/transcribe.ts     │
         │                                       │
         │ Parse multipart form data             │
         │ Extract audio file                    │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Call OpenAI Whisper API               │
         │                                       │
         │ const openai = new OpenAI({           │
         │   apiKey: process.env.OPENAI_API_KEY  │
         │ })                                    │
         │                                       │
         │ const result = await openai           │
         │   .audio.transcriptions.create({      │
         │     file: audioFile,                  │
         │     model: 'whisper-1'                │
         │   })                                  │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Return transcription                  │
         │                                       │
         │ {                                     │
         │   text: "How do I create a pipeline?",│
         │   language: "en",                     │
         │   duration: 5.2                       │
         │ }                                     │
         └───────┬───────────────────────────────┘
                 ↓
         ┌───────────────────────────────────────┐
         │ Frontend populates input field        │
         │ User can review/edit before sending   │
         └───────────────────────────────────────┘
```

**Key Files**:
- `/components/Chat/VoiceInput.tsx` - Voice component
- `/services/whisperService.ts` - Whisper integration docs
- `/api/voice/transcribe.ts` - Backend endpoint (to be created)

**Why offer both?**:
- **Web Speech API**: Free, works in most browsers, good for English
- **Whisper API**: Premium feature, 90+ languages, better accuracy, works everywhere

---

## 🎯 Feature Flag System

### How Feature Flags Work

Every feature is gated by plan tier:

```typescript
// /types/tenant.ts
export const PLAN_FEATURES = {
  starter: {
    guides: true,
    aiChat: true,
    analytics: true,
    voiceInput: true,
    badges: false,              // ✗ Not in Starter
    gamification: false,        // ✗ Not in Starter
    whisperVoice: false,        // ✗ Not in Starter
  },
  pro: {
    guides: true,
    aiChat: true,
    analytics: true,
    voiceInput: true,
    badges: true,               // ✓ Enabled in Pro
    gamification: true,         // ✓ Enabled in Pro
    whisperVoice: true,         // ✓ Enabled in Pro
    customBranding: true,       // ✓ Enabled in Pro
  },
  enterprise: {
    // All features enabled
    ghlApiIntegration: true,    // ✓ Only in Enterprise
    multiLanguage: true,        // ✓ Only in Enterprise
    whiteLabel: true,           // ✓ Only in Enterprise
  }
};
```

### Using Feature Flags in Code

**Option 1: FeatureGate Component**

```tsx
import { FeatureGate } from './components/FeatureGate';

<FeatureGate feature="badges">
  <BadgeNotification />
</FeatureGate>

// If user's plan doesn't include "badges", nothing renders
```

**Option 2: useFeature Hook**

```tsx
import { useFeature } from './contexts/TenantContext';

const MyComponent = () => {
  const whisperEnabled = useFeature('whisperVoice');

  return (
    <VoiceInput
      useWhisper={whisperEnabled}  // Use Whisper if Pro/Enterprise
      fallbackToWebSpeech={true}   // Otherwise Web Speech API
    />
  );
};
```

**Option 3: Direct Config Access**

```tsx
import { useTenant } from './contexts/TenantContext';

const MyComponent = () => {
  const { config } = useTenant();

  if (config.plan === 'enterprise') {
    return <EnterpriseOnlyFeature />;
  }

  return <StandardFeature />;
};
```

---

## 📊 Database Schema

### Core Tables

#### `tenants`
**Purpose**: Stores agency (tenant) information

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE,                    -- e.g., 'acme-agency'
  domain TEXT,                         -- e.g., 'support.acme.com'
  plan TEXT CHECK (plan IN             -- 'starter', 'pro', 'enterprise'
    ('starter', 'pro', 'enterprise')),
  status TEXT CHECK (status IN         -- 'active', 'trial', 'suspended'
    ('active', 'trial', 'suspended',
     'cancelled')),
  branding JSONB,                      -- Logo, colors, company name
  features JSONB,                      -- Feature flags
  ai_settings JSONB,                   -- AI model, temperature, etc.
  support_settings JSONB,              -- Ticket categories, SLA, etc.
  content_settings JSONB,              -- Allow overrides, etc.
  analytics_settings JSONB,            -- Retention, export, etc.
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example Row**:
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "slug": "acme-agency",
  "domain": "support.acme.com",
  "plan": "pro",
  "status": "active",
  "branding": {
    "companyName": "Acme Agency",
    "logoUrl": "https://acme.com/logo.png",
    "primaryColor": "#6366f1"
  },
  "features": {
    "guides": true,
    "badges": true,
    "whisperVoice": true
  }
}
```

---

#### `sub_accounts`
**Purpose**: Stores GHL client (location) information

```sql
CREATE TABLE sub_accounts (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),  -- Which agency owns this
  ghl_location_id TEXT,                   -- GHL's location ID
  name TEXT,                              -- "Client ABC - Seattle"
  settings JSONB,                         -- Client-specific settings
  created_at TIMESTAMP
);
```

**Example Row**:
```json
{
  "id": "sub-123",
  "tenant_id": "f47ac10b-...",
  "ghl_location_id": "qwerty123",
  "name": "John's Dental Practice - NYC",
  "settings": {
    "timezone": "America/New_York",
    "industry": "dental"
  }
}
```

---

#### `content_items`
**Purpose**: Stores guides, SOPs, videos, FAQs

```sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),  -- NULL = base content
  type TEXT CHECK (type IN
    ('guide', 'sop', 'video', 'faq')),
  category TEXT,                          -- 'getting_started', 'crm', etc.
  title TEXT,
  summary TEXT,
  content TEXT,                           -- Markdown content
  tags TEXT[],
  time_to_read TEXT,                      -- '5 min', '10 min'
  video_url TEXT,
  related_guide_ids UUID[],
  is_override BOOLEAN DEFAULT FALSE,      -- Is this overriding base content?
  overrides_id UUID REFERENCES            -- Which base guide does this override?
    content_items(id),
  display_order INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example - Base Content**:
```json
{
  "id": "base-guide-001",
  "tenant_id": null,                    // ← NULL = base content
  "type": "guide",
  "category": "getting_started",
  "title": "Welcome to GoHighLevel",
  "content": "# Welcome to GoHighLevel\n\n...",
  "is_override": false
}
```

**Example - Tenant Override**:
```json
{
  "id": "acme-guide-override-001",
  "tenant_id": "f47ac10b-...",          // ← Acme's tenant ID
  "type": "guide",
  "category": "getting_started",
  "title": "Welcome to Acme's GHL",     // ← Custom title
  "content": "# Welcome to Acme\n\n...", // ← Custom content
  "is_override": true,                  // ← This overrides base
  "overrides_id": "base-guide-001"      // ← Points to base guide
}
```

**How Inheritance Works**:
1. Fetch all base content (tenant_id = NULL)
2. Fetch tenant content (tenant_id = acme)
3. If tenant has `is_override = true` pointing to base guide, use tenant version
4. Otherwise, use base version
5. Add any tenant custom content (is_override = false)

---

#### `analytics_events`
**Purpose**: Stores all user interactions

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  sub_account_id UUID REFERENCES sub_accounts(id),
  user_id TEXT,                         -- Anonymous or authenticated
  event_type TEXT,                      -- 'guide_view', 'search', etc.
  event_data JSONB,                     -- Event-specific data
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_analytics_tenant_time
  ON analytics_events(tenant_id, created_at DESC);
```

**Example Events**:
```json
{
  "event_type": "guide_view",
  "event_data": {
    "guideId": "base-guide-001",
    "category": "getting_started",
    "title": "Welcome to GoHighLevel"
  }
}

{
  "event_type": "search",
  "event_data": {
    "query": "how to create pipeline",
    "resultsCount": 12
  }
}

{
  "event_type": "guide_complete",
  "event_data": {
    "guideId": "base-guide-001",
    "timeSpentSeconds": 85
  }
}
```

---

#### `health_scores`
**Purpose**: Stores calculated health scores

```sql
CREATE TABLE health_scores (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  sub_account_id UUID REFERENCES sub_accounts(id),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  tier TEXT CHECK (tier IN
    ('thriving', 'healthy', 'at_risk',
     'critical_risk', 'emergency')),
  metrics JSONB,                        -- Guide views, tickets, etc.
  positive_signals TEXT[],
  negative_signals TEXT[],
  confusion_topics TEXT[],
  recommendation TEXT,
  calculated_at TIMESTAMP DEFAULT NOW()
);
```

**Example Row**:
```json
{
  "score": 35,
  "tier": "critical_risk",
  "metrics": {
    "guideViews": 3,
    "searches": 45,
    "tickets": 18,
    "criticalTickets": 2
  },
  "positive_signals": [],
  "negative_signals": [
    "Excessive searching (45 searches)",
    "High ticket volume (18 tickets)",
    "Critical issues (2 critical tickets)"
  ],
  "confusion_topics": ["pipelines", "workflows", "automation"],
  "recommendation": "URGENT: Contact immediately. User severely struggling."
}
```

---

## 🔐 Security & Authentication

### Row Level Security (RLS)

All tables have RLS policies to ensure tenant isolation:

```sql
-- Tenants can only see their own data
CREATE POLICY "Tenants can only see own content"
  ON content_items
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    OR tenant_id IS NULL  -- Base content visible to all
  );

-- Analytics events isolated per tenant
CREATE POLICY "Tenants can only see own analytics"
  ON analytics_events
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
  );
```

### API Key Security

**Frontend** (uses `SUPABASE_ANON_KEY`):
- Limited to SELECT queries with RLS
- Cannot bypass security policies
- Safe to expose in browser

**Backend** (uses `SUPABASE_SERVICE_KEY`):
- Bypasses RLS (full access)
- Must NEVER be exposed to frontend
- Only used in Vercel serverless functions

---

## 🚀 Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────────────────┐
│                          USERS                              │
│                                                             │
│  Acme Agency:        Beta Agency:       Charlie Agency:    │
│  support.acme.com    beta.supportos.io  charlie.supportos.io│
└─────────┬────────────────┬────────────────┬────────────────┘
          ↓                ↓                ↓
┌─────────┴────────────────┴────────────────┴────────────────┐
│                     VERCEL CDN                              │
│  (Edge Network - Global)                                    │
└─────────┬───────────────────────────────────────────────────┘
          ↓
┌─────────┴───────────────────────────────────────────────────┐
│                 VERCEL SERVERLESS FUNCTIONS                 │
│  (Auto-scaling, Regional)                                   │
│                                                             │
│  /api/tenants/*  /api/content/*  /api/analytics/*          │
└─────────┬───────────────────────────────────────────────────┘
          ↓
┌─────────┴───────────────────────────────────────────────────┐
│                  SUPABASE (PostgreSQL)                      │
│  (Managed Database with RLS)                                │
│                                                             │
│  Region: US-East-1 (or closest to users)                   │
│  Backups: Daily automatic backups                           │
│  Replication: Optional read replicas for scale             │
└─────────────────────────────────────────────────────────────┘
```

### Scaling Strategy

**Current (MVP)**:
- Vercel: Hobby plan (free)
- Supabase: Free tier (500 MB, 500K requests/month)
- Supports: ~50 tenants, 10K users

**Growth (100 tenants)**:
- Vercel: Pro plan ($20/month)
- Supabase: Pro plan ($25/month)
- Total: $45/month

**Scale (1000+ tenants)**:
- Vercel: Enterprise (custom pricing)
- Supabase: Team plan ($599/month) with read replicas
- Consider: Separate analytics database (ClickHouse, TimescaleDB)
- Consider: CDN for guide content (Cloudflare, Fastly)

---

## 📈 Business Model

### Pricing Tiers

| Feature | Starter ($97/mo) | Pro ($197/mo) | Enterprise ($497/mo) |
|---------|-----------------|---------------|---------------------|
| Guides & Tutorials | ✓ | ✓ | ✓ |
| AI Chat | ✓ | ✓ | ✓ |
| Analytics | Basic | Advanced | Full |
| Voice Input | Web Speech | Whisper API | Whisper + Multi-lang |
| Badges/Gamification | ✗ | ✓ | ✓ |
| Custom Branding | ✗ | ✓ | ✓ |
| Health Scoring | ✗ | ✓ | ✓ |
| GHL API Integration | ✗ | ✗ | ✓ |
| White-label | ✗ | ✗ | ✓ |
| Priority Support | ✗ | ✓ | ✓ |

### Revenue Projection

**Conservative** (Year 1):
- 20 Starter tenants × $97 = $1,940/mo
- 10 Pro tenants × $197 = $1,970/mo
- 2 Enterprise tenants × $497 = $994/mo
- **Total: $4,904/mo = $58,848/year**

**Optimistic** (Year 2):
- 100 Starter tenants × $97 = $9,700/mo
- 50 Pro tenants × $197 = $9,850/mo
- 10 Enterprise tenants × $497 = $4,970/mo
- **Total: $24,520/mo = $294,240/year**

### Cost Structure

**Per Tenant Monthly Costs**:
- Supabase: ~$0.10 (database + storage)
- Vercel: ~$0.15 (compute + bandwidth)
- OpenAI (Whisper): ~$2-5 (if using voice heavily)
- OpenAI (GPT-4 chat): ~$1-3 (if using AI chat)
- **Total: ~$3.25-8.25 per tenant**

**Gross Margin**:
- Starter plan: $97 - $8.25 = $88.75 (91% margin)
- Pro plan: $197 - $8.25 = $188.75 (96% margin)
- Enterprise plan: $497 - $8.25 = $488.75 (98% margin)

---

## 🎓 Key Learnings

### Why This Beats Competitors

**Competitors** (Extendly, HL Pro Tools, Rehelply):
- Generic knowledge base
- No customization per agency
- No analytics or health scoring
- Commoditized pricing ($29-99/mo)
- No differentiation

**This Platform**:
- **Predictive** - Health scoring predicts churn before it happens
- **Adaptive** - Content customizes per agency (tenant overrides)
- **Measurable** - ROI tracking (tickets prevented)
- **Accessible** - Voice input for convenience
- **Premium** - Positioned as "Client Success OS" not "KB widget"

### Critical Success Factors

1. **Health Scoring Accuracy** - The algorithm must be tuned over time
2. **Content Quality** - Base grey-label guides must be excellent
3. **Agency Onboarding** - Easy tenant setup is critical
4. **Analytics Performance** - Must handle high event volume
5. **Feature Adoption** - Agencies must use Pro/Enterprise features to justify price

---

## 📚 Summary

This platform is a **multi-tenant SaaS** that:

1. **Loads tenant config** on first visit (branding, features, plan)
2. **Serves dynamic content** with inheritance (base + overrides + custom)
3. **Tracks all interactions** via comprehensive analytics
4. **Calculates health scores** to predict who needs help
5. **Provides voice input** for accessibility (Web Speech + Whisper)
6. **Feature-gates everything** based on plan tier
7. **Scales efficiently** on Vercel + Supabase

**Competitive Advantage**: Health scoring + content customization
**Target Market**: GoHighLevel agency owners
**Pricing**: $97-$497+/month
**Positioning**: "Client Success OS" not "Knowledge Base"

Ready to transform support into a revenue center! 🚀
