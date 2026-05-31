// Government Civic Design System
// Primary: Deep civic blue (aligned with Indian government apps — NIC, DigiLocker, Aarogya Setu)
// Success: Green retained for attendance states (universally understood)

export const light = {
  // ── Backgrounds ───────────────────────────────────────────────────────────
  bg:               '#F1F5F9',   // light blue-grey — official, not stark white
  surface:          '#FFFFFF',
  surfaceVar:       '#F8FAFC',
  headerBg:         '#1A3C6E',   // deep civic blue navbar
  headerBorder:     '#0F2A4A',

  // ── Brand ─────────────────────────────────────────────────────────────────
  primary:          '#1A3C6E',   // civic blue
  primaryDark:      '#0F2A4A',
  primaryLight:     '#2563EB',
  onPrimary:        '#FFFFFF',
  accent:           '#2563EB',   // interactive blue (buttons, links)

  // ── Text ──────────────────────────────────────────────────────────────────
  text:             '#0F172A',
  textSub:          '#475569',
  textMuted:        '#94A3B8',
  onHeader:         '#FFFFFF',   // text on dark blue header
  onHeaderSub:      '#BFD3F0',   // subdued text on dark header

  // ── Borders & Dividers ────────────────────────────────────────────────────
  border:           '#E2E8F0',
  divider:          '#F1F5F9',

  // ── Semantic ──────────────────────────────────────────────────────────────
  success:          '#198754',
  successBg:        '#D1E7DD',
  successText:      '#0F5132',
  warning:          '#92400E',
  warningBg:        '#FEF3C7',
  warningText:      '#92400E',
  error:            '#991B1B',
  errorColor:       '#DC2626',
  errorBg:          '#FEE2E2',
  info:             '#1E40AF',
  infoBg:           '#DBEAFE',
  infoColor:        '#2563EB',

  // ── Misc ──────────────────────────────────────────────────────────────────
  checkout:         '#EA580C',
  snackbar:         '#1E293B',
};

export const dark = {
  // ── Backgrounds ───────────────────────────────────────────────────────────
  bg:               '#0D1117',
  surface:          '#161B22',
  surfaceVar:       '#21262D',
  headerBg:         '#0F2A4A',   // deep navy in dark mode
  headerBorder:     '#1A3C6E',

  // ── Brand ─────────────────────────────────────────────────────────────────
  primary:          '#3B82F6',   // brighter blue for dark mode readability
  primaryDark:      '#1D4ED8',
  primaryLight:     '#60A5FA',
  onPrimary:        '#FFFFFF',
  accent:           '#60A5FA',

  // ── Text ──────────────────────────────────────────────────────────────────
  text:             '#E6EDF3',
  textSub:          '#7D8590',
  textMuted:        '#484F58',
  onHeader:         '#FFFFFF',
  onHeaderSub:      '#93C5FD',

  // ── Borders & Dividers ────────────────────────────────────────────────────
  border:           '#30363D',
  divider:          '#21262D',

  // ── Semantic ──────────────────────────────────────────────────────────────
  success:          '#3FB950',
  successBg:        'rgba(63,185,80,0.12)',
  successText:      '#3FB950',
  warning:          '#D29922',
  warningBg:        'rgba(210,153,34,0.12)',
  warningText:      '#D29922',
  error:            '#F85149',
  errorColor:       '#F85149',
  errorBg:          'rgba(248,81,73,0.12)',
  info:             '#58A6FF',
  infoBg:           'rgba(88,166,255,0.12)',
  infoColor:        '#58A6FF',

  // ── Misc ──────────────────────────────────────────────────────────────────
  checkout:         '#FF7B54',
  snackbar:         '#21262D',
};

export type Theme = typeof light;

export function getTheme(isDark: boolean): Theme {
  return isDark ? dark : light;
}

// ── Typography scale — field worker optimised ──────────────────────────────
// Minimum 17sp body — readable outdoors, in sunlight, with gloves
export const typography = {
  display: { fontSize: 24, fontWeight: '800' as const },  // hero titles
  heading: { fontSize: 20, fontWeight: '700' as const },  // section headers
  body:    { fontSize: 17, fontWeight: '400' as const },  // all body text
  label:   { fontSize: 15, fontWeight: '600' as const },  // form labels, buttons
  caption: { fontSize: 13, fontWeight: '400' as const },  // helper text, timestamps
};

// ── Spacing scale — 8pt grid ───────────────────────────────────────────────
export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};
