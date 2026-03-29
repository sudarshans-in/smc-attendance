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
import AppLogo from '../../components/AppLogo';

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

          {/* Logo area */}
          <View style={s.hero}>
            <AppLogo size="large" />
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>{Strings.loginTitle}</Text>
            <Text style={s.cardSub}>{Strings.loginSubtitle}</Text>

            <View style={s.field}>
              <Text style={s.label}>{Strings.mobileLabel}</Text>
              <View style={[s.inputWrap, error ? s.inputError : s.inputNormal]}>
                <MaterialCommunityIcons name="phone-outline" size={18} color="#6C757D" />
                <TextInput
                  style={s.input}
                  placeholder={Strings.mobilePlaceholder}
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
              {!!error && <Text style={s.errorMsg}>{error}</Text>}
            </View>

            <TouchableOpacity
              style={[s.btnPrimary, (!isValid || loading) && s.btnMuted]}
              onPress={handleLogin}
              disabled={!isValid || loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <MaterialCommunityIcons name="login" size={16} color="#fff" />
                  <Text style={s.btnPrimaryText}>{Strings.loginButton}</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={s.orRow}>
              <View style={s.orLine} /><Text style={s.orText}>or</Text><View style={s.orLine} />
            </View>

            <TouchableOpacity
              style={s.btnOutline}
              onPress={() => navigation.navigate('Signup', { mobile })}
              disabled={loading}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="account-plus-outline" size={16} color="#198754" />
              <Text style={s.btnOutlineText}>{Strings.goToSignup}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#1B5E20' },
  scroll:        { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
  hero:          { alignItems: 'center', paddingTop: 40, paddingBottom: 28 },
  card:          { backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  cardTitle:     { fontSize: 20, fontWeight: '700', color: '#212529' },
  cardSub:       { fontSize: 14, color: '#6C757D', marginTop: -6 },
  field:         { gap: 6 },
  label:         { fontSize: 13, fontWeight: '600', color: '#495057' },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 8, paddingHorizontal: 12, gap: 8, borderWidth: 1.5, backgroundColor: '#fff' },
  inputNormal:   { borderColor: '#DEE2E6' },
  inputError:    { borderColor: '#DC3545' },
  input:         { flex: 1, fontSize: 16, color: '#212529' },
  errorMsg:      { fontSize: 12, color: '#DC3545' },
  btnPrimary:    { height: 48, backgroundColor: '#198754', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnMuted:      { backgroundColor: '#ADB5BD' },
  btnPrimaryText:{ fontSize: 15, fontWeight: '600', color: '#fff' },
  orRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orLine:        { flex: 1, height: 1, backgroundColor: '#DEE2E6' },
  orText:        { fontSize: 13, color: '#ADB5BD' },
  btnOutline:    { height: 48, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#198754' },
  btnOutlineText:{ fontSize: 15, fontWeight: '600', color: '#198754' },
});
