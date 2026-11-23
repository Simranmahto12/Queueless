import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useMobile } from '../context/MobileContext';

type AuthMode = 'sign_in' | 'register' | 'forgot_password';

export const AuthScreen: React.FC = () => {
  const { login, register, resetPassword, setCurrentScreen } = useMobile();

  const [mode, setMode] = useState<AuthMode>('sign_in');

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSignIn = async () => {
    if (!email.trim() || !validateEmail(email)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!displayName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-check.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await register({
        displayName: displayName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim() || !validateEmail(email)) {
      setError('Please enter the email address for password recovery.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await resetPassword(email.trim());
      setResetSuccess(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestVisitor = () => {
    setEmail('visitor.david@example.com');
    setPassword('VisitorPass123!');
    setError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => {
                if (mode === 'forgot_password') {
                  setMode('sign_in');
                  setError('');
                  setResetSuccess('');
                } else {
                  setCurrentScreen('onboarding');
                }
              }}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>Q</Text>
            </View>
          </View>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={styles.title}>
              {mode === 'sign_in'
                ? 'Welcome Back'
                : mode === 'register'
                ? 'Create Visitor Account'
                : 'Reset Password'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'sign_in'
                ? 'Sign in to access your digital queue tokens and schedule appointments'
                : mode === 'register'
                ? 'Register independently to request digital tokens and live arrival slots'
                : 'Enter your registered email to receive secure recovery instructions'}
            </Text>
          </View>

          {/* Mode Switcher (Sign In vs Register) */}
          {mode !== 'forgot_password' && (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => {
                  setMode('sign_in');
                  setError('');
                }}
                style={[styles.tabButton, mode === 'sign_in' && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, mode === 'sign_in' && styles.tabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMode('register');
                  setError('');
                }}
                style={[styles.tabButton, mode === 'register' && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Success Banner (for reset) */}
          {resetSuccess ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{resetSuccess}</Text>
              <TouchableOpacity
                onPress={() => {
                  setMode('sign_in');
                  setResetSuccess('');
                  setError('');
                }}
                style={styles.returnSignInBtn}
              >
                <Text style={styles.returnSignInText}>Return to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Form Fields */}
          {!resetSuccess && (
            <View style={styles.form}>
              {mode === 'register' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Jane Doe"
                      placeholderTextColor="#94A3B8"
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mobile Phone (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="+1 (555) 000-0000"
                      placeholderTextColor="#94A3B8"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@domain.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {mode !== 'forgot_password' && (
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    {mode === 'sign_in' && (
                      <TouchableOpacity
                        onPress={() => {
                          setMode('forgot_password');
                          setError('');
                        }}
                      >
                        <Text style={styles.forgotLink}>Forgot password?</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {mode === 'register' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                    />
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                activeOpacity={0.85}
                disabled={isLoading}
                onPress={() => {
                  if (mode === 'sign_in') handleSignIn();
                  else if (mode === 'register') handleRegister();
                  else handleResetPassword();
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {mode === 'sign_in'
                      ? 'Sign In'
                      : mode === 'register'
                      ? 'Create Visitor Account'
                      : 'Send Reset Instructions'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Evaluation / Dev Mode Helper */}
          {mode === 'sign_in' && (
            <View style={styles.devCard}>
              <Text style={styles.devCardTitle}>DEVELOPMENT EVALUATION</Text>
              <Text style={styles.devCardDesc}>
                Tap to autofill the pre-seeded public visitor test credentials:
              </Text>
              <TouchableOpacity onPress={fillTestVisitor} style={styles.devFillBtn}>
                <Text style={styles.devFillBtnText}>
                  Autofill Visitor: visitor.david@example.com
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backBtnText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#142B4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  headingBlock: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#142B4A',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC4C4C',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  successText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  returnSignInBtn: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
  },
  returnSignInText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#172033',
  },
  forgotLink: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: '#172033',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF1',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: '#172033',
  },
  eyeBtn: {
    paddingHorizontal: 14,
  },
  eyeText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#142B4A',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  devCard: {
    marginTop: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  devCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  devCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  devFillBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  devFillBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#142B4A',
  },
});
