import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { api } from '../../api';
import { isValidMobile, sanitizeNumeric } from '../../utils/sanitize';
import { Strings } from '../../constants/strings';
import { getTheme, typography, spacing } from '../../constants/theme';

type Props = { navigation: any };

export default function LoginScreen({ navigation: _navigation }: Props) {
  const { isDark } = useThemeMode();
  const t = getTheme(isDark);

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const isMobileValid = isValidMobile(mobile);

  const handleSendOtp = async () => {
    if (!isMobileValid) { setError(Strings.mobileInvalid); return; }
    setError(''); setLoading(true);
    try {
      await api.sendOtp(mobile);
      setStep('otp');
    } catch { setError(Strings.errorGeneric); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setError(Strings.otpInvalid); return; }
    setError(''); setLoading(true);
    try {
      const user = await api.loginUser(mobile, otp.trim());
      if (user) await login(user);
      else setError('Mobile number not registered. Contact your supervisor to be added.');
    } catch (e: any) {
      setError(e?.message === 'INVALID_OTP' ? Strings.otpIncorrect : Strings.errorGeneric);
    }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.primaryDark }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero — government header */}
          <View style={s.hero}>
            <View style={[s.logoBadge, { backgroundColor: t.accent }]}>
              <MaterialCommunityIcons name="shield-check" size={36} color={t.onPrimary} />
            </View>
            <Text style={[s.heroTitle, { color: t.onPrimary }]}>SMC Karmachari</Text>
            <Text style={[s.heroSub, { color: t.onHeaderSub }]}>Silchar Municipal Corporation</Text>
            <View style={[s.heroBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <MaterialCommunityIcons name="lock-outline" size={11} color={t.onHeaderSub} />
              <Text style={[s.heroBadgeText, { color: t.onHeaderSub }]}>Secure Government Portal</Text>
            </View>
          </View>

          {/* Card */}
          <View style={[s.card, { backgroundColor: t.surface }]}>
            <Text style={[s.cardTitle, { color: t.text }]}>Welcome back</Text>
            <Text style={[s.cardSub, { color: t.textSub }]}>
              {step === 'mobile'
                ? 'Enter your registered mobile number to continue'
                : `OTP sent to +91 ${mobile}`}
            </Text>

            {/* Mobile field */}
            <View style={s.field}>
              <Text style={[s.label, { color: t.textSub }]}>Mobile Number</Text>
              <View style={[s.inputWrap, { borderColor: error && step === 'mobile' ? t.errorColor : t.border, backgroundColor: t.surfaceVar }]}>
                <Text style={[s.countryCode, { color: t.text }]}>+91</Text>
                <View style={[s.inputDivider, { backgroundColor: t.border }]} />
                <TextInput
                  style={[s.input, { color: t.text }]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={t.textMuted}
                  value={mobile}
                  onChangeText={(v) => { setError(''); setMobile(sanitizeNumeric(v).slice(0, 10)); }}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!loading && step === 'mobile'}
                />
                {mobile.length === 10 && (
                  <MaterialCommunityIcons name="check-circle" size={18} color={t.success} />
                )}
              </View>
              {step === 'otp' && (
                <TouchableOpacity onPress={() => { setStep('mobile'); setOtp(''); setError(''); }} disabled={loading}>
                  <Text style={[s.changeLink, { color: t.accent }]}>{Strings.changeMobile}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* OTP field */}
            {step === 'otp' && (
              <View style={s.field}>
                <Text style={[s.label, { color: t.textSub }]}>{Strings.otpLabel}</Text>
                <View style={[s.inputWrap, { borderColor: error ? t.errorColor : t.border, backgroundColor: t.surfaceVar }]}>
                  <MaterialCommunityIcons name="shield-key-outline" size={18} color={t.textMuted} style={{ marginLeft: spacing.md, marginRight: spacing.sm }} />
                  <TextInput
                    style={[s.input, { color: t.text }]}
                    placeholder={Strings.otpPlaceholder}
                    placeholderTextColor={t.textMuted}
                    value={otp}
                    onChangeText={(v) => { setError(''); setOtp(sanitizeNumeric(v)); }}
                    keyboardType="numeric"
                    maxLength={8}
                    editable={!loading}
                    autoFocus
                  />
                </View>
              </View>
            )}

            {!!error && (
              <View style={[s.errorRow, { backgroundColor: t.errorBg, borderColor: t.errorColor }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={14} color={t.errorColor} />
                <Text style={[s.errorMsg, { color: t.errorColor }]}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.btnPrimary, { backgroundColor: t.primary }, ((!isMobileValid && step === 'mobile') || loading) && s.btnDisabled]}
              onPress={step === 'mobile' ? handleSendOtp : handleVerifyOtp}
              disabled={(!isMobileValid && step === 'mobile') || loading}
              activeOpacity={0.88}
              accessibilityLabel={step === 'mobile' ? Strings.sendOtpButton : Strings.verifyOtpButton}
            >
              {loading
                ? <ActivityIndicator color={t.onPrimary} size="small" />
                : <Text style={[s.btnText, { color: t.onPrimary }]}>{step === 'mobile' ? Strings.sendOtpButton : Strings.verifyOtpButton}</Text>
              }
            </TouchableOpacity>

            {step === 'mobile' && (
              <View style={[s.infoRow, { backgroundColor: t.infoBg }]}>
                <MaterialCommunityIcons name="information-outline" size={14} color={t.infoColor} />
                <Text style={[s.infoText, { color: t.infoColor }]}>
                  Accounts are created by your supervisor. Contact the SMC office if you are not yet registered.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  scroll:        { flexGrow: 1 },

  // Hero
  hero:          { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  logoBadge:     { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, elevation: 8 },
  heroTitle:     { ...typography.display, letterSpacing: -0.5 },
  heroSub:       { ...typography.caption, marginTop: spacing.xs },
  heroBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { ...typography.caption },

  // Card
  card:          { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md, flex: 1 },
  cardTitle:     { ...typography.heading },
  cardSub:       { ...typography.body, marginTop: -spacing.sm },

  // Field
  field:         { gap: spacing.sm },
  label:         { ...typography.label },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 10, borderWidth: 1.5, paddingRight: spacing.sm },
  countryCode:   { ...typography.body, fontWeight: '600', paddingHorizontal: spacing.md },
  inputDivider:  { width: 1, height: 24, marginRight: spacing.sm },
  input:         { flex: 1, ...typography.body },
  changeLink:    { ...typography.caption, alignSelf: 'flex-end', marginTop: spacing.xs },
  errorRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: 8, borderWidth: 1 },
  errorMsg:      { ...typography.caption, flex: 1 },

  // Buttons
  btnPrimary:    { height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  btnDisabled:   { opacity: 0.45 },
  btnText:       { ...typography.label, letterSpacing: 0.5 },
  infoRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm, borderRadius: 8 },
  infoText:      { ...typography.caption, flex: 1, lineHeight: 18 },
});
