import { GuideArea } from '../types';

export const GUIDE_DATA: GuideArea[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    iconName: 'Rocket',
    description: 'Everything you need to know to launch your CentriWeb account.',
    guides: [
      {
        id: 'platform-overview',
        title: 'Platform Overview',
        summary: 'A high-level tour of the CentriWeb dashboard and core features.',
        tags: ['basics', 'dashboard', 'navigation'],
        timeToRead: '5 min',
        content: `
# Welcome to CentriWeb

CentriWeb is your all-in-one growth engine. This guide will walk you through the main interface.

## The Dashboard
The dashboard is your mission control. Here you can see:
- **Opportunities:** Total value in your pipeline.
- **Conversion Rate:** How well you are closing.
- **Tasks:** What you need to do today.

## Navigation
The sidebar on the left gives you access to all tools. You can collapse it to save space on smaller screens.
        `
      },
      {
        id: 'account-setup',
        title: 'Account Setup Checklist',
        summary: 'Complete these 5 steps to activate your account fully.',
        tags: ['setup', 'billing', 'profile'],
        timeToRead: '10 min',
        content: `
# 5 Steps to Success

1. **Connect your Google Calendar** - Sync your appointments.
2. **Add a Payment Method** - Ensure your subscription is active.
3. **Verify your Email Domain** - Crucial for deliverability.
4. **Connect Social Accounts** - Facebook, Instagram, and LinkedIn.
5. **Download the Mobile App** - Manage leads on the go.
        `
      }
    ]
  },
  {
    id: 'opportunities',
    title: 'Opportunities & CRM',
    iconName: 'Kanban',
    description: 'Manage your pipelines, stages, and lead values.',
    guides: [
      {
        id: 'understanding-pipelines',
        title: 'Understanding Pipelines',
        summary: 'How to structure your sales process efficiently.',
        tags: ['crm', 'sales', 'pipelines'],
        timeToRead: '7 min',
        content: `
# Pipelines Explained

A pipeline represents a specific sales process. Most businesses have at least one, often called "Sales Pipeline".

## Stages
Stages are the steps a lead takes. Common stages:
- New Lead
- Hot Lead
- Booking Requested
- Booking Confirmed
- Sold
- Lost

## Moving Opportunities
You can drag and drop cards between stages, or use **Automations** to move them automatically based on triggers (like a booked appointment).
        `
      }
    ]
  },
  {
    id: 'automation',
    title: 'Automation',
    iconName: 'Workflow',
    description: 'Build powerful workflows to save time.',
    guides: [
      {
        id: 'workflow-builder',
        title: 'Workflow Builder Basics',
        summary: 'Learn the trigger-action logic of our automation engine.',
        tags: ['workflows', 'triggers', 'actions'],
        timeToRead: '15 min',
        content: `
# The Workflow Builder

Workflows replace campaigns and triggers. They are the brain of your operation.

## Triggers
What starts the automation?
- Form Submitted
- Tag Added
- Appointment Status Changed

## Actions
What happens next?
- Send SMS/Email
- Add Tag
- Create Opportunity
- Wait (Time Delay)
        `
      }
    ]
  }
];
