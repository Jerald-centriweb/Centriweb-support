# Master Knowledge Base - Spreadsheet Template

This is a CSV template. Import into Google Sheets for best results.

## Column Definitions

### Core Fields
- **ID**: Unique identifier (lowercase-with-hyphens, no spaces)
- **Title**: Display title for the article
- **Category**: Folder name where markdown file lives
- **Category Title**: Display name for the category
- **Summary**: 1-2 sentence description
- **Tags**: Comma-separated keywords (e.g., "crm, sales, beginner")
- **Time to Read**: Estimated reading time (e.g., "7 min")

### Media Fields
- **Has Images**: Yes/No - Does this article contain images?
- **Has GIFs**: Yes/No - Does this article contain animated GIFs?
- **Has Video**: Yes/No - Does this article have embedded video?
- **Video URL**: Full YouTube/Loom URL (if Has Video = Yes)

### Relationships
- **Related Articles**: Comma-separated article IDs (e.g., "guide-1, guide-2, guide-3")
- **Related Categories**: Other categories this relates to

### Organization
- **Priority**: High/Medium/Low - Editorial priority
- **Status**: Draft/Review/Complete - Current state
- **Featured**: Yes/No - Show in featured section?
- **Display Order**: Number for manual ordering (optional)

### File Management
- **File Path**: Relative path to markdown file (e.g., "articles/pipelines-crm/understanding-pipelines.md")
- **Last Updated**: Date in YYYY-MM-DD format
- **Author**: Who wrote this (optional)
- **Notes**: Internal notes, todos, etc.

---

## Example Rows

```csv
ID,Title,Category,Category Title,Summary,Tags,Time to Read,Has Images,Has GIFs,Has Video,Video URL,Related Articles,Priority,Status,File Path,Featured,Last Updated,Notes
understanding-pipelines,Understanding Pipelines,pipelines-crm,Pipelines & CRM,"Learn how to structure your sales process efficiently with pipelines","crm, sales, beginner",7 min,Yes,Yes,No,,creating-opportunities;pipeline-automation,High,Complete,articles/pipelines-crm/understanding-pipelines.md,Yes,2024-01-15,Needs review
creating-opportunities,Creating Opportunities,pipelines-crm,Pipelines & CRM,"Add deals to your pipeline and track them through to close","crm, opportunities, sales",6 min,Yes,No,No,,understanding-pipelines;contact-management,High,Complete,articles/pipelines-crm/creating-opportunities.md,No,2024-01-15,
workflow-builder,Workflow Builder Fundamentals,automation,Automation & Workflows,"Master the trigger-action logic of the automation engine","automation, workflows, beginner",15 min,Yes,Yes,Yes,https://youtube.com/watch?v=example,first-automation;advanced-conditions,High,Complete,articles/automation/workflow-builder.md,Yes,2024-01-14,
platform-overview,Platform Overview,getting-started,Getting Started,"A high-level tour of the dashboard and core features","basics, dashboard, beginner",5 min,Yes,No,No,,account-setup;quick-start,High,Complete,articles/getting-started/platform-overview.md,Yes,2024-01-10,
email-deliverability,Email Deliverability Setup,billing,Account & Billing,"Configure SPF DKIM and DMARC for maximum email deliverability","email, technical, setup",16 min,Yes,No,No,,custom-domains;email-campaigns,High,Review,articles/billing/email-deliverability.md,No,2024-01-12,Need to verify DNS instructions
```

---

## How to Use This Template

### Step 1: Create Google Sheet
1. Create new Google Sheet
2. Name it "Master Knowledge Base"
3. Copy the column headers from the CSV above
4. Set up data validation (see below)

### Step 2: Set Up Data Validation

**For "Has Images" column:**
- Data validation: List from range
- Options: Yes, No

**For "Has GIFs" column:**
- Data validation: List from range
- Options: Yes, No

**For "Has Video" column:**
- Data validation: List from range
- Options: Yes, No

**For "Priority" column:**
- Data validation: List from range
- Options: High, Medium, Low

**For "Status" column:**
- Data validation: List from range
- Options: Draft, Review, Complete, Archived

**For "Featured" column:**
- Data validation: List from range
- Options: Yes, No

### Step 3: Apply Conditional Formatting

**Status column:**
- Draft = Yellow background
- Review = Orange background
- Complete = Green background
- Archived = Gray background

**Priority column:**
- High = Red text
- Medium = Orange text
- Low = Gray text

**Featured column:**
- Yes = Star emoji ⭐

### Step 4: Add Filters
- Enable filter on all columns
- This lets you filter by category, status, priority, etc.

### Step 5: Create Views (Optional)
- **By Category**: Sort by Category Title
- **By Status**: Filter Status = Complete
- **Featured Only**: Filter Featured = Yes
- **Needs Review**: Filter Status = Review
- **Has Video**: Filter Has Video = Yes

---

## Tips for Maintaining the Spreadsheet

### Consistency Rules
1. **IDs**: Always lowercase with hyphens (no spaces)
2. **Categories**: Use folder name, not display name
3. **Tags**: Keep consistent (don't use "CRM" and "crm")
4. **Dates**: Always use YYYY-MM-DD format
5. **Related Articles**: Use semicolons to separate (not commas)

### Regular Maintenance
- Update "Last Updated" when you edit an article
- Change Status from "Review" to "Complete" when done
- Add new rows as you create new articles
- Keep Notes column updated with todos

### Bulk Operations
- Use filters to find all articles in a category
- Use find/replace to fix tag inconsistencies
- Export to CSV for backup regularly

---

## Categories to Create

Here are suggested categories (create folders for each):

1. `getting-started` - Getting Started
2. `contacts` - Contacts & CRM
3. `pipelines-crm` - Pipelines & CRM (changed to avoid confusion)
4. `conversations` - Conversations
5. `calendars` - Calendars & Scheduling
6. `websites` - Websites & Funnels
7. `automation` - Automation & Workflows
8. `ai-agents` - AI & Chatbots
9. `reporting` - Reporting & Analytics
10. `reputation` - Reputation Management
11. `integrations` - Integrations
12. `billing` - Account & Billing
13. `advanced` - Advanced Features

---

## Next Steps After Filling Out

Once you have 10-20 articles entered:
1. Export as CSV
2. Share with me (or upload)
3. I'll analyze relationships and suggest improvements
4. I'll import into the system with AI embeddings
5. You can continue adding more articles

The spreadsheet stays as your master reference and editing tool!
