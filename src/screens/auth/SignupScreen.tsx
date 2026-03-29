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
import AppLogo from '../../components/AppLogo';

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
          <View style={s.hero}><AppLogo size="medium" /></View>

          <View style={s.card}>
            <Text style={s.cardTitle}>{Strings.signupTitle}</Text>
            <Text style={s.cardSub}>{Strings.signupSubtitle}</Text>

            {/* Mobile read-only */}
            <View style={s.mobileBox}>
              <MaterialCommunityIcons name="phone-check-outline" size={16} color="#198754" />
              <View>
                <Text style={s.mobileLabel}>{Strings.mobileLabel}</Text>
                <Text style={s.mobileValue}>{mobile}</Text>
              </View>
            </View>

            {/* Name */}
            <View style={s.field}>
              <Text style={s.label}>{Strings.nameLabel}</Text>
              <View style={[s.inputWrap, s.inputNormal]}>
                <MaterialCommunityIcons name="account-outline" size={18} color="#6C757D" />
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
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#6C757D" style={{ marginTop: 1 }} />
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

            {!!error && <Text style={s.errorMsg}>{error}</Text>}

            <TouchableOpacity
              style={[s.btnPrimary, (!isValid || loading) && s.btnMuted]}
              onPress={handleRegister}
              disabled={!isValid || loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                <>
                  <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  <Text style={s.btnPrimaryText}>{Strings.registerButton}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} disabled={loading} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={14} color="#198754" />
              <Text style={s.backText}>{Strings.alreadyRegistered}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#1B5E20' },
  scroll:       { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
  hero:         { alignItems: 'center', paddingTop: 28, paddingBottom: 20 },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  cardTitle:    { fontSize: 20, fontWeight: '700', color: '#212529' },
  cardSub:      { fontSize: 14, color: '#6C757D', marginTop: -6 },
  mobileBox:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#D1E7DD', borderRadius: 8, padding: 12 },
  mobileLabel:  { fontSize: 11, color: '#0F5132' },
  mobileValue:  { fontSize: 16, fontWeight: '700', color: '#0F5132' },
  field:        { gap: 6 },
  label:        { fontSize: 13, fontWeight: '600', color: '#495057' },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 12, gap: 8, borderWidth: 1.5, backgroundColor: '#fff' },
  inputNormal:  { borderColor: '#DEE2E6' },
  inputMulti:   { alignItems: 'flex-start', paddingTop: 12, minHeight: 88 },
  input:        { flex: 1, fontSize: 15, color: '#212529', paddingVertical: 12 },
  errorMsg:     { fontSize: 12, color: '#DC3545' },
  btnPrimary:   { height: 48, backgroundColor: '#198754', borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnMuted:     { backgroundColor: '#ADB5BD' },
  btnPrimaryText:{ fontSize: 15, fontWeight: '600', color: '#fff' },
  backBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 40 },
  backText:     { fontSize: 14, color: '#198754', fontWeight: '500' },
});
