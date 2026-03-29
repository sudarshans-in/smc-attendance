import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { isValidMobile, sanitizeNumeric } from '../../utils/sanitize';
import { Strings } from '../../constants/strings';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const isValid = isValidMobile(mobile);

  const handleLogin = async () => {
    if (!isValid) { setError(Strings.mobileInvalid); return; }
    setError(''); setLoading(true);
    try {
      const user = await api.loginUser(mobile);
      if (user) await login(user);
      else navigation.navigate('Signup', { mobile });
    } catch { setError(Strings.errorGeneric); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Top brand section */}
          <View style={s.hero}>
            {/* Badge icon */}
            <View style={s.logoBadge}>
              <MaterialCommunityIcons name="map-marker-check" size={36} color="#fff" />
            </View>
            <Text style={s.heroTitle}>SMC Karmachari</Text>
            <Text style={s.heroSub}>Silchar Municipal Corporation</Text>
            <Text style={s.heroTagline}>Attendance & Work Tracking</Text>
          </View>

          {/* White card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Welcome back</Text>
            <Text style={s.cardSub}>Enter your registered mobile number to continue</Text>

            <View style={s.field}>
              <Text style={s.label}>Mobile Number</Text>
              <View style={[s.inputWrap, error ? s.inputError : s.inputNormal]}>
                <Text style={s.countryCode}>+91</Text>
                <View style={s.inputDivider} />
                <TextInput
                  style={s.input}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#ADB5BD"
                  value={mobile}
                  onChangeText={(v) => { setError(''); setMobile(sanitizeNumeric(v).slice(0, 10)); }}
                  keyboardType="numeric"
                  maxLength={10}
                  editable={!loading}
                />
                {mobile.length === 10 && (
                  <MaterialCommunityIcons name="check-circle" size={18} color="#198754" />
                )}
              </View>
              {!!error && (
                <View style={s.errorRow}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#DC3545" />
                  <Text style={s.errorMsg}>{error}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[s.btnPrimary, (!isValid || loading) && s.btnDisabled]}
              onPress={handleLogin}
              disabled={!isValid || loading}
              activeOpacity={0.88}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>{Strings.loginButton}</Text>
              }
            </TouchableOpacity>

            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>New to the app?</Text>
              <View style={s.orLine} />
            </View>

            <TouchableOpacity
              style={s.btnGhost}
              onPress={() => navigation.navigate('Signup', { mobile })}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={s.btnGhostText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ACCENT = '#2563EB';   // modern blue
const ACCENT_DARK = '#1D4ED8';

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0F172A' },   // slate-900
  scroll:        { flexGrow: 1 },

  // Hero
  hero:          { alignItems: 'center', paddingTop: 52, paddingBottom: 40, paddingHorizontal: 24 },
  logoBadge:     { width: 72, height: 72, borderRadius: 20, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  heroTitle:     { fontSize: 26, fontWeight: '800', color: '#F8FAFC', letterSpacing: -0.5 },
  heroSub:       { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  heroTagline:   { marginTop: 10, fontSize: 12, color: '#475569', backgroundColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },

  // Card
  card:          { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48, gap: 18, flex: 1 },
  cardTitle:     { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  cardSub:       { fontSize: 14, color: '#64748B', marginTop: -10 },

  // Field
  field:         { gap: 8 },
  label:         { fontSize: 13, fontWeight: '600', color: '#374151' },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 10, borderWidth: 1.5, backgroundColor: '#F8FAFC', paddingRight: 12 },
  inputNormal:   { borderColor: '#E2E8F0' },
  inputError:    { borderColor: '#EF4444' },
  countryCode:   { fontSize: 15, fontWeight: '600', color: '#374151', paddingHorizontal: 14 },
  inputDivider:  { width: 1, height: 24, backgroundColor: '#E2E8F0', marginRight: 12 },
  input:         { flex: 1, fontSize: 16, color: '#0F172A' },
  errorRow:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  errorMsg:      { fontSize: 12, color: '#DC3545' },

  // Buttons
  btnPrimary:    { height: 52, backgroundColor: ACCENT, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnDisabled:   { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
  btnText:       { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  orRow:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine:        { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText:        { fontSize: 13, color: '#94A3B8' },
  btnGhost:      { height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  btnGhostText:  { fontSize: 15, fontWeight: '600', color: '#374151' },
});
