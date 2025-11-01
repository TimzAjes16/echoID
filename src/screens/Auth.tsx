import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {signUp, login, isUsernameAvailable, recoverUsername} from '../lib/auth';
import {colors, spacing, typography, borderRadius, shadows} from '../lib/design';

interface AuthProps {
  onAuthComplete: (username: string, walletAddress: string) => void;
}

export const Auth: React.FC<AuthProps> = ({onAuthComplete}) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [isForgotUsername, setIsForgotUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const insets = useSafeAreaInsets();

  // Check username availability on input change (for signup)
  const handleUsernameChange = async (text: string) => {
    setUsername(text);
    if (isSignUp && text.trim().length >= 3) {
      setCheckingUsername(true);
      setUsernameAvailable(null);
      try {
        const result = await isUsernameAvailable(text.trim());
        setUsernameAvailable(result.available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }
  };

  const handleRecoverUsername = async () => {
    if (!recoveryEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const recoveredUsername = await recoverUsername(recoveryEmail.trim());
      if (recoveredUsername) {
        Alert.alert(
          'Username Found',
          `Your username is: @${recoveredUsername}\n\nYou can now sign in with this username.`,
          [
            {
              text: 'Sign In',
              onPress: () => {
                setIsForgotUsername(false);
                setIsSignUp(false);
                setUsername(recoveredUsername);
              },
            },
            {text: 'OK'},
          ],
        );
      } else {
        Alert.alert('Not Found', 'No account found with this email address.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to recover username');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isForgotUsername) {
      await handleRecoverUsername();
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
      Alert.alert('Error', 'Username can only contain letters, numbers, dots, underscores, and hyphens');
      return;
    }

    // For signup, check username is available
    if (isSignUp && usernameAvailable === false) {
      Alert.alert('Username Taken', 'This username is already taken. Please choose another.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign up: create new account
        const result = await signUp(username.trim(), email.trim() || undefined);
        
        // Show mnemonic warning if present
        if (result.mnemonic) {
          Alert.alert(
            'Wallet Created',
            `Your wallet has been created!\n\n⚠️ IMPORTANT: Save your recovery phrase in a safe place.\n\nYou'll see it in the next step.`,
            [
              {
                text: 'Continue',
                onPress: () => {
                  onAuthComplete(result.username, result.walletAddress);
                },
              },
            ],
          );
        } else {
          onAuthComplete(result.username, result.walletAddress);
        }
      } else {
        // Login: restore existing account (can use username or email)
        const user = await login(username.trim());
        if (user) {
          onAuthComplete(user.username, user.walletAddress);
        } else {
          Alert.alert('Error', 'Username or email not found. Please sign up first or check your credentials.');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error?.message || 'Authentication failed';
      Alert.alert(
        'Error',
        errorMessage,
        [
          {text: 'OK'},
          ...(errorMessage.includes('wallet') || errorMessage.includes('crypto')
            ? [
                {
                  text: 'Retry',
                  onPress: () => {
                    // Retry after a short delay
                    setTimeout(() => handleSubmit(), 500);
                  },
                },
              ]
            : []),
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {paddingTop: Math.max(insets.top, spacing.lg)}]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>EchoID</Text>
            <Text style={styles.tagline}>Secure consent management</Text>
          </View>

          {/* Forgot Username Flow */}
          {isForgotUsername && (
            <View style={styles.authCard}>
              <Text style={styles.title}>Recover Username</Text>
              <Text style={styles.subtitle}>
                Enter your email address to recover your username
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textSecondary}
                  value={recoveryEmail}
                  onChangeText={setRecoveryEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleRecoverUsername}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.submitButtonText}>Recover Username</Text>
                )}
              </TouchableOpacity>

              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  onPress={() => setIsForgotUsername(false)}
                  disabled={loading}
                  activeOpacity={0.7}>
                  <Text style={styles.toggleLink}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Regular Auth Flow */}
          {!isForgotUsername && (
            <View style={styles.authCard}>
              <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
              <Text style={styles.subtitle}>
                {isSignUp
                  ? "Choose a username and we'll create your wallet"
                  : 'Enter your username or email to continue'}
              </Text>

              {/* Username Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username {!isSignUp && 'or Email'}</Text>
                <TextInput
                  style={[
                    styles.input,
                    isSignUp && usernameAvailable === false && styles.inputError,
                    isSignUp && usernameAvailable === true && styles.inputSuccess,
                  ]}
                  placeholder={isSignUp ? "e.g., alex.wave" : "username or email"}
                  placeholderTextColor={colors.textSecondary}
                  value={username}
                  onChangeText={handleUsernameChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={isSignUp ? "username" : "email"}
                  keyboardType={isSignUp ? "default" : "email-address"}
                  editable={!loading}
                />
                {isSignUp && checkingUsername && (
                  <Text style={styles.checkingText}>Checking availability...</Text>
                )}
                {isSignUp && usernameAvailable === false && (
                  <Text style={styles.errorText}>❌ Username already taken</Text>
                )}
                {isSignUp && usernameAvailable === true && (
                  <Text style={styles.successText}>✅ Username available</Text>
                )}
                {isSignUp && !checkingUsername && usernameAvailable === null && username.trim().length >= 3 && (
                  <Text style={styles.inputHint}>
                    Letters, numbers, dots, underscores, and hyphens only
                  </Text>
                )}
              </View>

              {/* Email Input (for signup only, optional) */}
              {isSignUp && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Email <Text style={styles.optionalText}>(Optional - for account recovery)</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                  <Text style={styles.inputHint}>
                    Add email to recover your username if forgotten
                  </Text>
                </View>
              )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

              {/* Toggle Sign Up/Login */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    setUsernameAvailable(null);
                  }}
                  disabled={loading}
                  activeOpacity={0.7}>
                  <Text style={styles.toggleLink}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Forgot Username Link (Login only) */}
              {!isSignUp && (
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    onPress={() => setIsForgotUsername(true)}
                    disabled={loading}
                    activeOpacity={0.7}>
                    <Text style={styles.forgotLink}>Forgot Username?</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>What you'll get:</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🔐</Text>
              <Text style={styles.infoText}>Secure wallet address</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>✨</Text>
              <Text style={styles.infoText}>Unique username</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🛡️</Text>
              <Text style={styles.infoText}>Encrypted vault</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.body,
    fontSize: 17,
    color: colors.textSecondary,
  },
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        ...shadows.lg,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.caption,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    fontSize: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md + 4,
    backgroundColor: colors.background,
    color: colors.text,
    minHeight: 50,
  },
  inputHint: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  checkingText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  errorText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
  successText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.success,
    marginTop: spacing.xs,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  inputSuccess: {
    borderColor: colors.success,
    borderWidth: 1,
  },
  optionalText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  forgotLink: {
    ...typography.caption,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minHeight: 50,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        ...shadows.md,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  submitButtonText: {
    ...typography.bodyBold,
    fontSize: 17,
    fontWeight: '600',
    color: colors.surface,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  toggleText: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  toggleLink: {
    ...typography.bodyBold,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        ...shadows.sm,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoTitle: {
    ...typography.bodyBold,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoText: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
});

