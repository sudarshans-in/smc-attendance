import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { sanitizeText } from '../../utils/sanitize';
import { Strings } from '../../constants/strings';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
  route: RouteProp<AuthStackParamList, 'Signup'>;
};

export default function SignupScreen({ navigation, route }: Props) {
  const { mobile } = route.params;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const isValid = name.trim().length >= 2 && address.trim().length >= 5;

  const handleRegister = async () => {
    if (!isValid) return;
    setError(''); setLoading(true);
    try {
      const user = await api.signupUser({ mobile, name: sanitizeText(name), address: sanitizeText(address) });
      await login(user);
    } catch { setError(Strings.errorGeneric); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Top brand section */}
          <View style={s.hero}>
            <View style={s.logoBadge}>
              <MaterialCommunityIcons name="account-plus-outline" size={32} color="#fff" />
            </View>
            <Text style={s.heroTitle}>Create Account</Text>
            <Text style={s.heroSub}>Register as SMC Karmachari</Text>
          </View>

          {/* White card */}
          <View style={s.card}>
            {/* Mobile badge */}
            <View style={s.mobileBadge}>
              <MaterialCommunityIcons name="phone-check-outline" size={15} color="#198754" />
              <Text style={s.mobileBadgeLabel}>Verified Mobile</Text>
              <Text style={s.mobileBadgeNumber}>{mobile}</Text>
            </View>

            {/* Name */}
            <View style={s.field}>
              <Text style={s.label}>{Strings.nameLabel}</Text>
              <View style={[s.inputWrap, s.inputNormal]}>
                <MaterialCommunityIcons name="account-outline" size={18} color="#94A3B8" style={{ marginLeft: 14 }} />
                <TextInput
                  style={s.input}
                  placeholder={Strings.namePlaceholder}
                  placeholderTextColor="#ADB5BD"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Address */}
            <View style={s.field}>
              <Text style={s.label}>{Strings.addressLabel}</Text>
              <View style={[s.inputWrap, s.inputNormal, s.inputMulti]}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#94A3B8" style={{ marginLeft: 14, marginTop: 1 }} />
                <TextInput
                  style={[s.input, { textAlignVertical: 'top' }]}
                  placeholder={Strings.addressPlaceholder}
                  placeholderTextColor="#ADB5BD"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                />
              </View>
            </View>

            {!!error && (
              <View style={s.errorRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#DC3545" />
                <Text style={s.errorMsg}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.btnPrimary, (!isValid || loading) && s.btnDisabled]}
              onPress={handleRegister}
              disabled={!isValid || loading}
              activeOpacity={0.88}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.btnText}>{Strings.registerButton}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} disabled={loading} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={14} color="#64748B" />
              <Text style={s.backText}>{Strings.alreadyRegistered}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ACCENT = '#2563EB';

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#0F172A' },
  scroll:          { flexGrow: 1 },
  hero:            { alignItems: 'center', paddingTop: 44, paddingBottom: 32, paddingHorizontal: 24 },
  logoBadge:       { width: 64, height: 64, borderRadius: 18, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 6 },
  heroTitle:       { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },
  heroSub:         { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  card:            { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48, gap: 16, flex: 1 },
  mobileBadge:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#DCFCE7', borderRadius: 10, padding: 12 },
  mobileBadgeLabel:{ flex: 1, fontSize: 12, color: '#166534' },
  mobileBadgeNumber:{ fontSize: 15, fontWeight: '700', color: '#166534' },
  field:           { gap: 7 },
  label:           { fontSize: 13, fontWeight: '600', color: '#374151' },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', minHeight: 52, borderRadius: 10, borderWidth: 1.5, backgroundColor: '#F8FAFC', gap: 10 },
  inputNormal:     { borderColor: '#E2E8F0' },
  inputMulti:      { alignItems: 'flex-start', paddingTop: 14, paddingBottom: 8 },
  input:           { flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 0, paddingRight: 14 },
  errorRow:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  errorMsg:        { fontSize: 12, color: '#DC3545' },
  btnPrimary:      { height: 52, backgroundColor: ACCENT, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnDisabled:     { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
  btnText:         { fontSize: 16, fontWeight: '700', color: '#fff' },
  backBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 40 },
  backText:        { fontSize: 14, color: '#64748B' },
});
