# WCPOS Documentation - Agent Guidelines

This file contains important information for AI agents working on WCPOS documentation.

## Docusaurus Link Structure

### Category Links vs Document Links

**IMPORTANT:** Docusaurus generates different URL structures for categories vs documents:

**Category Links (with generated-index):**
- Sidebar config: `"type": "category"` with `"link": {"type": "generated-index"}`
- URL: `/category/[category-name]` (e.g., `/category/troubleshooting`)
- Purpose: Auto-generated index page listing all items in the category

**Document Links:**
- Sidebar config: Individual document references
- URL: `/[section]/[subsection]/[document]` (e.g., `/support/troubleshooting/critical-error`)
- Purpose: Direct link to specific documentation page

**Example from current sidebar:**
```json
{
  "type": "category",
  "label": "Troubleshooting",
  "link": {"type": "generated-index"},  // Creates /category/troubleshooting
  "items": [
    "support/troubleshooting/critical-error",     // Creates /support/troubleshooting/critical-error
    "support/troubleshooting/response-error",     // Creates /support/troubleshooting/response-error
    "support/troubleshooting/plugin-conflicts"    // Creates /support/troubleshooting/plugin-conflicts
  ]
}
```

**When linking to troubleshooting in documentation:**
- ✅ Correct: `[Troubleshooting](/category/troubleshooting)` - Links to category index
- ❌ Wrong: `[Troubleshooting](/support/troubleshooting)` - This URL doesn't exist

## Spelling and Language

**IMPORTANT:** Use **British English spelling** throughout all WCPOS documentation.

### Common British vs American Spelling Differences:
- ✅ optimise (not optimize)
- ✅ colour (not color)
- ✅ centre (not center)
- ✅ licence (noun) / license (verb)
- ✅ behaviour (not behavior)
- ✅ realise (not realize)
- ✅ analyse (not analyze)
- ✅ organisation (not organization)

### Technical Terms:
- Keep technical terms in their standard form (e.g., "server", "database", "plugin")
- Use British spelling for general language around technical terms

## WCPOS-Specific Guidelines

### Performance Documentation:
- Always emphasize **execution times over server load values** for performance assessment
- **WooCommerce HPOS** should be highlighted as the primary performance improvement
- Only include universally acknowledged WordPress best practices
- Link to official WooCommerce documentation for HPOS

### Troubleshooting Documentation:
- Always emphasize using **staging sites** for testing
- Follow systematic plugin elimination methodology
- Cross-reference with existing error codes and logs documentation

### Links and Cross-References:
- Use relative links within the documentation (e.g., `/support/logs`)
- Always verify link targets exist before committing
- Use category links (`/category/[name]`) for generated index pages
- Use document links (`/section/document`) for specific pages

## Repository Structure

```
versioned_docs/version-1.x/
├── support/
│   ├── logs.mdx
│   ├── performance/
│   │   ├── index.mdx
│   │   ├── checkout.mdx
│   │   └── server.mdx
│   └── troubleshooting/
│       ├── critical-error.mdx
│       ├── response-error.mdx
│       └── plugin-conflicts.mdx
└── [other sections...]
```

## Common Mistakes to Avoid

1. **Don't assume URL structure** - Check the sidebar configuration to understand how Docusaurus generates URLs
2. **Don't use American spelling** - Always use British English
3. **Don't include unverified database advice** - Stick to universally acknowledged WordPress best practices
4. **Don't misinterpret server load values** - High load doesn't always mean poor performance
5. **Don't forget to update sidebar navigation** when adding new documents