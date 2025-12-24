# Admin UI Migration Proposal

## Overview

This proposal outlines the migration strategy from custom HTML + Tailwind UI to shadcn-vue components for the admin area. The migration will improve consistency and maintainability while preserving all existing functionality.

## Components to Replace

### ✅ Direct Replacements (1:1 mapping)

1. **Button** → shadcn-vue Button
   - All button instances across 9 pages + layout
   - Variants: default (brand), secondary, danger, ghost
   - Preserve all click handlers and disabled states

2. **Input** → shadcn-vue Input
   - Text, number, datetime-local inputs
   - Color inputs: keep native, style with admin tokens
   - File inputs: keep custom implementation

3. **Textarea** → shadcn-vue Textarea
   - Product description fields (2 pages)

4. **Label** → shadcn-vue Label
   - All form labels

5. **Badge** → shadcn-vue Badge
   - Status indicators (Visible/Hidden, Expired, Added, Role)
   - Variants: success, warning, danger, default

6. **Alert** → shadcn-vue Alert
   - Error messages, warnings, info messages
   - Variants: error, warning, info

7. **Skeleton** → shadcn-vue Skeleton
   - All loading states (5 pages)

8. **Switch** → shadcn-vue Switch
   - Banner visibility toggle (1 instance)

9. **Checkbox** → shadcn-vue Checkbox
   - Product selection in sync modal

### 🔄 Interactive Components (require behavior verification)

10. **Dialog** → shadcn-vue Dialog
    - Replace 5 custom modals:
      - Create/Edit Banner (store-settings)
      - Delete Banner (store-settings)
      - Add Product search (products/index)
      - Sync Products (products/index)
      - Delete Product (products/index)
    - **Edge Case:** Verify focus management and portal behavior in Nuxt 4 SPA
    - **Edge Case:** Ensure backdrop click-to-close works identically

11. **DropdownMenu** → shadcn-vue DropdownMenu
    - Product card three-dot menu (products/index)
    - **Edge Case:** Verify click-outside behavior matches current implementation
    - **Edge Case:** Ensure menu closes on item click

### ⏳ Deferred Migration

12. **Toast** → Sonner (after all pages validated)
    - Only used in `store-settings.vue`
    - Replace `showToast()` calls with Sonner API
    - Maintain 3-second timeout and bottom-right positioning
    - **Edge Case:** Ensure SSR-safe (Sonner handles this)

## Components to Rebuild Using shadcn Primitives

### Custom Toggle (store-settings.vue)
- **Current:** Custom button-based toggle for banner visibility
- **Replace with:** shadcn-vue Switch
- **Risk:** Low - straightforward replacement

### Custom Dropdown (products/index.vue)
- **Current:** Custom dropdown with manual click-outside handling
- **Replace with:** shadcn-vue DropdownMenu
- **Risk:** Medium - verify positioning and click-outside behavior

## Components to Remain Custom

### File Upload Areas
- **Why:** Custom drag-and-drop implementation with preview
- **Action:** Keep custom, style with admin tokens
- **Locations:**
  - Product images (add, edit, variant edit)
  - Banner images (store-settings)

### Image Preview Grids
- **Why:** Custom layout with featured image selection
- **Action:** Keep custom structure, use admin tokens
- **Locations:** All product/banner image sections

### Product/Banner Cards
- **Why:** Custom card layouts with specific interactions
- **Action:** Keep structure, enhance with shadcn Badge/Button
- **Locations:**
  - Products grid
  - Banners grid
  - Dashboard quick actions

### Breadcrumb Component
- **Why:** Custom route state handling and dynamic generation
- **Action:** Keep logic, enhance styling with admin tokens
- **Location:** `components/admin/Breadcrumb.vue`

### Layout Sidebar
- **Why:** Custom navigation structure
- **Action:** Keep structure, use shadcn Button for interactive elements
- **Location:** `layouts/admin.vue`

### Color Inputs
- **Why:** Native color picker with custom styling
- **Action:** Keep native `<input type="color">`, style with admin tokens
- **Location:** store-settings.vue

## Edge Cases & Risks

### 1. SSR Safety for Radix Components
**Risk:** Dialog, DropdownMenu, Toast use Portals
**Mitigation:**
- Nuxt 4 SPA mode (`ssr: false`) means client-side only
- Verify no `window`/`document` access during component init
- Use `ClientOnly` wrapper if needed (unlikely in SPA mode)
- Test Portal behavior matches current Teleport behavior

### 2. Modal Focus Management
**Risk:** shadcn Dialog may handle focus differently than custom modals
**Mitigation:**
- Test focus trap behavior
- Verify focus returns to trigger on close
- Ensure keyboard navigation (Tab, Escape) works

### 3. Dropdown Click-Outside
**Risk:** Current implementation uses manual event listeners
**Mitigation:**
- Verify shadcn DropdownMenu handles click-outside correctly
- Test menu closes on item selection
- Ensure no conflicts with product card click handlers

### 4. Toast Migration Timing
**Risk:** Toast only in one page, but used frequently
**Mitigation:**
- Keep current toast during page migrations
- Migrate toast last, after all pages validated
- Replace `showToast()` calls with Sonner API
- Maintain same timing and positioning

### 5. Form Validation
**Risk:** Current forms may rely on native validation
**Mitigation:**
- Preserve all form validation logic
- Ensure shadcn Input/Textarea work with native validation
- Test form submission behavior unchanged

### 6. File Upload Integration
**Risk:** Custom file upload areas must work with shadcn-styled forms
**Mitigation:**
- Keep file upload areas custom
- Ensure styling consistency with shadcn components
- Test drag-and-drop behavior unchanged

### 7. Responsive Behavior
**Risk:** shadcn components may have different responsive breakpoints
**Mitigation:**
- Test all components on mobile/tablet/desktop
- Verify modals work correctly on mobile
- Ensure dropdowns position correctly on all screen sizes

### 8. Admin Token Integration
**Risk:** Components must use admin tokens, not CSS variables
**Mitigation:**
- Customize all shadcn components to use admin tokens directly
- No CSS variable mapping
- Test all variants use correct admin colors

## Migration Sequence

### Phase 1: Foundation (Week 1)
1. Install shadcn-vue and dependencies
2. Configure Tailwind (no CSS variables)
3. Install and customize: Button, Badge, Alert, Skeleton
4. Migrate: Dashboard, Account pages

### Phase 2: Forms (Week 1-2)
5. Install: Input, Textarea, Label
6. Migrate: Products add, Products edit, Variants edit

### Phase 3: Interactive (Week 2)
7. Install: Dialog, DropdownMenu, Switch, Checkbox
8. Migrate: Products index (most complex)
9. Migrate: Store settings (modals + switch)

### Phase 4: Polish (Week 2)
10. Enhance: Layout, Breadcrumb
11. Final testing and validation

### Phase 5: Toast (After Validation)
12. Install Sonner
13. Replace toast in store-settings.vue
14. Final toast testing

## Success Criteria

### Functional
- ✅ All buttons trigger correct actions
- ✅ All forms submit correctly
- ✅ All modals open/close properly
- ✅ Dropdowns function correctly
- ✅ Switches toggle correctly
- ✅ Checkboxes work
- ✅ Navigation unchanged
- ✅ API calls unchanged
- ✅ State management (Pinia) unchanged

### Visual
- ✅ Admin tokens applied consistently
- ✅ Hover/focus/disabled states correct
- ✅ Loading/empty/error states display correctly
- ✅ Responsive behavior maintained

### Accessibility
- ✅ Keyboard navigation works
- ✅ Focus management correct
- ✅ ARIA attributes present
- ✅ Screen reader compatible

### Technical
- ✅ No SSR errors
- ✅ Portals work correctly
- ✅ No breaking changes to API contracts
- ✅ No route changes
- ✅ No Pinia store changes

## What Will NOT Change

- ❌ Pinia stores or composables
- ❌ API contracts or endpoints
- ❌ Route names or paths
- ❌ Auth/middleware logic
- ❌ Navigation structure
- ❌ File upload implementations
- ❌ Image preview logic
- ❌ Form validation logic
- ❌ Toast triggers or timing (until Phase 5)

## Estimated Impact

- **Files Modified:** ~10 files (9 pages + 1 layout)
- **Components Installed:** 12 shadcn-vue components
- **Lines Changed:** ~500-800 lines (mostly markup)
- **Risk Level:** Medium (well-scoped, incremental migration)
- **Breaking Changes:** None (preserve all functionality)

## Next Steps

1. ✅ Audit complete
2. ✅ Proposal complete
3. ⏭️ Await approval to proceed with migration
4. 📦 Install shadcn-vue and dependencies
5. 🔧 Configure Tailwind
6. 🧩 Install and customize components
7. 📄 Migrate pages incrementally
8. ✅ Test and validate
9. 🎉 Toast migration (final step)

