import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { sanitizeText } from '../../utils/sanitize';
import { Strings } from '../../constants/strings';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
  route: RouteProp<AuthStackParamList, 'Signup'>;
};

export default function SignupScreen({ navigation, route }: Props) {
  const { mobile } = route.params;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const { login } = useAuth();

  const isValid = name.trim().length >= 2 && address.trim().length >= 5;

  const handleRegister = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const user = await api.signupUser({
        mobile,
        name: sanitizeText(name),
        address: sanitizeText(address),
      });
      await login(user);
      setSnackbar(Strings.signupSuccess);
    } catch {
      setSnackbar(Strings.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.title}>
              {Strings.appName}
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {Strings.appSubtitle}
            </Text>
          </View>

          <View style={styles.card}>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {Strings.signupTitle}
            </Text>
            <Text variant="bodyMedium" style={styles.cardSubtitle}>
              {Strings.signupSubtitle}
            </Text>

            <View style={styles.mobileDisplay}>
              <Text variant="bodyMedium" style={styles.mobileLabel}>
                {Strings.mobileLabel}
              </Text>
              <Text variant="titleMedium" style={styles.mobileValue}>
                {mobile}
              </Text>
            </View>

            <TextInput
              label={Strings.nameLabel}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              accessibilityLabel={Strings.nameLabel}
              accessibilityHint="Enter your full name"
              disabled={loading}
              autoCapitalize="words"
            />

            <TextInput
              label={Strings.addressLabel}
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="map-marker" />}
              accessibilityLabel={Strings.addressLabel}
              accessibilityHint="Enter your home address"
              disabled={loading}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={!isValid || loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              accessibilityLabel={Strings.registerButton}
            >
              {Strings.registerButton}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              accessibilityLabel={Strings.alreadyRegistered}
              disabled={loading}
            >
              {Strings.alreadyRegistered}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbar('') }}
      >
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primaryDark },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  title: {
    color: Colors.onPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.primaryContainer,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    elevation: 4,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 4,
    color: Colors.onSurface,
  },
  cardSubtitle: {
    color: Colors.onSurfaceVariant,
    marginBottom: 20,
  },
  mobileDisplay: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  mobileLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  mobileValue: {
    color: Colors.onSurface,
    fontWeight: '600',
    fontSize: 18,
    marginTop: 2,
  },
  input: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  button: {
    marginBottom: 12,
    borderRadius: 8,
  },
  backButton: {
    marginTop: 4,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
