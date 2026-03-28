import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { isValidMobile, sanitizeNumeric } from '../../utils/sanitize';
import { Strings } from '../../constants/strings';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const { login } = useAuth();

  const isValid = isValidMobile(mobile);

  const handleLogin = async () => {
    if (!isValid) {
      setSnackbar(Strings.mobileInvalid);
      return;
    }
    setLoading(true);
    try {
      const user = await api.loginUser(mobile);
      if (user) {
        await login(user);
      } else {
        navigation.navigate('Signup', { mobile });
      }
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
              {Strings.loginTitle}
            </Text>
            <Text variant="bodyMedium" style={styles.cardSubtitle}>
              {Strings.loginSubtitle}
            </Text>

            <TextInput
              label={Strings.mobileLabel}
              value={mobile}
              onChangeText={(t) => setMobile(sanitizeNumeric(t).slice(0, 10))}
              keyboardType="numeric"
              maxLength={10}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
              accessibilityLabel={Strings.mobileLabel}
              accessibilityHint="Enter your 10-digit mobile number"
              disabled={loading}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={!isValid || loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              accessibilityLabel={Strings.loginButton}
            >
              {Strings.loginButton}
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Signup', { mobile })}
              style={styles.secondaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              accessibilityLabel={Strings.goToSignup}
              disabled={loading}
            >
              {Strings.goToSignup}
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
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  button: {
    marginBottom: 12,
    borderRadius: 8,
  },
  secondaryButton: {
    borderRadius: 8,
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
