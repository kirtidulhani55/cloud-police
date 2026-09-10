# Cloud Police Theme Color Standard

Status: Current approved visual direction  
Scope: Marketing pages, authentication pages, console pages, dialogs and states  
Rule: This standard changes no functionality or layout. It defines how the existing colors must be used consistently.

## Brand rule

Teal is the Cloud Police brand and interactive color. Amber is reserved for warnings and pending states; it must not replace teal in navigation, primary actions, links or the light-theme hero. Red is reserved for destructive actions, failures and critical risk. Green is reserved for confirmed success and healthy status.

## Light theme

| Token | Color | Use |
|---|---:|---|
| Page background | `#FAF7F2` | Main application and marketing background |
| Card background | `#FFFFFF` | Cards, dialogs, dropdowns and elevated surfaces |
| Elevated/subtle background | `#FCFAF7` | Hover areas and secondary surfaces |
| Primary text | `#2B2417` | Headings, important values and primary labels |
| Secondary text | `#7B7468` | Descriptions, metadata and helper text |
| Border/divider | `#EAE6DD` | Card borders, separators and input borders |
| Primary teal | `#137D78` | Primary buttons, active navigation, links and focus states |
| Teal hover | `#0F6965` | Hover/pressed state for primary teal |
| Soft teal | `#ECF5F3` | Selected rows, icon backgrounds and informational badges |
| Success | `#2E8B75` | Healthy, approved and successful states |
| Warning | `#B8720A` | Pending, awaiting review and warning states |
| Warning background | `#FFF4DF` | Warning badges and notices |
| Critical | `#C8545E` | Errors, rejected, critical risk and destructive actions |

## Dark theme

| Token | Color | Use |
|---|---:|---|
| Page background | `#1A1A1A` | Main application and marketing background |
| Card background | `#232320` | Cards, dialogs, dropdowns and elevated surfaces |
| Elevated background | `#2B2B27` | Hover areas and nested surfaces |
| Primary text | `#F5F1E8` | Headings, important values and primary labels |
| Secondary text | `#A9A39A` | Descriptions, metadata and helper text |
| Border/divider | `#3A3832` | Card borders, separators and input borders |
| Primary teal | `#35B3AA` | Primary buttons, active navigation, links and focus states |
| Teal hover | `#48C7BD` | Hover/pressed state for primary teal |
| Soft teal | `#172321` | Selected rows, icon backgrounds and informational badges |
| Success | `#48B896` | Healthy, approved and successful states |
| Warning | `#F5A623` | Pending, awaiting review and warning states |
| Critical | `#DD6B73` | Errors, rejected, critical risk and destructive actions |

## Shared semantic rules

| UI meaning | Required color family |
|---|---|
| Brand, active navigation, links, primary action | Teal |
| Healthy, successful, approved | Green |
| Pending, evidence requested, awaiting review | Amber |
| Error, rejected, destructive, critical risk | Red |
| Cloud-provider links and neutral charts | Muted blue |
| Disabled controls | Secondary text with a low-contrast neutral surface |

## Component rules

1. Every page uses one page background and one card background from its active theme.
2. Headings and key values use primary text; descriptions and timestamps use secondary text.
3. Primary buttons and active navigation use teal in both themes.
4. Amber must never be used as the general brand or primary-action color.
5. Status colors must communicate the same meaning on every page.
6. Borders stay neutral; teal borders are used only for focus, selection or active state.
7. Body text must not use pure black or pure white.
8. New components must use named CSS variables instead of introducing new hexadecimal colors.
9. Status must never be communicated by color alone; pair color with text and, where useful, an icon.
10. Hover, focus, disabled and error states must remain visible in both themes.

## Canonical CSS variables

```css
:root {
  --cp-bg: #FAF7F2;
  --cp-surface: #FFFFFF;
  --cp-surface-raised: #FCFAF7;
  --cp-text: #2B2417;
  --cp-text-muted: #7B7468;
  --cp-border: #EAE6DD;
  --cp-primary: #137D78;
  --cp-primary-hover: #0F6965;
  --cp-primary-soft: #ECF5F3;
  --cp-success: #2E8B75;
  --cp-warning: #B8720A;
  --cp-warning-soft: #FFF4DF;
  --cp-danger: #C8545E;
}

.dark {
  --cp-bg: #1A1A1A;
  --cp-surface: #232320;
  --cp-surface-raised: #2B2B27;
  --cp-text: #F5F1E8;
  --cp-text-muted: #A9A39A;
  --cp-border: #3A3832;
  --cp-primary: #35B3AA;
  --cp-primary-hover: #48C7BD;
  --cp-primary-soft: #172321;
  --cp-success: #48B896;
  --cp-warning: #F5A623;
  --cp-warning-soft: rgba(245, 166, 35, 0.14);
  --cp-danger: #DD6B73;
}
```

## Review checklist

- Light-theme hero and primary actions remain teal.
- Dark background remains `#1A1A1A`; dark cards remain `#232320`.
- No page introduces a new brand color.
- Overview and detail pages use the same semantic status colors.
- Text remains readable without appearing pure white or pure black.
- Keyboard focus is clearly visible.
- Color is paired with a label or icon.
- No layout, API, data or role behavior changes during color cleanup.

## Current implementation note

The website already follows this visual direction, but many components still contain literal hexadecimal utility classes. Future consistency work should replace those repeated literals with the canonical variables gradually, with screenshot comparison and light/dark testing after each small patch. A bulk visual redesign is not approved by this standard.
