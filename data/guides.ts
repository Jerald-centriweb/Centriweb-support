import { GuideArea } from '../types';

export const GUIDE_DATA: GuideArea[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    iconName: 'Rocket',
    description: 'Everything you need to know to launch your account successfully.',
    guides: [
      {
        id: 'platform-overview',
        title: 'Platform Overview',
        summary: 'A high-level tour of the dashboard and core features.',
        tags: ['basics', 'dashboard', 'navigation'],
        timeToRead: '5 min',
        content: `
# Welcome to GoHighLevel

GoHighLevel is your all-in-one growth engine for agencies and businesses. This guide will walk you through the main interface.

## The Dashboard
The dashboard is your mission control. Here you can see:
- **Opportunities:** Total value in your pipeline
- **Conversion Rate:** How well you are closing deals
- **Tasks:** What you need to do today
- **Calendar:** Upcoming appointments

## Navigation
The sidebar on the left gives you access to all tools. You can collapse it to save space on smaller screens.

## Quick Actions
Use the search bar (Cmd+K) to quickly navigate anywhere in the platform.
        `,
        relatedGuideIds: ['account-setup', 'quick-start-guide']
      },
      {
        id: 'account-setup',
        title: 'Account Setup Checklist',
        summary: 'Complete these essential steps to activate your account fully.',
        tags: ['setup', 'onboarding', 'essentials'],
        timeToRead: '10 min',
        content: `
# Your 7-Step Setup Checklist

Follow these steps to get your account fully configured and ready for success.

## 1. Connect Your Google Calendar
Sync your appointments and avoid double-bookings. Go to Settings → Integrations → Calendar.

## 2. Add a Payment Method
Ensure your subscription is active. Navigate to Settings → Billing.

## 3. Verify Your Email Domain
**Critical for deliverability!** Configure SPF, DKIM, and DMARC records. See Settings → Email Services.

## 4. Connect Social Accounts
Link Facebook, Instagram, and LinkedIn for social messaging. Found in Settings → Integrations.

## 5. Set Up Your First Pipeline
Create a sales process that matches your business. Go to Opportunities → Settings.

## 6. Download the Mobile App
Manage leads on the go. Available for iOS and Android.

## 7. Invite Your Team
Add team members and assign permissions. Settings → Team Management.
        `,
        relatedGuideIds: ['platform-overview', 'email-deliverability']
      },
      {
        id: 'quick-start-guide',
        title: 'Quick Start: First 24 Hours',
        summary: 'Hit the ground running with this accelerated setup guide.',
        tags: ['quick-start', 'setup', 'beginner'],
        timeToRead: '8 min',
        content: `
# Your First 24 Hours with GoHighLevel

Let's get you up and running quickly with the essentials.

## Hour 1: Account Basics
- Complete profile information
- Upload your logo
- Set your timezone
- Configure business hours

## Hour 2-4: Essential Integrations
- Connect your domain
- Set up email sending
- Link your calendar
- Install tracking code on your website

## Hour 4-8: First Campaign
- Import your first contacts
- Create a simple workflow
- Design a landing page
- Set up a form

## Hour 8-24: Testing & Refinement
- Test all integrations
- Send test emails and SMS
- Review analytics dashboard
- Familiarize yourself with reporting
        `,
        relatedGuideIds: ['account-setup', 'platform-overview']
      }
    ]
  },
  {
    id: 'contacts',
    title: 'Contacts & CRM',
    iconName: 'Users',
    description: 'Manage your contacts, tags, custom fields, and smart lists.',
    guides: [
      {
        id: 'contact-management',
        title: 'Contact Management Basics',
        summary: 'Learn how to add, organize, and segment your contacts effectively.',
        tags: ['contacts', 'crm', 'organization'],
        timeToRead: '6 min',
        content: `
# Managing Your Contacts

Your contact database is the heart of your CRM. Here's how to master it.

## Adding Contacts
- **Manually:** Click "+ Add Contact" in the Contacts tab
- **Import:** Upload CSV files with your existing database
- **Forms:** Contacts added automatically when forms are submitted
- **API:** Integrate with external systems

## Contact Fields
Use custom fields to track any information you need:
- Standard fields (name, email, phone)
- Custom fields (industry, budget, interests)
- System fields (source, last activity, lead score)

## Tags for Organization
Tags are powerful for segmentation:
- **Source tags:** Where did they come from?
- **Interest tags:** What are they interested in?
- **Stage tags:** Where are they in your funnel?

## Smart Lists
Create dynamic segments based on criteria like:
- Tags
- Custom field values
- Activity history
- Opportunity stage
        `,
        relatedGuideIds: ['understanding-pipelines', 'bulk-actions']
      },
      {
        id: 'bulk-actions',
        title: 'Bulk Actions & Contact Management',
        summary: 'Save time with bulk operations on multiple contacts at once.',
        tags: ['contacts', 'efficiency', 'bulk-actions'],
        timeToRead: '5 min',
        content: `
# Bulk Contact Operations

Manage hundreds or thousands of contacts efficiently with bulk actions.

## Available Bulk Actions
- Add/remove tags
- Update custom fields
- Add to pipeline
- Delete contacts
- Export to CSV
- Send bulk messages (with compliance!)

## How to Use Bulk Actions
1. Go to Contacts tab
2. Use filters to find your target group
3. Select contacts (checkbox or "Select All")
4. Click "Bulk Actions" button
5. Choose your action

## Best Practices
- Always test with a small group first
- Use filters carefully to avoid mistakes
- Export before major changes
- Respect opt-out and GDPR rules
        `,
        relatedGuideIds: ['contact-management', 'workflow-builder']
      }
    ]
  },
  {
    id: 'opportunities',
    title: 'Pipelines & Opportunities',
    iconName: 'Kanban',
    description: 'Manage your sales pipelines, track deals, and forecast revenue.',
    guides: [
      {
        id: 'understanding-pipelines',
        title: 'Understanding Pipelines',
        summary: 'How to structure your sales process efficiently with pipelines.',
        tags: ['crm', 'sales', 'pipelines'],
        timeToRead: '7 min',
        content: `
# Pipelines Explained

A pipeline represents a specific sales process. Most businesses have at least one, often called "Sales Pipeline".

## What is a Pipeline?
Think of it as a visual representation of your sales funnel. Each opportunity (potential deal) moves through stages until it's won or lost.

## Common Pipeline Types
- **Sales Pipeline:** Main revenue-generating process
- **Recruiting Pipeline:** For agencies hiring talent
- **Onboarding Pipeline:** Client activation process
- **Upsell Pipeline:** Existing customer expansion

## Stages
Stages are the steps a lead takes. Common stages:
- New Lead
- Qualified
- Meeting Scheduled
- Proposal Sent
- Negotiation
- Closed Won
- Closed Lost

## Moving Opportunities
- **Manual:** Drag and drop cards between stages
- **Automated:** Use workflows to move based on triggers (booked appointment, form submitted, etc.)

## Pipeline Settings
Configure in Settings → Pipelines:
- Stage names and order
- Win probability per stage
- Required fields before advancing
- Automation rules
        `,
        relatedGuideIds: ['creating-opportunities', 'pipeline-automation']
      },
      {
        id: 'creating-opportunities',
        title: 'Creating & Managing Opportunities',
        summary: 'Add deals to your pipeline and track them through to close.',
        tags: ['opportunities', 'deals', 'sales'],
        timeToRead: '6 min',
        content: `
# Working with Opportunities

Learn how to create, update, and manage deals in your pipeline.

## Creating an Opportunity
1. Go to Opportunities tab
2. Click "+ Add Opportunity"
3. Select the contact
4. Choose the pipeline
5. Set the deal value
6. Assign to a team member
7. Set expected close date

## Opportunity Details
Each opportunity tracks:
- **Contact:** Who is this deal with?
- **Value:** How much is it worth?
- **Stage:** Where is it in the process?
- **Status:** Open, Won, Lost, Abandoned
- **Assigned To:** Team member responsible
- **Notes:** Internal comments and history

## Best Practices
- Always set realistic deal values
- Update stages promptly
- Add notes after every interaction
- Use tasks for follow-ups
- Review pipeline weekly
        `,
        relatedGuideIds: ['understanding-pipelines', 'contact-management']
      },
      {
        id: 'pipeline-automation',
        title: 'Automating Pipeline Movement',
        summary: 'Set up triggers to automatically advance deals through stages.',
        tags: ['automation', 'pipelines', 'workflows'],
        timeToRead: '8 min',
        content: `
# Pipeline Automation

Save time and ensure consistency by automating opportunity movement.

## Common Automation Scenarios

### Scenario 1: New Form Submission
- Trigger: Form submitted
- Action: Create opportunity in "New Lead" stage

### Scenario 2: Appointment Booked
- Trigger: Calendar appointment confirmed
- Action: Move to "Meeting Scheduled" stage

### Scenario 3: Proposal Sent
- Trigger: Email with "Proposal" tag sent
- Action: Move to "Proposal Sent" stage
- Action: Create task "Follow up in 3 days"

## Setting Up Pipeline Automation
1. Go to Automation → Workflows
2. Create new workflow
3. Choose trigger (form, appointment, tag, etc.)
4. Add action: "Update Opportunity"
5. Select pipeline and target stage
6. Save and test

## Pro Tips
- Don't over-automate - some stages need human judgment
- Always test with dummy data first
- Use conditions to prevent errors
- Monitor automation logs regularly
        `,
        relatedGuideIds: ['workflow-builder', 'understanding-pipelines']
      }
    ]
  },
  {
    id: 'conversations',
    title: 'Conversations',
    iconName: 'MessageSquare',
    description: 'Manage SMS, email, and chat communications in one unified inbox.',
    guides: [
      {
        id: 'unified-inbox',
        title: 'Using the Unified Inbox',
        summary: 'Handle all customer communications from one central location.',
        tags: ['conversations', 'inbox', 'communication'],
        timeToRead: '7 min',
        content: `
# The Unified Inbox

All your customer conversations in one place: SMS, email, Facebook, Instagram, and more.

## Inbox Overview
The inbox shows:
- All conversations across channels
- Unread message count
- Last message timestamp
- Assigned team member
- Contact details

## Message Types
- **SMS:** Text messages to/from contacts
- **Email:** Full email conversations
- **Facebook Messenger:** Social media DMs
- **Instagram DM:** Instagram direct messages
- **WhatsApp:** WhatsApp conversations (if enabled)
- **Live Chat:** Website widget conversations

## Managing Conversations
- **Assign:** Assign conversations to team members
- **Status:** Mark as open, pending, or closed
- **Internal Notes:** Add notes only your team can see
- **Templates:** Use saved replies for common questions
- **Quick Actions:** Add tags, create tasks, update opportunities

## Keyboard Shortcuts
- \`Cmd/Ctrl + K\` - Search conversations
- \`E\` - Archive conversation
- \`R\` - Reply to message
- \`T\` - Add tag
        `,
        relatedGuideIds: ['sms-conversations', 'email-campaigns']
      },
      {
        id: 'sms-conversations',
        title: 'SMS & Text Messaging',
        summary: 'Send and receive text messages with proper compliance.',
        tags: ['sms', 'texting', 'messaging'],
        timeToRead: '9 min',
        content: `
# SMS Messaging Best Practices

Text messaging is one of the highest-engagement channels. Use it wisely.

## Getting Started with SMS
1. Purchase a phone number (Settings → Phone Numbers)
2. Enable SMS in your sub-account
3. Configure compliance settings
4. Add contacts with valid mobile numbers
5. Get consent before texting (required by law!)

## Compliance is Critical
**You must follow TCPA and carrier guidelines:**
- Only text contacts who opted in
- Include opt-out language ("Reply STOP to unsubscribe")
- Avoid prohibited content (loans, cannabis, etc.)
- Don't text outside 8am-9pm local time
- Never use URL shorteners (high spam risk)

## SMS Best Practices
- Keep messages under 160 characters when possible
- Personalize with merge fields
- Use scheduling for optimal timing
- Track delivery and engagement rates
- Respect opt-outs immediately

## Common Use Cases
- Appointment reminders
- Follow-up sequences
- Lead nurturing
- Event notifications
- Customer support

## Troubleshooting
- **Not delivered?** Check if number is mobile
- **High opt-out rate?** Review message frequency
- **Low response rate?** Test different messaging
        `,
        relatedGuideIds: ['unified-inbox', 'workflow-builder']
      },
      {
        id: 'email-campaigns',
        title: 'Email Marketing Campaigns',
        summary: 'Design, send, and track email campaigns that convert.',
        tags: ['email', 'marketing', 'campaigns'],
        timeToRead: '12 min',
        content: `
# Email Marketing Mastery

Build effective email campaigns that get opened, clicked, and drive results.

## Email Campaign Types
- **Broadcast:** One-time send to a segment
- **Drip Campaign:** Automated sequence
- **Newsletter:** Regular updates
- **Transactional:** Receipts, confirmations, etc.

## Creating a Campaign
1. Go to Marketing → Email
2. Choose template or build from scratch
3. Design your email (drag-and-drop builder)
4. Add subject line and preview text
5. Select recipient list/smart list
6. Schedule or send immediately
7. Review analytics after sending

## Email Design Best Practices
- Mobile-first design (60%+ open on mobile)
- Clear call-to-action button
- Compelling subject line (40-50 characters)
- Personalization with merge tags
- Images with alt text
- Plain-text version included

## Deliverability Tips
- Verify your domain (SPF, DKIM, DMARC)
- Maintain good sender reputation
- Clean your list regularly (remove bounces)
- Avoid spam trigger words
- Test before sending
- Monitor engagement rates

## Key Metrics
- **Open Rate:** 15-25% is average
- **Click Rate:** 2-5% is typical
- **Bounce Rate:** Keep under 2%
- **Unsubscribe Rate:** Under 0.5% is healthy
        `,
        relatedGuideIds: ['email-deliverability', 'unified-inbox']
      }
    ]
  },
  {
    id: 'calendars',
    title: 'Calendars & Scheduling',
    iconName: 'Calendar',
    description: 'Set up appointment booking, calendar sync, and automated reminders.',
    guides: [
      {
        id: 'calendar-setup',
        title: 'Calendar Setup & Configuration',
        summary: 'Connect your calendar and configure appointment settings.',
        tags: ['calendar', 'scheduling', 'setup'],
        timeToRead: '10 min',
        content: `
# Setting Up Your Calendar

Enable seamless appointment booking with calendar integration.

## Connecting Your Calendar
Supported calendar platforms:
- **Google Calendar** (recommended)
- **Office 365/Outlook**
- **CalDAV**

### Connection Steps
1. Go to Settings → Integrations → Calendar
2. Click "Connect Calendar"
3. Authorize access to your calendar
4. Select which calendar to use for appointments
5. Configure two-way sync settings

## Calendar Settings
Configure these important options:
- **Buffer time:** Padding before/after appointments
- **Minimum notice:** How far in advance can people book?
- **Date range:** How far into the future?
- **Business hours:** When are you available?
- **Blocked times:** Regular blocks (lunch, admin time)

## Creating Calendar Links
1. Go to Calendars tab
2. Click "+ New Calendar"
3. Set appointment type and duration
4. Configure availability
5. Design booking page
6. Copy shareable link

## Team Calendars
For multiple team members:
- Round-robin scheduling
- Collective availability
- Specific team member selection
- Load balancing options
        `,
        relatedGuideIds: ['appointment-reminders', 'calendar-workflows']
      },
      {
        id: 'appointment-reminders',
        title: 'Automated Appointment Reminders',
        summary: 'Reduce no-shows with SMS and email reminders.',
        tags: ['calendar', 'reminders', 'automation'],
        timeToRead: '6 min',
        content: `
# Appointment Reminder Automation

Reduce no-shows by up to 80% with automated reminders.

## Why Reminders Matter
- Average no-show rate without reminders: 20-30%
- With reminders: 5-10%
- Each no-show costs time and revenue

## Recommended Reminder Sequence
1. **Immediate:** Confirmation right after booking
2. **24 hours before:** "Your appointment is tomorrow"
3. **2 hours before:** "Don't forget - appointment in 2 hours"
4. **Post-appointment:** Thank you + feedback request

## Setting Up Reminders
1. Go to Automation → Workflows
2. Create new workflow
3. Trigger: "Appointment Booked"
4. Add action: "Send SMS" or "Send Email"
5. Use merge fields: {contact.name}, {appointment.time}, etc.
6. Set delay (24 hours before, etc.)
7. Save and activate

## SMS vs Email Reminders
- **SMS:** Higher open rate (98%), great for last-minute
- **Email:** More detail, good for confirmation
- **Both:** Maximum effectiveness

## Pro Tip
Add timezone in reminder messages to avoid confusion!
        `,
        relatedGuideIds: ['calendar-setup', 'workflow-builder']
      }
    ]
  },
  {
    id: 'websites',
    title: 'Websites & Funnels',
    iconName: 'Globe',
    description: 'Build high-converting landing pages, funnels, and websites.',
    guides: [
      {
        id: 'funnel-builder',
        title: 'Building Your First Funnel',
        summary: 'Create landing pages and multi-step funnels that convert.',
        tags: ['funnels', 'landing-pages', 'conversion'],
        timeToRead: '15 min',
        content: `
# Funnel Builder Guide

Build beautiful, high-converting funnels without code.

## What is a Funnel?
A funnel is a series of pages designed to guide visitors toward a specific action (booking, purchase, signup).

## Common Funnel Types
- **Lead Generation:** Capture contact info
- **Webinar Registration:** Event signups
- **Consultation Booking:** Service-based businesses
- **E-commerce:** Product sales
- **Membership:** Subscription signups

## Building a Funnel
1. Go to Sites → Funnels
2. Click "+ New Funnel"
3. Choose template or start blank
4. Add/arrange pages (landing, thank you, etc.)
5. Design each page with drag-and-drop builder
6. Connect forms and calendars
7. Set up tracking and pixels
8. Publish to custom domain

## Funnel Builder Elements
Drag these onto your pages:
- Headlines & text
- Images & videos
- Forms (lead capture)
- Buttons (CTAs)
- Calendars (booking widgets)
- Countdown timers
- Social proof
- Testimonials

## Mobile Optimization
- Every element auto-adjusts for mobile
- Preview in mobile mode before publishing
- Test on real devices
        `,
        relatedGuideIds: ['forms-setup', 'custom-domains']
      },
      {
        id: 'custom-domains',
        title: 'Custom Domain Setup',
        summary: 'Connect your own domain to funnels and websites.',
        tags: ['domains', 'dns', 'technical'],
        timeToRead: '8 min',
        content: `
# Custom Domain Configuration

Use your own branded domain instead of default URLs.

## Why Use a Custom Domain?
- Professional branding
- Better trust from visitors
- Improved SEO
- Consistent brand experience

## Prerequisites
- Own a domain (GoDaddy, Namecheap, etc.)
- Access to DNS settings

## Setup Steps
1. Go to Settings → Domains
2. Click "+ Add Domain"
3. Enter your domain (e.g., book.yourbusiness.com)
4. Copy the provided DNS records
5. Add records in your domain registrar:
   - **A Record:** Points to IP address
   - **CNAME Record:** Points subdomain to platform
6. Wait for DNS propagation (can take up to 48 hours)
7. Verify in GoHighLevel
8. Enable SSL certificate (automatic)

## Best Practices
- Use subdomains for different funnels
- Enable SSL (HTTPS) always
- Use descriptive subdomains (book.yourdomain.com)
        `,
        relatedGuideIds: ['funnel-builder', 'email-deliverability']
      }
    ]
  },
  {
    id: 'automation',
    title: 'Automation & Workflows',
    iconName: 'Workflow',
    description: 'Build powerful automation workflows to save time and scale.',
    guides: [
      {
        id: 'workflow-builder',
        title: 'Workflow Builder Fundamentals',
        summary: 'Master the trigger-action logic of the automation engine.',
        tags: ['workflows', 'triggers', 'actions'],
        timeToRead: '15 min',
        content: `
# The Workflow Builder

Workflows are the brain of your operation. Automate repetitive tasks and scale your business.

## What is a Workflow?
A workflow is an automated sequence of actions that occurs when a specific trigger happens.

## Common Triggers
- **Form Submitted:** When someone fills out a form
- **Tag Added:** When a contact receives a tag
- **Appointment Booked:** Calendar appointment created
- **Opportunity Stage Changed:** Pipeline movement
- **Email Opened/Clicked:** Engagement tracking
- **Date/Time:** Schedule workflows
- **Custom Webhook:** External system integration

## Common Actions
- **Send Email/SMS:** Communicate with contacts
- **Add/Remove Tag:** Update contact organization
- **Create Opportunity:** Add to pipeline
- **Assign To User:** Route to team member
- **Wait/Delay:** Pause before next action
- **If/Else Conditions:** Branch based on criteria
- **Create Task:** Add to to-do list
- **Send Webhook:** Integrate external systems

## Building Your First Workflow
1. Go to Automation → Workflows
2. Click "+ Create Workflow"
3. Name your workflow
4. Choose a trigger
5. Add conditions (optional)
6. Add actions
7. Test with sample data
8. Activate workflow

## Workflow Best Practices
- Start simple, add complexity gradually
- Test thoroughly before activating
- Use clear naming conventions
- Document complex workflows
- Monitor performance metrics
- Review and optimize regularly
        `,
        relatedGuideIds: ['first-automation', 'advanced-conditions']
      },
      {
        id: 'first-automation',
        title: 'Your First Automation',
        summary: 'Step-by-step tutorial to create a simple welcome sequence.',
        tags: ['automation', 'beginner', 'tutorial'],
        timeToRead: '10 min',
        content: `
# Create Your First Automation

Let's build a simple but powerful welcome sequence for new contacts.

## Goal
When someone fills out your contact form, they receive:
1. Immediate thank you email
2. SMS after 5 minutes
3. Follow-up email the next day

## Step-by-Step Instructions

### Step 1: Create the Workflow
1. Go to Automation → Workflows
2. Click "+ Create Workflow"
3. Name it "Welcome Sequence"
4. Select folder/category

### Step 2: Set the Trigger
1. Click "+ Add Trigger"
2. Choose "Form Submitted"
3. Select your contact form
4. Save trigger

### Step 3: Immediate Email
1. Click "+ Add Action"
2. Choose "Send Email"
3. Subject: "Thanks for reaching out!"
4. Body: Warm welcome message
5. Save action

### Step 4: Test & Activate
1. Click "Test Workflow"
2. Use a test contact
3. Verify all messages send correctly
4. Click "Activate" when ready

## Congratulations!
You've created your first automation. Now scale this concept to all areas of your business.
        `,
        relatedGuideIds: ['workflow-builder', 'email-campaigns']
      },
      {
        id: 'advanced-conditions',
        title: 'Advanced Conditions & Branching',
        summary: 'Use if/else logic to create intelligent, adaptive workflows.',
        tags: ['automation', 'advanced', 'conditions'],
        timeToRead: '12 min',
        content: `
# Advanced Workflow Conditions

Create intelligent workflows that adapt based on contact behavior and data.

## What Are Conditions?
Conditions let your workflow make decisions and branch into different paths based on criteria.

## Condition Types
- **Tag Exists:** Check if contact has specific tag
- **Custom Field Value:** Check field values
- **Opportunity Stage:** Check pipeline position
- **Email Engagement:** Opened? Clicked?
- **Appointment Status:** Booked? Showed? No-show?
- **Multiple Conditions:** AND/OR logic

## Best Practices
- Keep conditions simple when possible
- Test all branches thoroughly
- Document your logic
- Avoid deeply nested conditions (hard to maintain)
- Use tags strategically for easier conditions
        `,
        relatedGuideIds: ['workflow-builder', 'contact-management']
      }
    ]
  },
  {
    id: 'ai-agents',
    title: 'AI & Chatbots',
    iconName: 'Bot',
    description: 'Deploy AI-powered chatbots and conversation assistants.',
    guides: [
      {
        id: 'ai-assistant-setup',
        title: 'Setting Up Your AI Assistant',
        summary: 'Configure an AI-powered chatbot to handle conversations.',
        tags: ['ai', 'chatbot', 'automation'],
        timeToRead: '14 min',
        content: `
# AI Assistant Configuration

Deploy intelligent AI assistants to handle customer conversations 24/7.

## What Can AI Assistants Do?
- Answer common questions
- Qualify leads
- Book appointments
- Route to human agents
- Collect information
- Provide instant support

## Setup Process
1. Go to Settings → AI & Bots
2. Click "+ New AI Assistant"
3. Name your assistant
4. Configure personality and tone
5. Add knowledge base content
6. Set up fallback rules
7. Test thoroughly
8. Deploy to channels

## Training Your AI
Feed it information:
- FAQ documents
- Product documentation
- Common objections & responses
- Your website content
- Previous chat transcripts

## Best Practices
- Start with narrow use cases
- Monitor conversations regularly
- Continuously improve with real data
- Always offer human escalation option
- Be transparent that it's an AI
- Test edge cases thoroughly
        `,
        relatedGuideIds: ['unified-inbox', 'workflow-builder']
      }
    ]
  },
  {
    id: 'reporting',
    title: 'Reporting & Analytics',
    iconName: 'BarChart',
    description: 'Track performance, revenue, and key metrics with detailed reports.',
    guides: [
      {
        id: 'analytics-dashboard',
        title: 'Understanding Your Analytics Dashboard',
        summary: 'Navigate reports and understand your key business metrics.',
        tags: ['analytics', 'reporting', 'metrics'],
        timeToRead: '11 min',
        content: `
# Analytics Dashboard Guide

Make data-driven decisions with comprehensive reporting.

## Dashboard Overview
Your main dashboard shows:
- Revenue metrics
- Opportunity pipeline value
- Conversion rates
- Active campaigns
- Recent activity
- Team performance

## Key Metrics to Track

### Revenue Metrics
- Total revenue (monthly, quarterly, yearly)
- Average deal size
- Revenue by source
- Revenue by team member

### Pipeline Metrics
- Total pipeline value
- Opportunities by stage
- Average time in each stage
- Win rate by stage
- Forecasted revenue

### Marketing Metrics
- Form conversion rates
- Landing page performance
- Email open rates
- SMS engagement

## Custom Reports
Build custom reports to track exactly what matters to your business.
        `,
        relatedGuideIds: ['understanding-pipelines', 'email-campaigns']
      }
    ]
  },
  {
    id: 'reputation',
    title: 'Reputation Management',
    iconName: 'Star',
    description: 'Collect reviews, manage feedback, and build your online reputation.',
    guides: [
      {
        id: 'review-requests',
        title: 'Automated Review Requests',
        summary: 'Set up automated campaigns to collect more 5-star reviews.',
        tags: ['reviews', 'reputation', 'automation'],
        timeToRead: '9 min',
        content: `
# Automating Review Collection

Build a steady stream of positive reviews with automation.

## Why Reviews Matter
- Build trust with prospects
- Improve local SEO rankings
- Increase conversion rates
- Provide social proof
- Competitive advantage

## Review Request Workflow
1. **Trigger:** Appointment marked "Completed"
2. **Wait:** 2-4 hours (let experience settle)
3. **Send SMS:** "How was your experience?"
4. **Condition:** If positive → Request public review
5. **Condition:** If negative → Route to internal feedback

## Best Platforms for Reviews
- **Google Business Profile:** Most important for local SEO
- **Facebook:** Social proof for ads
- **Yelp:** Depends on industry
- **Industry-specific:** Zillow, Healthgrades, etc.

## Review Response Strategy
- Respond to ALL reviews (positive and negative)
- Respond within 24-48 hours
- Thank positive reviewers
- Address concerns professionally
- Never argue or get defensive
        `,
        relatedGuideIds: ['workflow-builder', 'sms-conversations']
      }
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations',
    iconName: 'Plug',
    description: 'Connect with Zapier, webhooks, and third-party applications.',
    guides: [
      {
        id: 'zapier-integration',
        title: 'Zapier Integration Guide',
        summary: 'Connect with 5,000+ apps using Zapier integration.',
        tags: ['integrations', 'zapier', 'automation'],
        timeToRead: '10 min',
        content: `
# Connecting with Zapier

Extend your capabilities by connecting to thousands of apps.

## What is Zapier?
Zapier connects different apps and automates workflows between them.

## Common Zapier Use Cases
- Add new leads to Google Sheets
- Create Slack notifications for new opportunities
- Send data to CRM systems
- Update accounting software
- Sync with project management tools

## Setting Up Zapier
1. Create account at zapier.com
2. Search for "GoHighLevel" app
3. Click "Connect"
4. Authenticate with API key
5. Create your first Zap

## Popular Zaps

### New Contact → Google Sheets
- Trigger: New contact in GHL
- Action: Add row to Google Sheets
- Use case: Backup contact database

### New Opportunity → Slack
- Trigger: New opportunity created
- Action: Send Slack message
- Use case: Notify sales team
        `,
        relatedGuideIds: ['webhook-integration', 'workflow-builder']
      },
      {
        id: 'webhook-integration',
        title: 'Webhooks & API Integration',
        summary: 'Send data to external systems with webhooks and custom APIs.',
        tags: ['webhooks', 'api', 'technical'],
        timeToRead: '13 min',
        content: `
# Webhooks & Custom Integrations

Build powerful custom integrations with webhooks and the API.

## What is a Webhook?
A webhook sends real-time data to an external URL when specific events occur.

## Common Webhook Events
- Contact created/updated
- Opportunity created/stage changed
- Appointment booked/cancelled
- Form submitted
- Email/SMS sent
- Tag added/removed

## Setting Up Webhooks
1. Go to Settings → Webhooks
2. Click "+ Add Webhook"
3. Choose event trigger
4. Enter destination URL
5. Configure payload
6. Add authentication headers (if needed)
7. Test webhook
8. Save

## Security Best Practices
- Use HTTPS for webhook URLs
- Validate webhook signatures
- Keep API keys secret
- Use environment variables
- Implement IP whitelisting if possible
        `,
        relatedGuideIds: ['zapier-integration', 'workflow-builder']
      }
    ]
  },
  {
    id: 'billing',
    title: 'Account & Billing',
    iconName: 'CreditCard',
    description: 'Manage your subscription, billing, and account settings.',
    guides: [
      {
        id: 'billing-management',
        title: 'Billing & Subscription Management',
        summary: 'Update payment methods, view invoices, and manage your plan.',
        tags: ['billing', 'subscription', 'account'],
        timeToRead: '7 min',
        content: `
# Managing Your Billing

Everything you need to know about billing, payments, and subscriptions.

## Accessing Billing
1. Go to Settings → Billing
2. View current plan details
3. See payment history
4. Download invoices

## Updating Payment Method
1. Go to Settings → Billing → Payment Method
2. Click "Update Card"
3. Enter new card details
4. Save changes

## Viewing Invoices
- All invoices available in Billing section
- Download as PDF
- Send to accounting team
- View transaction history

## Changing Your Plan
1. Go to Settings → Billing → Change Plan
2. Review available plans
3. Select new plan
4. Confirm changes
5. Prorated billing applied automatically
        `,
        relatedGuideIds: ['account-setup']
      },
      {
        id: 'email-deliverability',
        title: 'Email Deliverability Setup',
        summary: 'Configure SPF, DKIM, and DMARC for maximum email deliverability.',
        tags: ['email', 'technical', 'deliverability'],
        timeToRead: '16 min',
        content: `
# Email Deliverability Mastery

Critical setup to ensure your emails reach the inbox, not spam.

## Why Deliverability Matters
- Without proper setup, emails go to spam
- Damages your sender reputation
- Wastes marketing efforts
- Loses revenue opportunities

## The Three Critical Records

### 1. SPF (Sender Policy Framework)
Tells email providers which servers can send email from your domain.

### 2. DKIM (DomainKeys Identified Mail)
Adds a digital signature to verify emails are really from you.

### 3. DMARC (Domain-based Message Authentication)
Tells email providers what to do with emails that fail SPF/DKIM.

## DNS Configuration Steps
1. Log into your domain registrar
2. Find DNS settings
3. Add the records provided by GoHighLevel
4. Save changes
5. Wait for propagation (up to 48 hours)
6. Verify in GoHighLevel

## Best Practices
- Always use verified domain
- Warm up new domains gradually
- Monitor bounce rates
- Remove invalid emails promptly
- Avoid spam trigger words
- Include unsubscribe link
        `,
        relatedGuideIds: ['custom-domains', 'email-campaigns']
      }
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced Features',
    iconName: 'Zap',
    description: 'Power user features, custom code, and advanced configurations.',
    guides: [
      {
        id: 'custom-js-css',
        title: 'Custom Code: JavaScript & CSS',
        summary: 'Add custom JavaScript and CSS to funnels and forms.',
        tags: ['advanced', 'code', 'customization'],
        timeToRead: '18 min',
        content: `
# Custom Code Implementation

Extend functionality with custom JavaScript and CSS.

## When to Use Custom Code
- Unique tracking requirements
- Custom form validation
- Advanced styling beyond builder
- Third-party integrations
- Custom animations
- Dynamic content

## Adding Custom CSS
1. Open funnel/page in editor
2. Click Settings → Custom CSS
3. Write your CSS
4. Preview changes
5. Publish

## Adding Custom JavaScript
1. Open page editor
2. Go to Settings → Custom Code
3. Add to Header or Footer
4. Test thoroughly

## Security Considerations
- Never expose API keys in frontend code
- Validate user input
- Sanitize data before use
- Use HTTPS always
- Keep libraries up to date
        `,
        relatedGuideIds: ['funnel-builder', 'custom-domains']
      }
    ]
  }
];
