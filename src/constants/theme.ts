// Bootstrap 5 inspired — light, clean, professional
export const light = {
  bg:               '#F8F9FA',
  surface:          '#FFFFFF',
  surfaceVar:       '#F8F9FA',
  headerBg:         '#FFFFFF',
  headerBorder:     '#E9ECEF',
  primary:          '#198754',   // Bootstrap success-green
  primaryDark:      '#146C43',
  primaryLight:     '#25A244',
  onPrimary:        '#FFFFFF',
  accent:           '#0D6EFD',   // Bootstrap blue for secondary actions
  text:             '#212529',
  textSub:          '#6C757D',
  textMuted:        '#ADB5BD',
  border:           '#DEE2E6',
  divider:          '#E9ECEF',
  success:          '#198754',
  successBg:        '#D1E7DD',
  successText:      '#0F5132',
  warning:          '#856404',
  warningBg:        '#FFF3CD',
  error:            '#842029',
  errorColor:       '#DC3545',
  errorBg:          '#F8D7DA',
  info:             '#055160',
  infoBg:           '#CFF4FC',
  infoColor:        '#0DCAF0',
  checkout:         '#FD7E14',
  snackbar:         '#343A40',
};

export const dark = {
  bg:               '#0D1117',
  surface:          '#161B22',
  surfaceVar:       '#21262D',
  headerBg:         '#161B22',
  headerBorder:     '#30363D',
  primary:          '#3FB950',
  primaryDark:      '#2EA043',
  primaryLight:     '#56D364',
  onPrimary:        '#0D1117',
  accent:           '#58A6FF',
  text:             '#E6EDF3',
  textSub:          '#7D8590',
  textMuted:        '#484F58',
  border:           '#30363D',
  divider:          '#21262D',
  success:          '#3FB950',
  successBg:        'rgba(63,185,80,0.12)',
  successText:      '#3FB950',
  warning:          '#D29922',
  warningBg:        'rgba(210,153,34,0.12)',
  error:            '#F85149',
  errorColor:       '#F85149',
  errorBg:          'rgba(248,81,73,0.12)',
  info:             '#58A6FF',
  infoBg:           'rgba(88,166,255,0.12)',
  infoColor:        '#58A6FF',
  checkout:         '#FF7B54',
  snackbar:         '#21262D',
};

export type Theme = typeof light;

export function getTheme(isDark: boolean): Theme {
  return isDark ? dark : light;
}
