# Admin UI Migration Audit

## Executive Summary

This audit identifies all UI components in the admin area that need migration to shadcn-vue. The admin area consists of 9 pages plus 1 layout and 1 shared component.

**Total Pages to Migrate:** 9
**Total Components to Install:** 13 shadcn-vue components
**Toast Usage:** Only in `store-settings.vue` (migrate after all pages)

## Component Inventory

### 1. Buttons
**Usage:** Extensive across all pages
**Current Implementation:** Custom Tailwind classes
**Replacement:** shadcn-vue Button component
**Variants Needed:**
- Primary (brand): `bg-admin-brand-strong text-admin-text-inverse`
- Secondary: `bg-admin-surface-raised text-admin-text-primary`
- Danger: `bg-admin-state-danger-text text-admin-text-inverse`
- Ghost: `bg-transparent hover:bg-admin-surface-hover`
- Icon buttons (mobile menu, close buttons)

**Locations:**
- `layouts/admin.vue`: Mobile menu toggle, close buttons
- `pages/admin/[tenant]/index.vue`: Logout button
- `pages/admin/[tenant]/products/index.vue`: Add Product, Sync Products, menu actions
- `pages/admin/[tenant]/products/add.vue`: Cancel, Create Product
- `pages/admin/[tenant]/products/edit/[mtProductId].vue`: Cancel, Save Changes, image actions
- `pages/admin/[tenant]/products/variants/edit/[productId]/[variantId].vue`: Cancel, Save
- `pages/admin/[tenant]/store-settings.vue`: Save Brand Settings, Add Banner, Edit, Delete, Cancel, Create/Update
- `pages/admin/[tenant]/account.vue`: Try Again (error state)

### 2. Input Fields
**Usage:** Forms across multiple pages
**Current Implementation:** Native HTML inputs with Tailwind classes
**Replacement:** shadcn-vue Input component
**Types:**
- Text inputs (product name, description, collection ID, product class)
- Number inputs (collection ID, sort order)
- Color inputs (brand colors - keep native, style with tokens)
- DateTime-local inputs (expiration date)
- File inputs (image uploads - keep custom implementation)

**Locations:**
- `pages/admin/[tenant]/store-settings.vue`: Color pickers, text inputs, number inputs, datetime-local
- `pages/admin/[tenant]/products/add.vue`: Disabled product name (read-only)
- `pages/admin/[tenant]/products/edit/[mtProductId].vue`: Product name, description
- `pages/admin/[tenant]/products/variants/edit/[productId]/[variantId].vue`: Variant fields
- `pages/admin/[tenant]/products/index.vue`: Search input in modal

### 3. Textarea
**Usage:** Description fields
**Current Implementation:** Native HTML textarea
**Replacement:** shadcn-vue Textarea component
**Locations:**
- `pages/admin/[tenant]/products/add.vue`: Product description
- `pages/admin/[tenant]/products/edit/[mtProductId].vue`: Product description

### 4. Labels
**Usage:** Form labels
**Current Implementation:** Custom label elements
**Replacement:** shadcn-vue Label component
**Locations:**
- All form pages (products, store-settings, variants)

### 5. Modals/Dialogs
**Usage:** Create/Edit banners, Add products, Sync products, Delete confirmations
**Current Implementation:** Custom Teleport with Transition
**Replacement:** shadcn-vue Dialog component
**SSR Considerations:** Ensure Dialog Portal works in Nuxt 4 SPA mode

**Locations:**
- `pages/admin/[tenant]/store-settings.vue`: 
  - Create/Edit Banner modal
  - Delete Banner confirmation modal
- `pages/admin/[tenant]/products/index.vue`:
  - Add Product modal (MT product search)
  - Sync Products modal
  - Delete Product confirmation modal
- `pages/admin/[tenant]/products/add.vue`: None (full page form)
- `pages/admin/[tenant]/products/edit/[mtProductId].vue`: None (full page form)

### 6. Dropdown Menus
**Usage:** Product action menus
**Current Implementation:** Custom dropdown with click-outside handling
**Replacement:** shadcn-vue DropdownMenu component
**SSR Considerations:** Ensure DropdownMenu Portal works in Nuxt 4

**Locations:**
- `pages/admin/[tenant]/products/index.vue`: Product card three-dot menu
  - Edit on Mariana Tek
  - View on store
  - Enable/Disable
  - Delete from Sync

### 7. Badges
**Usage:** Status indicators
**Current Implementation:** Custom span elements with Tailwind classes
**Replacement:** shadcn-vue Badge component
**Variants Needed:**
- Success: `bg-admin-state-success-soft text-admin-state-success-text`
- Warning: `bg-admin-state-warning-soft text-admin-state-warning-text`
- Danger: `bg-admin-state-danger-soft text-admin-state-danger-text`
- Default: `bg-admin-surface-raised text-admin-text-secondary`

**Locations:**
- `pages/admin/[tenant]/products/index.vue`: Visible/Hidden status on product cards, "Added" badge in search modal
- `pages/admin/[tenant]/store-settings.vue`: Visible/Hidden, Expired badges on banner cards
- `pages/admin/[tenant]/account.vue`: Role badge

### 8. Alerts
**Usage:** Error messages, warnings
**Current Implementation:** Custom div elements with Tailwind classes
**Replacement:** shadcn-vue Alert component
**Variants Needed:**
- Error: `bg-admin-state-danger-soft border-admin-state-danger-border text-admin-state-danger-text`
- Warning: `bg-admin-state-warning-soft border-admin-state-warning-border text-admin-state-warning-text`
- Info: `bg-admin-state-info-soft border-admin-state-info-border text-admin-state-info-text`

**Locations:**
- `pages/admin/[tenant]/store-settings.vue`: Brand settings error, banner error, form error, warning in delete modal
- `pages/admin/[tenant]/products/index.vue`: Error state, sync results
- `pages/admin/[tenant]/products/add.vue`: Error state, form error
- `pages/admin/[tenant]/products/edit/[mtProductId].vue`: Error state, form error
- `pages/admin/[tenant]/products/variants/edit/[productId]/[variantId].vue`: Error state
- `pages/admin/[tenant]/account.vue`: Error state with retry button

### 9. Switches/Toggles
**Usage:** Visibility toggles
**Current Implementation:** Custom button-based toggle
**Replacement:** shadcn-vue Switch component
**Locations:**
- `pages/admin/[tenant]/store-settings.vue`: Banner visibility toggle in form

### 10. Checkboxes
**Usage:** Product selection in sync modal
**Current Implementation:** Native HTML checkboxes
**Replacement:** shadcn-vue Checkbox component
**Locations:**
- `pages/admin/[tenant]/products/index.vue`: Sync modal - Select All, individual product checkboxes

### 11. Cards
**Usage:** Content containers, product cards, banner cards
**Current Implementation:** Custom div elements with Tailwind classes
**Replacement:** Optional - shadcn-vue Card component (or keep custom structure)
**Decision:** Keep custom structure for product/banner cards, consider Card for content sections

**Locations:**
- `pages/admin/[tenant]/index.vue`: Quick action cards, stats cards
- `pages/admin/[tenant]/products/index.vue`: Product cards
- `pages/admin/[tenant]/store-settings.vue`: Brand settings section, banner cards
- `pages/admin/[tenant]/account.vue`: Tenant info section, session info section

### 12. Skeletons
**Usage:** Loading states
**Current Implementation:** Custom div elements with animate-pulse
**Replacement:** shadcn-vue Skeleton component
**Locations:**
- `pages/admin/[tenant]/store-settings.vue`: Brand settings skeleton, banners skeleton
- `pages/admin/[tenant]/products/index.vue`: Product grid skeleton
- `pages/admin/[tenant]/products/add.vue`: Form sections skeleton
- `pages/admin/[tenant]/products/edit/[mtProductId].vue`: Form sections skeleton
- `pages/admin/[tenant]/account.vue`: Tenant info skeleton, session info skeleton

### 13. Toast Notifications
**Usage:** Success/error feedback
**Current Implementation:** Custom Teleport with Transition (only in store-settings.vue)
**Replacement:** Sonner or shadcn-vue Toast (migrate AFTER all pages)
**Locations:**
- `pages/admin/[tenant]/store-settings.vue`: 
  - `showToast('success', 'Brand settings saved successfully')`
  - `showToast('success', 'Banner created successfully')`
  - `showToast('success', 'Banner updated successfully')`
  - `showToast('success', 'Banner deleted successfully')`
  - `showToast('error', ...)`

**Migration Strategy:**
- Keep current toast implementation during page migrations
- Migrate toast to Sonner after all pages are validated
- Replace `showToast()` calls with Sonner API
- Maintain same timing (3 seconds) and positioning (bottom-right)

## Page-by-Page Breakdown

### Layout: `apps/frontend/layouts/admin.vue`
**Components to Replace:**
- Mobile menu button → Button
- Close button (mobile) → Button
- Navigation links (keep custom, no change needed)

**Components to Keep:**
- Sidebar structure
- Navigation logic
- Mobile menu overlay/transition

### Component: `apps/frontend/components/admin/Breadcrumb.vue`
**Components to Replace:**
- None (enhance with shadcn primitives if beneficial)

**Components to Keep:**
- Breadcrumb generation logic
- Route state handling

### Page: `apps/frontend/pages/admin/[tenant]/index.vue`
**Components to Replace:**
- Logout button → Button
- Quick action cards (keep structure, style with tokens)

**Components to Keep:**
- Stats display
- Card grid structure

### Page: `apps/frontend/pages/admin/[tenant]/products/index.vue`
**Components to Replace:**
- Add Product button → Button
- Sync Products button → Button
- Product card menu button → Button
- Dropdown menu → DropdownMenu
- Status badges → Badge
- Error alert → Alert
- Empty state → Alert
- Loading skeletons → Skeleton
- Modal dialogs → Dialog (3 modals)
- Checkboxes → Checkbox
- Search input → Input

**Components to Keep:**
- Product card structure
- Image display
- Click handlers

### Page: `apps/frontend/pages/admin/[tenant]/products/add.vue`
**Components to Replace:**
- Form inputs → Input
- Textarea → Textarea
- Labels → Label
- Buttons → Button
- Error alert → Alert
- Loading skeletons → Skeleton

**Components to Keep:**
- File upload area (custom drag-and-drop)
- Image preview grid
- Form submission logic

### Page: `apps/frontend/pages/admin/[tenant]/products/edit/[mtProductId].vue`
**Components to Replace:**
- Form inputs → Input
- Textarea → Textarea
- Labels → Label
- Buttons → Button
- Error alert → Alert
- Loading skeletons → Skeleton

**Components to Keep:**
- File upload area
- Image management (existing + new)
- Variant expansion logic
- Form submission logic

### Page: `apps/frontend/pages/admin/[tenant]/products/variants/edit/[productId]/[variantId].vue`
**Components to Replace:**
- Form inputs → Input
- Labels → Label
- Buttons → Button
- Error alert → Alert
- Loading skeletons → Skeleton

**Components to Keep:**
- File upload area
- Variant-specific logic

### Page: `apps/frontend/pages/admin/[tenant]/store-settings.vue`
**Components to Replace:**
- Text inputs → Input
- Number inputs → Input
- DateTime-local inputs → Input
- Color inputs (keep native, style with tokens)
- Switch → Switch
- Buttons → Button
- Badges → Badge
- Alerts → Alert
- Modals → Dialog (2 modals)
- Loading skeletons → Skeleton
- Toast → Sonner (AFTER all pages migrated)

**Components to Keep:**
- File upload drop zone
- Image preview
- Banner card structure
- Color preview section

### Page: `apps/frontend/pages/admin/[tenant]/account.vue`
**Components to Replace:**
- Error alert → Alert
- Loading skeletons → Skeleton
- Role badge → Badge
- Try Again button → Button

**Components to Keep:**
- Data display structure (dl/dt/dd)
- Account fetching logic

### Pages: Auth pages (out of scope)
- `pages/admin/[tenant]/auth/login.vue` - Minimal UI, keep as-is
- `pages/admin/[tenant]/auth/callback.vue` - Minimal UI, keep as-is

## SSR Safety Considerations

### Radix Components Requiring SSR Checks:
1. **Dialog** - Uses Portal, ensure client-only rendering
2. **DropdownMenu** - Uses Portal, ensure client-only rendering
3. **Toast/Sonner** - Uses Portal, ensure client-only rendering

### Nuxt 4 SPA Mode:
- Since `ssr: false` in `nuxt.config.ts`, all components render client-side
- However, ensure components don't access `window`/`document` during initialization
- Use `onMounted()` or `ClientOnly` wrapper if needed

### Teleport Behavior:
- Current implementation uses `<Teleport to="body">`
- shadcn-vue Dialog/DropdownMenu use Radix Portal
- Verify Portal behavior matches current Teleport behavior

## Migration Order

### Phase 1: Foundation (Low Risk)
1. Install shadcn-vue and dependencies
2. Configure Tailwind (no CSS variables)
3. Install Button, Badge, Alert, Skeleton

### Phase 2: Form Components (Medium Risk)
4. Install Input, Textarea, Label
5. Migrate form pages (add, edit, variants)

### Phase 3: Interactive Components (Higher Risk)
6. Install Dialog, DropdownMenu, Switch, Checkbox
7. Migrate products/index.vue (most complex)
8. Migrate store-settings.vue (modals + switch)

### Phase 4: Remaining Pages (Low Risk)
9. Migrate dashboard, account pages
10. Enhance layout and breadcrumb

### Phase 5: Toast Migration (After Validation)
11. Install Sonner
12. Replace toast in store-settings.vue
13. Verify all toast triggers work correctly

## Risk Assessment

### Low Risk:
- Button, Badge, Alert, Skeleton, Input, Textarea, Label
- Dashboard, Account pages
- Layout enhancements

### Medium Risk:
- Dialog (modal behavior, focus management)
- DropdownMenu (click-outside, positioning)
- Form pages (validation, submission)

### High Risk:
- Products index page (complex interactions, multiple modals)
- Store settings page (file uploads, modals, switch)

## Testing Checklist

### Functional:
- [ ] All buttons trigger correct actions
- [ ] All forms submit correctly
- [ ] All modals open/close properly
- [ ] Dropdowns open/close and handle click-outside
- [ ] Switches toggle correctly
- [ ] Checkboxes select/deselect
- [ ] Navigation works correctly
- [ ] API calls unchanged
- [ ] State management (Pinia) unchanged

### Visual:
- [ ] Admin tokens applied correctly
- [ ] Hover states work
- [ ] Focus states visible
- [ ] Disabled states correct
- [ ] Loading states display
- [ ] Empty states display
- [ ] Error states display
- [ ] Responsive behavior (mobile/desktop)

### Accessibility:
- [ ] Keyboard navigation works
- [ ] Focus management in modals
- [ ] ARIA attributes correct
- [ ] Screen reader compatible

### SSR/Client:
- [ ] No SSR errors
- [ ] Portals render correctly
- [ ] No window/document access during init
- [ ] Client-only components work

## Notes

- **No CSS Variables:** All components use admin tokens directly in className
- **Toast Migration:** Deferred until after all pages validated
- **Custom Components:** File uploads, image previews, card structures remain custom
- **SSR Safety:** Verify all Radix Portal components work in Nuxt 4 SPA mode

