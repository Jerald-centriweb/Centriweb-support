# Backend Developer Connection Guide

## 🎯 Overview

This document provides step-by-step instructions for connecting all backend services to make the multi-tenant SaaS platform fully functional.

**Estimated Time**: 2-3 hours for complete setup

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Node.js 18+ installed
- [ ] Git repository access
- [ ] Supabase account (free tier works)
- [ ] Vercel account (for deployment)
- [ ] OpenAI API key (optional, for Whisper voice)

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in details:
   - **Name**: `centriweb-support` (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
4. Wait 2-3 minutes for project to provision

### Step 2: Get API Keys

1. In Supabase dashboard, go to **Settings → API**
2. Copy these values (you'll need them later):
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **IMPORTANT**:
- `anon` key is safe for frontend
- `service_role` key **MUST ONLY** be used in backend (bypasses Row Level Security)
- Never commit keys to Git

### Step 3: Run Database Migrations

**Option A: Via Supabase Dashboard** (Recommended for beginners)

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy entire contents of `/supabase/migrations/001_initial_schema.sql`
4. Paste and click **Run**
5. Verify success (green checkmark)
6. Repeat for `/supabase/migrations/002_content_seed_data.sql`

**Option B: Via Supabase CLI** (For advanced users)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref xxxxx

# Push migrations
supabase db push
```

### Step 4: Verify Database Tables

Go to **Table Editor** and verify these tables exist:
- ✅ `tenants`
- ✅ `sub_accounts`
- ✅ `content_items`
- ✅ `analytics_events`
- ✅ `health_scores`

You should also see:
- 1 demo tenant (`demo-agency`)
- 6 base content items (guides)

---

## 🔐 Environment Variables

### Step 1: Create Local Environment File

Create `.env` in project root:

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: OpenAI (for Whisper voice transcription)
OPENAI_API_KEY=sk-...

# Optional: Vercel deployment
VERCEL_URL=https://your-app.vercel.app
```

### Step 2: Add to `.gitignore`

Ensure `.env` is in `.gitignore`:

```
# .gitignore
.env
.env.local
.env.production
```

### Step 3: Configure Vercel (for deployment)

If deploying to Vercel:

1. Go to your Vercel project
2. Navigate to **Settings → Environment Variables**
3. Add each variable:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `OPENAI_API_KEY` (optional)
4. Make sure to select which environments (Production, Preview, Development)

---

## 🔌 API Endpoint Connections

All API endpoints are in the `/api` directory and use Vercel serverless functions. Here's how to test each one:

### 1. Tenant Configuration API

**File**: `/api/tenants/[slug]/config.ts`

**Purpose**: Fetch tenant configuration by slug

**Test**:
```bash
curl http://localhost:3000/api/tenants/demo-agency/config
```

**Expected Response**:
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "slug": "demo-agency",
  "plan": "pro",
  "branding": {
    "companyName": "Demo Agency",
    "logoUrl": "...",
    "primaryColor": "#6366f1"
  },
  "features": {
    "guides": true,
    "aiChat": true,
    "voiceInput": true,
    "badges": true
  }
}
```

**Connection Required**:
- ✅ Environment variable `SUPABASE_URL`
- ✅ Environment variable `SUPABASE_SERVICE_KEY`

**Troubleshooting**:
- If 500 error: Check Supabase credentials
- If empty response: Verify `demo-agency` tenant exists in database
- If CORS error: Add your domain to Supabase allowed origins

---

### 2. Tenant Domain Lookup API

**File**: `/api/tenants/by-domain.ts`

**Purpose**: Fetch tenant by custom domain or subdomain

**Test**:
```bash
curl "http://localhost:3000/api/tenants/by-domain?domain=demo.supportos.io"
```

**Expected Response**: Same as above

**Connection Required**:
- ✅ Environment variable `SUPABASE_URL`
- ✅ Environment variable `SUPABASE_SERVICE_KEY`

---

### 3. Content Guides API

**File**: `/api/content/guides.ts`

**Purpose**: Fetch guides with content inheritance (base + tenant overrides)

**Test**:
```bash
curl "http://localhost:3000/api/content/guides?tenantId=f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

**Expected Response**:
```json
[
  {
    "id": "base-guide-001",
    "title": "Welcome to GoHighLevel",
    "summary": "A complete introduction...",
    "content": "# Welcome to GoHighLevel\n\n...",
    "category": "getting_started",
    "tags": ["basics", "getting-started"],
    "timeToRead": "5 min"
  },
  ...
]
```

**With Category Filter**:
```bash
curl "http://localhost:3000/api/content/guides?tenantId=f47ac10b-58cc-4372-a567-0e02b2c3d479&category=getting_started"
```

**Connection Required**:
- ✅ Environment variable `SUPABASE_URL`
- ✅ Environment variable `SUPABASE_SERVICE_KEY`
- ✅ Migration `002_content_seed_data.sql` executed

**Troubleshooting**:
- If empty array: Verify seed data migration ran successfully
- If inheritance not working: Check `overrides_id` and `is_override` columns

---

### 4. Content Categories API

**File**: `/api/content/categories.ts`

**Purpose**: Fetch all categories with guides grouped

**Test**:
```bash
curl "http://localhost:3000/api/content/categories?tenantId=f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

**Expected Response**:
```json
[
  {
    "id": "getting_started",
    "title": "Getting Started",
    "description": "Essential guides to get up and running quickly",
    "guides": [...]
  },
  {
    "id": "crm",
    "title": "CRM",
    "description": "Contact management, pipelines, and lead tracking",
    "guides": [...]
  }
]
```

**Connection Required**:
- ✅ Environment variable `SUPABASE_URL`
- ✅ Environment variable `SUPABASE_SERVICE_KEY`

---

### 5. Analytics Events API

**File**: `/api/analytics/events.ts`

**Purpose**: Receive and store analytics events

**Test**:
```bash
curl -X POST http://localhost:3000/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "subAccountId": "sub-123",
    "userId": "user-456",
    "eventType": "guide_view",
    "eventData": {
      "guideId": "base-guide-001",
      "category": "getting_started",
      "title": "Welcome to GoHighLevel"
    },
    "pageUrl": "https://demo.supportos.io/guides/getting_started/base-guide-001",
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1",
    "timestamp": "2024-01-20T10:30:00.000Z"
  }'
```

**Expected Response**:
```json
{
  "success": true
}
```

**Verify in Database**:
```sql
SELECT * FROM analytics_events
WHERE tenant_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
ORDER BY created_at DESC
LIMIT 10;
```

**Connection Required**:
- ✅ Environment variable `SUPABASE_URL`
- ✅ Environment variable `SUPABASE_SERVICE_KEY`

**Troubleshooting**:
- If events not saving: Check Supabase logs (Logs & Insights)
- If duplicate events: Frontend is calling analytics too frequently (check debouncing)

---

### 6. Voice Transcription API (Optional - Whisper)

**File**: `/api/voice/transcribe.ts` ⚠️ **NOT YET CREATED**

**Purpose**: Transcribe audio using OpenAI Whisper API

**You need to create this file**:

```typescript
// /api/voice/transcribe.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, need to handle multipart
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.filepath),
      model: 'whisper-1',
      language: fields.language?.[0] || 'en',
      temperature: fields.temperature ? parseFloat(fields.temperature[0]) : 0,
      prompt: fields.prompt?.[0],
    });

    // Clean up temp file
    fs.unlinkSync(audioFile.filepath);

    return res.status(200).json({
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
    });
  } catch (error) {
    console.error('[API] Whisper transcription error:', error);
    return res.status(500).json({ error: 'Transcription failed' });
  }
}
```

**Install Dependencies**:
```bash
npm install openai formidable
npm install -D @types/formidable
```

**Test**:
```bash
# Record a test audio file (test.webm) then:
curl -X POST http://localhost:3000/api/voice/transcribe \
  -F "audio=@test.webm" \
  -F "language=en"
```

**Expected Response**:
```json
{
  "text": "This is the transcribed text from the audio",
  "language": "en",
  "duration": 5.2
}
```

**Connection Required**:
- ✅ Environment variable `OPENAI_API_KEY`
- ✅ Package `openai` installed
- ✅ Package `formidable` installed

**Cost Estimate**:
- $0.006 per minute of audio
- Example: 100 hours of voice input per month = $36

---

## 🔄 Frontend-Backend Data Flow

### Tenant Loading Flow

```
1. User visits https://demo-agency.supportos.io
   ↓
2. Frontend: lib/tenant-loader.ts detects subdomain
   ↓
3. Frontend: Calls /api/tenants/by-domain?domain=demo-agency.supportos.io
   ↓
4. Backend: Queries Supabase tenants table
   ↓
5. Backend: Returns tenant config with features
   ↓
6. Frontend: TenantContext stores config
   ↓
7. Frontend: App renders with tenant branding + feature flags
```

### Content Loading Flow

```
1. User navigates to /guides
   ↓
2. Frontend: useContent() hook triggers
   ↓
3. Frontend: Calls /api/content/categories?tenantId=xxx
   ↓
4. Backend: Fetches base content (tenant_id = NULL)
   ↓
5. Backend: Fetches tenant-specific content (tenant_id = xxx)
   ↓
6. Backend: Applies inheritance algorithm:
   - Start with base content
   - Apply tenant overrides (is_override = true)
   - Add tenant custom content
   ↓
7. Backend: Returns merged content
   ↓
8. Frontend: Displays guides with tenant customization
```

### Analytics Flow

```
1. User views a guide
   ↓
2. Frontend: GuideViewer.tsx calls analytics.trackGuideView()
   ↓
3. Frontend: lib/analytics.ts adds tenant/user context
   ↓
4. Frontend: Calls /api/analytics/events
   ↓
5. Backend: Validates event data
   ↓
6. Backend: Inserts into analytics_events table
   ↓
7. Backend: Returns success
   ↓
8. (Later) Backend cron job runs health scoring algorithm
   ↓
9. Backend: Updates health_scores table
```

### Voice Input Flow

```
1. User clicks microphone button
   ↓
2. Frontend: VoiceInput.tsx requests mic permission
   ↓
3. Frontend: Uses Web Speech API (browser-native)
   ↓
4. User speaks
   ↓
5. Frontend: Receives interim transcript (real-time)
   ↓
6. Frontend: Receives final transcript
   ↓
7. Frontend: Populates chat input field
   ↓
8. User clicks send (or auto-send)

--- OR (if using Whisper) ---

1. User clicks microphone button
   ↓
2. Frontend: MediaRecorder starts capturing audio
   ↓
3. User speaks, then clicks stop
   ↓
4. Frontend: Creates audio blob (webm format)
   ↓
5. Frontend: Calls /api/voice/transcribe with FormData
   ↓
6. Backend: Forwards audio to OpenAI Whisper API
   ↓
7. Backend: Returns transcription
   ↓
8. Frontend: Populates chat input field
```

---

## 🧪 Testing Checklist

Use this checklist to verify all connections work:

### Database Connection
- [ ] Supabase project created
- [ ] Migrations executed successfully
- [ ] `tenants` table has demo-agency record
- [ ] `content_items` table has 6 base guides
- [ ] Can query tables in SQL Editor

### Environment Variables
- [ ] `.env` file created with all keys
- [ ] `SUPABASE_URL` correct
- [ ] `SUPABASE_ANON_KEY` correct
- [ ] `SUPABASE_SERVICE_KEY` correct
- [ ] `.env` added to `.gitignore`

### API Endpoints
- [ ] `/api/tenants/demo-agency/config` returns tenant
- [ ] `/api/tenants/by-domain?domain=...` works
- [ ] `/api/content/guides?tenantId=...` returns guides
- [ ] `/api/content/categories?tenantId=...` returns categories
- [ ] `/api/analytics/events` accepts POST and saves to DB

### Frontend Integration
- [ ] Visit `/?tenant=demo-agency` shows tenant name
- [ ] Guides page loads dynamic content (no yellow banner)
- [ ] Analytics events appear in `analytics_events` table
- [ ] Voice input button appears in chat (if voiceInput enabled)

### Optional (Whisper)
- [ ] `/api/voice/transcribe.ts` created
- [ ] `openai` package installed
- [ ] `OPENAI_API_KEY` set
- [ ] Test audio transcription works

---

## 🚀 Deployment

### Deploy to Vercel

1. **Connect Git Repository**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login
   vercel login

   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add all variables from `.env`
   - Select environments (Production, Preview, Development)

3. **Configure Custom Domains** (for tenants)
   - In Vercel: Settings → Domains
   - Add domain: `support.acmeagency.com`
   - Get DNS records
   - Add to tenant's DNS:
     ```
     CNAME support.acmeagency.com → cname.vercel-dns.com
     ```
   - Wait 24-48 hours for propagation

4. **Verify Deployment**
   ```bash
   # Test production endpoint
   curl https://your-app.vercel.app/api/tenants/demo-agency/config
   ```

### Configure Supabase for Production

1. **Add Vercel domain to allowed origins**
   - Supabase dashboard → Settings → API
   - Add to "Site URL": `https://your-app.vercel.app`
   - Add to "Redirect URLs": `https://your-app.vercel.app/**`

2. **Enable RLS (Row Level Security)**
   - Ensure RLS policies are enabled on all tables
   - Test that tenants can only access their own data

---

## 🐛 Common Issues & Solutions

### Issue: "API returns 500 error"

**Cause**: Supabase credentials incorrect or missing

**Solution**:
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Verify in Supabase dashboard: Settings → API
```

---

### Issue: "Guides page shows yellow banner (static content)"

**Cause**: API not connecting to Supabase or returning empty data

**Solution**:
1. Check browser DevTools → Network tab
2. Look for request to `/api/content/categories`
3. Check response - should have data
4. Verify seed data migration ran: `SELECT * FROM content_items;`

---

### Issue: "Analytics events not saving"

**Cause**: POST request failing or Supabase insert error

**Solution**:
1. Check Supabase logs: Dashboard → Logs & Insights
2. Verify `analytics_events` table exists
3. Test direct insert:
   ```sql
   INSERT INTO analytics_events (tenant_id, event_type, event_data)
   VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'test', '{}');
   ```

---

### Issue: "Voice input not working"

**Cause**: Browser doesn't support Web Speech API

**Solution**:
1. Use Chrome, Edge, or Safari (iOS 14.5+)
2. Check console for errors
3. Verify microphone permissions granted
4. Consider implementing Whisper API for universal support

---

### Issue: "Tenant not loading by domain"

**Cause**: DNS not propagated or tenant not in database

**Solution**:
```bash
# Check DNS propagation
nslookup support.acmeagency.com

# Verify tenant exists
# In Supabase SQL Editor:
SELECT * FROM tenants WHERE domain = 'support.acmeagency.com';
```

---

## 📊 Monitoring & Maintenance

### Supabase Dashboard

Monitor these metrics regularly:

1. **Database Size** (Settings → Usage)
   - Free tier: 500 MB
   - Upgrade if approaching limit

2. **API Requests** (Settings → Usage)
   - Free tier: 500,000 requests/month
   - Monitor analytics endpoints (high volume)

3. **Logs** (Logs & Insights)
   - Check for errors
   - Monitor slow queries

### Analytics Health Checks

Run these queries periodically:

```sql
-- Event volume by type (last 7 days)
SELECT
  event_type,
  COUNT(*) as count
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY count DESC;

-- Top tenants by activity
SELECT
  tenant_id,
  COUNT(*) as events
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY tenant_id
ORDER BY events DESC
LIMIT 10;

-- Average events per user
SELECT
  AVG(event_count) as avg_events_per_user
FROM (
  SELECT user_id, COUNT(*) as event_count
  FROM analytics_events
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY user_id
) user_events;
```

### Database Maintenance

```sql
-- Clean up old analytics events (optional - keep 90 days)
DELETE FROM analytics_events
WHERE created_at < NOW() - INTERVAL '90 days';

-- Vacuum tables to reclaim space
VACUUM ANALYZE analytics_events;
VACUUM ANALYZE health_scores;
```

---

## ✅ Final Verification

Once everything is connected, verify end-to-end:

1. **Visit with tenant param**: `https://your-app.vercel.app/?tenant=demo-agency`
2. **Check header**: Should show "Demo Agency" branding
3. **Go to Guides**: Should load 6 guides (no yellow banner)
4. **Open a guide**: Should track analytics event
5. **Check database**:
   ```sql
   SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 1;
   ```
6. **Try voice input**: Click mic button in chat, speak, verify text appears

---

## 📞 Support

If you encounter issues:

1. **Check Supabase logs**: Dashboard → Logs & Insights
2. **Check browser console**: DevTools → Console tab
3. **Check network requests**: DevTools → Network tab
4. **Review this guide**: Most issues covered in troubleshooting

---

## 🎉 Success!

Once all connections are made:
- ✅ Multi-tenant system fully operational
- ✅ Dynamic content loading from Supabase
- ✅ Analytics tracking all user interactions
- ✅ Health scoring data collecting
- ✅ Voice input working (Web Speech API)
- ✅ Ready for production deployment

**Next Steps**: Create production tenants and onboard agencies!
