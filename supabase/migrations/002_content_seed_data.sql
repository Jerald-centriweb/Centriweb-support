-- ============================================================================
-- Seed Data for Base Grey-Label Content
-- ============================================================================
-- This migration creates the base knowledge base content that all tenants
-- inherit by default. Tenants can override or extend this content.

-- Sample tenant for testing (you can create real tenants via API or admin panel)
INSERT INTO tenants (
  id,
  slug,
  domain,
  plan,
  status,
  branding,
  features,
  ai_settings,
  support_settings,
  content_settings,
  analytics_settings,
  created_at,
  updated_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'demo-agency',
  'demo.supportos.io',
  'pro',
  'active',
  '{
    "companyName": "Demo Agency",
    "logoUrl": "https://placehold.co/200x50/6366f1/white?text=Demo+Agency",
    "primaryColor": "#6366f1",
    "accentColor": "#8b5cf6"
  }'::jsonb,
  '{
    "guides": true,
    "aiChat": true,
    "analytics": true,
    "voiceInput": true,
    "badges": true,
    "gamification": true,
    "whisperVoice": true,
    "customBranding": true,
    "exportData": true,
    "prioritySupport": true,
    "webhooks": true,
    "ghlApiIntegration": false,
    "multiLanguage": false,
    "whiteLabel": false,
    "customDomain": false
  }'::jsonb,
  '{
    "provider": "openai",
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 1000,
    "systemPrompt": "You are a helpful assistant for GoHighLevel automation..."
  }'::jsonb,
  '{
    "ticketEnabled": true,
    "ticketCategories": ["technical", "billing", "feature_request", "other"],
    "slaHours": 24,
    "businessHours": {"timezone": "America/New_York", "start": "9:00", "end": "17:00"}
  }'::jsonb,
  '{
    "allowTenantOverrides": true,
    "showBaseContent": true,
    "customContentEnabled": true
  }'::jsonb,
  '{
    "enabled": true,
    "retentionDays": 90,
    "exportEnabled": true
  }'::jsonb,
  NOW(),
  NOW()
);

-- ============================================================================
-- Base Content: Getting Started
-- ============================================================================

INSERT INTO content_items (id, tenant_id, type, category, title, summary, content, tags, time_to_read, display_order, related_guide_ids)
VALUES
(
  'base-guide-001'::uuid,
  NULL, -- Base content (no tenant)
  'guide',
  'getting_started',
  'Welcome to GoHighLevel',
  'A complete introduction to the GoHighLevel platform and what you can accomplish.',
  E'# Welcome to GoHighLevel

GoHighLevel is an all-in-one platform designed for marketing agencies and businesses to manage their customer relationships, automate workflows, and grow their revenue.

## What is GoHighLevel?

GoHighLevel combines multiple tools into a single platform:

- **CRM**: Manage contacts, leads, and opportunities
- **Marketing Automation**: Create workflows and automated campaigns
- **Funnels & Websites**: Build landing pages and sales funnels
- **Calendar Booking**: Schedule appointments seamlessly
- **SMS & Email**: Multi-channel communication
- **Reputation Management**: Collect and manage reviews
- **Reporting**: Track performance and ROI

## Key Concepts

### Sub-Accounts (Locations)

If you\'re an agency, each client gets their own "sub-account" or "location". This keeps their data, contacts, and campaigns completely separate.

### Contacts & Pipelines

All your leads and customers are stored as **contacts**. You can organize them into **pipelines** (like "Sales", "Onboarding", "Support") to track their journey.

### Workflows

Workflows are automated sequences triggered by events (like "Contact fills out form"). They can send emails, SMS, create tasks, and more.

## Next Steps

1. **Set up your first sub-account** (if you\'re an agency)
2. **Import your contacts** from existing CRM or CSV
3. **Create your first workflow** to automate follow-ups
4. **Build a funnel** to capture leads

Ready to dive in? Check out our step-by-step guides!',
  ARRAY['basics', 'getting-started', 'overview'],
  '5 min',
  1,
  ARRAY[]::uuid[]
),
(
  'base-guide-002'::uuid,
  NULL,
  'guide',
  'getting_started',
  'Setting Up Your First Sub-Account',
  'Learn how to create and configure sub-accounts for your clients.',
  E'# Setting Up Your First Sub-Account

## What is a Sub-Account?

A sub-account (also called a "location") is a separate workspace for each of your clients. Each sub-account has its own:

- Contacts and pipelines
- Funnels and websites
- Calendars and workflows
- Campaigns and automations

## Creating a Sub-Account

1. **Navigate to Sub-Accounts**
   - Click "Sub-Accounts" in the left sidebar
   - Click "Add Sub-Account"

2. **Enter Basic Information**
   - Business Name
   - Industry (helps with templates)
   - Address and timezone

3. **Choose a Template**
   - Select a pre-built template (e.g., "Real Estate", "Dental Practice")
   - Or start from scratch

4. **Configure Settings**
   - Set business hours
   - Configure notification preferences
   - Add team members

## Best Practices

- **Use naming conventions**: "Client Name - Location" (e.g., "Acme Corp - Seattle")
- **Set up billing early**: Configure Stripe/payment processor before launching
- **Clone successful setups**: Use "Snapshot" feature to duplicate working configurations

## Snapshot Feature

The Snapshot feature lets you save and restore entire sub-account configurations:

1. Create a "Golden Template" with ideal setup
2. Save as Snapshot
3. Deploy to new sub-accounts in seconds

This saves hours of manual configuration!',
  ARRAY['sub-accounts', 'setup', 'agencies'],
  '7 min',
  2,
  ARRAY['base-guide-001'::uuid]
);

-- ============================================================================
-- Base Content: CRM & Contacts
-- ============================================================================

INSERT INTO content_items (id, tenant_id, type, category, title, summary, content, tags, time_to_read, display_order, related_guide_ids)
VALUES
(
  'base-guide-003'::uuid,
  NULL,
  'guide',
  'crm',
  'Understanding Contacts & Pipelines',
  'Master the core of GoHighLevel: managing contacts and sales pipelines.',
  E'# Understanding Contacts & Pipelines

## Contacts: Your Customer Database

Every person in your system is a **Contact**. Contacts store:

- **Basic Info**: Name, email, phone, address
- **Custom Fields**: Any data you need (industry, budget, etc.)
- **Tags**: Organize contacts into groups
- **Activity History**: All interactions (emails, calls, notes)
- **Pipeline Status**: Where they are in your sales process

## Pipelines: Visualize Your Sales Process

A **Pipeline** represents the stages a contact goes through:

**Example Sales Pipeline:**
1. New Lead
2. Contacted
3. Qualified
4. Proposal Sent
5. Closed Won / Lost

## Creating a Pipeline

1. Go to **Settings → Pipelines**
2. Click **Add Pipeline**
3. Name it (e.g., "Sales", "Onboarding")
4. Add stages with drag-and-drop
5. Configure automation for each stage

## Moving Contacts Through Stages

**Manual:**
- Drag contact cards between stages
- Or click contact → Change Stage

**Automated:**
- Workflows can move contacts automatically
- Based on actions (form fill, email reply, etc.)

## Pipeline Actions

Each stage can trigger:
- Send email/SMS
- Create task for team member
- Start a workflow
- Update contact fields
- Send webhook

## Best Practices

- **Keep it simple**: 4-7 stages is ideal
- **Define clear criteria**: What qualifies a lead to move forward?
- **Automate transitions**: Reduce manual work
- **Review weekly**: Look for bottlenecks

## Advanced: Multiple Pipelines

You can create multiple pipelines for different purposes:
- **Sales Pipeline**: New leads → Customers
- **Onboarding Pipeline**: New customer → Fully onboarded
- **Support Pipeline**: Issue reported → Resolved',
  ARRAY['crm', 'pipelines', 'contacts', 'sales'],
  '10 min',
  3,
  ARRAY['base-guide-001'::uuid]
);

-- ============================================================================
-- Base Content: Automation & Workflows
-- ============================================================================

INSERT INTO content_items (id, tenant_id, type, category, title, summary, content, tags, time_to_read, display_order, related_guide_ids)
VALUES
(
  'base-guide-004'::uuid,
  NULL,
  'guide',
  'automation',
  'Building Your First Workflow',
  'Step-by-step guide to creating powerful automation workflows.',
  E'# Building Your First Workflow

## What is a Workflow?

A **Workflow** is an automated sequence of actions triggered by an event. Think of it as "if this happens, do that".

**Example:**
- **Trigger**: Contact fills out "Demo Request" form
- **Actions**:
  1. Send confirmation email
  2. Notify sales team
  3. Add to "New Leads" pipeline
  4. Schedule follow-up task

## Creating a Workflow

### Step 1: Choose a Trigger

Go to **Automation → Workflows → Create Workflow**

Common triggers:
- **Form Submitted**: Contact fills out a specific form
- **Tag Added**: Contact gets a specific tag
- **Pipeline Stage Changed**: Contact moves to a stage
- **Appointment Booked**: Calendar booking created
- **Custom Webhook**: External system sends data

### Step 2: Add Actions

Click **+** to add actions:

**Communication:**
- Send Email
- Send SMS
- Make Phone Call (with Twilio)

**Organization:**
- Add/Remove Tags
- Update Custom Fields
- Move to Pipeline Stage
- Create Task/Appointment

**Logic:**
- Wait (delay next action)
- If/Else Conditions
- Go To (jump to another step)

**Advanced:**
- HTTP Request (call external API)
- Start Another Workflow

### Step 3: Test & Activate

1. Click **Test** to run with sample data
2. Review the execution log
3. Fix any errors
4. Click **Activate**

## Workflow Best Practices

### Use Wait Steps Wisely

Don\'t overwhelm contacts with instant messages. Add natural delays:

```
1. Send welcome email
2. Wait 1 day
3. Send "Getting Started" guide
4. Wait 3 days
5. Send "Need help?" check-in
```

### Add Conditions for Personalization

Use **If/Else** to branch based on contact data:

```
IF contact.industry = "Real Estate"
  → Send real estate case study
ELSE IF contact.industry = "Dental"
  → Send dental case study
ELSE
  → Send generic case study
```

### Name Workflows Clearly

Bad: "Workflow 1", "New Automation"
Good: "Demo Request → Sales Nurture", "Onboarding Sequence - Day 1-7"

## Common Workflow Examples

### Lead Nurture Sequence
1. Contact added to "Cold Leads"
2. Send intro email immediately
3. Wait 2 days → Send value content
4. Wait 3 days → Send case study
5. Wait 5 days → Send demo offer

### Appointment Reminder
1. Appointment booked
2. Send confirmation SMS
3. Wait until 24 hours before → Send reminder email
4. Wait until 1 hour before → Send reminder SMS

### Abandoned Cart Recovery
1. Contact adds to cart but doesn\'t purchase
2. Wait 1 hour
3. Send "You left something behind" email
4. Wait 1 day
5. Send discount code

## Troubleshooting

**Workflow not triggering?**
- Check trigger conditions
- Verify contact meets criteria
- Look at Workflow Logs

**Actions not executing?**
- Check for paused/stopped workflows
- Review error logs
- Test with sample contact',
  ARRAY['automation', 'workflows', 'triggers', 'getting-started'],
  '15 min',
  4,
  ARRAY['base-guide-001'::uuid, 'base-guide-003'::uuid]
);

-- ============================================================================
-- Base Content: Calendars & Booking
-- ============================================================================

INSERT INTO content_items (id, tenant_id, type, category, title, summary, content, tags, time_to_read, display_order, related_guide_ids)
VALUES
(
  'base-guide-005'::uuid,
  NULL,
  'guide',
  'calendars',
  'Setting Up Calendar Booking',
  'Configure calendars to let clients book appointments automatically.',
  E'# Setting Up Calendar Booking

## Why Use GoHighLevel Calendars?

Built-in calendar booking eliminates the back-and-forth:
- Clients book when convenient for them
- Automatic confirmations and reminders
- Syncs with Google Calendar, Outlook, etc.
- Reduces no-shows with SMS reminders

## Creating a Calendar

1. **Navigate to Calendars**
   - Go to **Settings → Calendars**
   - Click **Add Calendar**

2. **Basic Setup**
   - **Name**: "Initial Consultation", "Sales Call", etc.
   - **Duration**: 15, 30, 60 minutes
   - **Location**: Phone, Zoom, Office address

3. **Availability**
   - Set business hours (e.g., Mon-Fri 9am-5pm)
   - Block lunch breaks or personal time
   - Set buffer time between meetings (5-15 min)

4. **Connect Your Calendar**
   - Link Google Calendar or Outlook
   - GoHighLevel will check for conflicts
   - Two-way sync keeps everything updated

## Advanced Configuration

### Meeting Types

Create different calendars for different purposes:
- **Discovery Call** (15 min, free)
- **Strategy Session** (60 min, paid)
- **Emergency Support** (30 min, existing clients only)

### Qualifying Questions

Add custom questions to booking form:
- "What\'s your biggest challenge?"
- "What\'s your budget range?"
- "How did you hear about us?"

This pre-qualifies leads before the call!

### Payment Integration

Charge for appointments:
1. Enable **Require Payment**
2. Connect Stripe account
3. Set price ($97, $197, etc.)
4. Payment required before booking confirmed

## Embedding Your Calendar

### Option 1: Direct Link
Share: `https://yourdomain.com/widget/bookings/calendar-id`

### Option 2: Embed in Website
```html
<iframe src="https://yourdomain.com/widget/bookings/calendar-id"
        width="100%" height="800px" frameborder="0">
</iframe>
```

### Option 3: Add to Funnel
Use Calendar widget in GoHighLevel funnels

## Reducing No-Shows

### Confirmation & Reminders
1. **Immediate**: Confirmation email + SMS
2. **24 hours before**: Reminder email
3. **1 hour before**: Reminder SMS

### Require Confirmation
Ask them to reply "YES" to confirm 24 hours prior

### Use Zoom for Remote Calls
Auto-generate Zoom links → Less friction

## Best Practices

- **Buffer time**: 10-15 min between calls prevents overlaps
- **Limit daily bookings**: Avoid burnout (max 6-8 calls/day)
- **Reschedule policy**: Allow 24-hour cancellation window
- **Follow-up workflow**: Automatically send recap email after call',
  ARRAY['calendars', 'booking', 'appointments', 'scheduling'],
  '12 min',
  5,
  ARRAY['base-guide-001'::uuid]
);

-- ============================================================================
-- Base Content: Troubleshooting
-- ============================================================================

INSERT INTO content_items (id, tenant_id, type, category, title, summary, content, tags, time_to_read, display_order, related_guide_ids)
VALUES
(
  'base-guide-006'::uuid,
  NULL,
  'guide',
  'troubleshooting',
  'Common Issues & Solutions',
  'Quick fixes for the most common problems in GoHighLevel.',
  E'# Common Issues & Solutions

## Emails Not Sending

### Check Email Service Connection
1. Go to **Settings → Email Services**
2. Verify your domain is connected
3. Check SPF, DKIM, and DMARC records

### Check Contact Preferences
- Contact may have unsubscribed
- Email may be invalid/bounced

### Check Workflow Logs
- Look for error messages
- Verify email template has no errors

## SMS Not Delivering

### Verify Phone Number Format
- Must include country code: +1 for US
- No spaces or special characters

### Check Credits
- Go to **Settings → Phone Numbers**
- Ensure you have SMS credits available

### Carrier Restrictions
- Some carriers block automated SMS
- Use verified Toll-Free or 10DLC numbers

## Workflow Not Triggering

### Check Trigger Conditions
- Is contact meeting all criteria?
- Are there conflicting conditions?

### Verify Workflow is Active
- Click workflow → Ensure toggle is ON
- Check for scheduling restrictions

### Review Recent Changes
- Did someone edit the trigger?
- Check workflow version history

## Calendar Bookings Not Syncing

### Reconnect Calendar
1. Go to **Settings → Calendars**
2. Disconnect and reconnect Google/Outlook
3. Re-authorize permissions

### Check Timezone Settings
- Contact timezone must match calendar settings
- Verify in **Settings → Business Profile**

## Payment Issues

### Stripe Connection
1. Go to **Settings → Payments**
2. Disconnect and reconnect Stripe
3. Verify API keys are correct

### Test Mode vs Live Mode
- Ensure you\'re using LIVE API keys
- Check Stripe dashboard for transactions

## Contact Not Receiving Messages

### Check DND (Do Not Disturb)
- Contacts can enable DND (9pm-8am default)
- Override only for urgent messages

### Review Contact Activity
- Check if previous messages bounced
- Look for unsubscribe events

## Funnel Pages Not Loading

### Clear Cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Check Custom Domain
- Verify DNS settings
- Allow 24-48 hours for propagation

### Review Page Settings
- Ensure page is published (not draft)
- Check for JavaScript errors in console

## Performance Issues

### Too Many Workflows Running
- Review active workflows
- Disable unused automations
- Combine similar workflows

### Large Contact Lists
- Segment contacts with tags
- Archive inactive contacts
- Use filters instead of loading all

## Getting More Help

Still stuck? Here\'s how to get support:

1. **Search Knowledge Base**: Check for existing guides
2. **Ask AI Assistant**: Get instant answers
3. **Submit Support Ticket**: Our team responds in 2-4 hours
4. **Join Community**: Facebook group for peer support

### When Submitting a Ticket

Include:
- **Screenshots**: Visual context helps
- **Error messages**: Copy exact text
- **Steps to reproduce**: How did it happen?
- **What you\'ve tried**: Saves time troubleshooting',
  ARRAY['troubleshooting', 'issues', 'support', 'help'],
  '10 min',
  99,
  ARRAY[]::uuid[]
);

-- ============================================================================
-- Update related_guide_ids to create interconnected content web
-- ============================================================================

UPDATE content_items SET related_guide_ids = ARRAY[
  'base-guide-002'::uuid,
  'base-guide-003'::uuid,
  'base-guide-004'::uuid
] WHERE id = 'base-guide-001'::uuid;

UPDATE content_items SET related_guide_ids = ARRAY[
  'base-guide-001'::uuid,
  'base-guide-004'::uuid
] WHERE id = 'base-guide-002'::uuid;

UPDATE content_items SET related_guide_ids = ARRAY[
  'base-guide-001'::uuid,
  'base-guide-004'::uuid,
  'base-guide-005'::uuid
] WHERE id = 'base-guide-003'::uuid;

UPDATE content_items SET related_guide_ids = ARRAY[
  'base-guide-001'::uuid,
  'base-guide-003'::uuid,
  'base-guide-005'::uuid
] WHERE id = 'base-guide-004'::uuid;

UPDATE content_items SET related_guide_ids = ARRAY[
  'base-guide-001'::uuid,
  'base-guide-004'::uuid,
  'base-guide-003'::uuid
] WHERE id = 'base-guide-005'::uuid;

-- ============================================================================
-- Done! Base content is ready for all tenants to inherit.
-- ============================================================================
