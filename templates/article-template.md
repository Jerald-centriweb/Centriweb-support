# Article Template - Copy This for Each New Guide

Copy this entire file and rename it to match your article's ID (e.g., `understanding-pipelines.md`)

---

## Front Matter (Metadata)
Copy the section between the `---` marks and update the values:

```markdown
---
id: your-article-id-here
title: Your Article Title Here
category: category-folder-name
summary: Write a 1-2 sentence summary of what this article covers
tags: [tag1, tag2, tag3, tag4]
timeToRead: X min
videoUrl: ""
relatedGuides: [related-article-id-1, related-article-id-2]
featured: false
lastUpdated: 2024-01-15
---
```

---

## Article Structure Template

Use this structure for consistency:

```markdown
# [Article Title]

[Opening paragraph explaining what the reader will learn]

## What is [Topic]?

[Explanation of the core concept]

![Overview Image](../../assets/category-name/overview.png)

## Why [Topic] Matters

[Explain the benefits/importance]

- Benefit 1
- Benefit 2
- Benefit 3

## How to [Main Action]

Follow these steps:

### Step 1: [First Action]

[Description of what to do]

![Step 1 Screenshot](../../assets/category-name/step1.png)

### Step 2: [Second Action]

[Description of what to do]

![Step 2 Animated](../../assets/category-name/step2.gif)

### Step 3: [Third Action]

[Description of what to do]

![Step 3 Screenshot](../../assets/category-name/step3.png)

💡 **Pro Tip:** [Add a helpful tip here]

## Common Use Cases

### Use Case 1: [Scenario Name]
[Description and example]

### Use Case 2: [Scenario Name]
[Description and example]

## Best Practices

✅ **DO:**
- Best practice 1
- Best practice 2
- Best practice 3

❌ **DON'T:**
- Common mistake 1
- Common mistake 2
- Common mistake 3

## Troubleshooting

**Problem:** [Common issue]
**Solution:** [How to fix it]

**Problem:** [Another common issue]
**Solution:** [How to fix it]

## Video Tutorial (Optional)

[If you added a videoUrl in front matter, mention it here]
Watch the complete video walkthrough above.

## What's Next?

Now that you've learned about [topic], check out these related guides:

- [Related Guide 1](../category/related-guide-1.md)
- [Related Guide 2](related-guide-2.md)
- [Related Guide 3](../another-category/related-guide-3.md)

---

**Questions?** Ask our AI Assistant or submit a support ticket!
```

---

## Tips for Writing Good Content

### Images
- Use descriptive alt text
- Compress images (aim for <500KB each)
- Use GIFs for multi-step processes
- Use static images for single screenshots
- Reference with relative paths: `../../assets/category/image.png`

### Formatting
- Use `**bold**` for UI elements users click
- Use `code blocks` for technical terms
- Use > blockquotes for important notes
- Use numbered lists for sequential steps
- Use bullet points for non-sequential lists

### Writing Style
- Write in second person ("you")
- Use active voice
- Keep sentences short and clear
- Use headings to break up content
- Add emoji sparingly (💡 for tips, ⚠️ for warnings)

### Length Guidelines
- Beginner guides: 5-10 min read
- Intermediate: 10-15 min read
- Advanced: 15-20 min read
- Quick tips: 2-3 min read

---

## Front Matter Field Explanations

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| `id` | Yes | lowercase-with-hyphens | `understanding-pipelines` |
| `title` | Yes | Title Case | `Understanding Pipelines` |
| `category` | Yes | folder-name | `pipelines-crm` |
| `summary` | Yes | 1-2 sentences | `Learn how to...` |
| `tags` | Yes | array of strings | `[crm, sales, beginner]` |
| `timeToRead` | Yes | X min | `7 min` |
| `videoUrl` | No | full URL | `https://youtube.com/...` |
| `relatedGuides` | No | array of IDs | `[guide-1, guide-2]` |
| `featured` | No | true/false | `false` |
| `lastUpdated` | Yes | YYYY-MM-DD | `2024-01-15` |

---

## Quick Checklist Before Submitting

- [ ] Front matter is complete and properly formatted
- [ ] All images are uploaded to correct assets folder
- [ ] All image paths are correct (test by previewing)
- [ ] Related guides are specified
- [ ] Tags are relevant and consistent
- [ ] Content follows the template structure
- [ ] Spelling and grammar checked
- [ ] Screenshots are clear and current
- [ ] Links to other guides work
- [ ] Added entry to master spreadsheet
