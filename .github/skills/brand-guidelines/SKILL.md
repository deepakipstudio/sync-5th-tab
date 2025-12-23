# Brand Guidelines Skills

Admin interface color palette based on primary brand color `#8e213e`. White background with black text. For admin interface only, not frontend ecommerce.

## Primary Brand Color

**Main Color:** `#8e213e` (Deep Burgundy/Maroon)

Use for:
- Primary buttons
- Links
- Accent elements
- Brand highlights

## Color Palette

### Primary Colors

```css
--primary: #8e213e;        /* Main brand color */
--primary-light: #a83d5a;   /* Hover states */
--primary-dark: #6b1a2e;   /* Active/pressed states */
--primary-lighter: #c45a7a; /* Subtle accents */
```

### Secondary Colors

```css
--secondary: #4a5568;      /* Complementary gray */
--secondary-light: #718096; /* Lighter gray */
--secondary-dark: #2d3748;  /* Darker gray */
```

### Neutral Colors

```css
--white: #ffffff;          /* Background */
--black: #000000;          /* Primary text */
--gray-50: #f9fafb;       /* Light backgrounds */
--gray-100: #f3f4f6;      /* Borders */
--gray-200: #e5e7eb;      /* Dividers */
--gray-600: #4b5563;      /* Secondary text */
--gray-900: #111827;      /* Headings */
```

### Status Colors

```css
--success: #10b981;        /* Green */
--error: #ef4444;          /* Red */
--warning: #f59e0b;        /* Amber */
--info: #3b82f6;           /* Blue */
```

## Tailwind Configuration

**File:** `apps/frontend/tailwind.config.ts`

```typescript
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8e213e',
          light: '#a83d5a',
          dark: '#6b1a2e',
          lighter: '#c45a7a',
        },
        secondary: {
          DEFAULT: '#4a5568',
          light: '#718096',
          dark: '#2d3748',
        },
      },
    },
  },
}
```

## Usage Patterns

### Buttons

```html
<!-- Primary button -->
<button class="bg-primary text-white hover:bg-primary-light">
  Save
</button>

<!-- Secondary button -->
<button class="bg-gray-100 text-gray-900 hover:bg-gray-200">
  Cancel
</button>
```

### Links

```html
<a class="text-primary hover:text-primary-dark underline">
  View Details
</a>
```

### Text Hierarchy

```html
<h1 class="text-black">Main Heading</h1>
<p class="text-gray-600">Secondary text</p>
<p class="text-gray-900">Body text</p>
```

### Status Indicators

```html
<div class="text-success">Success message</div>
<div class="text-error">Error message</div>
<div class="text-warning">Warning message</div>
<div class="text-info">Info message</div>
```

## Background & Text

- **Background:** Always white (`#ffffff`)
- **Primary Text:** Black (`#000000`) or dark gray (`#111827`)
- **Secondary Text:** Medium gray (`#4b5563`)

## Scope

**Admin Interface Only:**
- `apps/frontend/pages/admin/`
- Admin layouts and components

**Not for:**
- Frontend ecommerce (`/shop/*` routes)
- Customer-facing pages

## File Locations

- Tailwind config: `apps/frontend/tailwind.config.ts`
- Admin pages: `apps/frontend/pages/admin/`
- Admin layout: `apps/frontend/layouts/admin.vue`

## Important Notes

- Primary color `#8e213e` for all brand elements
- White background, black text for readability
- Use status colors for feedback (success, error, warning, info)
- Admin interface only - separate brand for ecommerce
- Maintain contrast ratios for accessibility


