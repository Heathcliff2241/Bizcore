# Full Width Sections

This document explains how storefront sections can opt into full-bleed (edge-to-edge) layouts and how to configure this in the Tenant settings.

## Behavior Summary
- PageRenderer no longer forcibly wraps *section* components in an `mx-auto max-w-7xl` container. Components themselves decide whether they are constrained or full-width.
- Sections such as `hero`, `image-block`, `divider`, and `spacer` default to **full-bleed** unless explicitly specified.
- Many section components accept a `fullWidth?: boolean` prop. When `fullWidth` is true, they won't apply a `max-w-7xl` wrapper and will allow content to expand to full width.
- Tenant-level default: If a tenant sets the `fullWidthSections` setting to `true` under `tenant.settings`, PageRenderer will default section components to full width when the component JSON doesn't provide an explicit `fullWidth`.

## How to Configure
- Per-component: In page content JSON, set `props.fullWidth: true` to make a specific component full-width.
- Per-tenant: Set `tenant.settings.fullWidthSections = true` to enable site-wide full-bleed sections (applies when a component doesn't set `props.fullWidth`).

## Examples
- Example component JSON to make a hero full width:
{
  "type": "hero",
  "props": {
    "heading": "Our Amazing Store",
    "fullWidth": true
  }
}

## Notes
- Existing components that used `max-w-7xl` still do that by default unless `fullWidth` is set to `true` or tenant setting toggles it.
- This change preserves other responsive behaviors (e.g., internal padding, `px-8`), but for true full-bleed visuals you might also set `fullWidth` on supporting child components such as `CTASection` or `TextBlock`.

## Next Steps
- If you want site default to be full-bleed for all sections, enable `tenant.settings.fullWidthSections = true`.
- If a component still looks constrained, open the component and add `fullWidth` and/or adjust internal `max-w-*` to `max-w-none` or remove it.

