import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useMobile } from '../context/MobileContext';

export const OnboardingScreen: React.FC = () => {
  const { setCurrentScreen } = useMobile();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>Q</Text>
          </View>
          <Text style={styles.brandTitle}>QueueLess</Text>
          <Text style={styles.brandSubtitle}>Intelligent Queue & Flow Management</Text>
        </View>

        {/* Value Proposition Cards */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <View style={styles.bulletDot} />
            <View style={styles.benefitTextGroup}>
              <Text style={styles.benefitHeading}>Smart Arrival Windows</Text>
              <Text style={styles.benefitDescription}>
                Receive optimized arrival recommendations so you spend minutes—not hours—waiting in physical lobbies.
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.bulletDot} />
            <View style={styles.benefitTextGroup}>
              <Text style={styles.benefitHeading}>Live Queue Transparency</Text>
              <Text style={styles.benefitDescription}>
                Track real-time counter calls and current served tokens from anywhere before leaving home.
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={styles.bulletDot} />
            <View style={styles.benefitTextGroup}>
              <Text style={styles.benefitHeading}>Fast QR Check-In</Text>
              <Text style={styles.benefitDescription}>
                Scan once at the entrance kiosk to notify counters and confirm your physical presence.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => setCurrentScreen('auth')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => setCurrentScreen('home')}
          >
            <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#142B4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#142B4A',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  benefitsContainer: {
    marginVertical: 40,
    gap: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 6,
    marginRight: 14,
  },
  benefitTextGroup: {
    flex: 1,
  },
  benefitHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 3,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  actionGroup: {
    gap: 12,
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#142B4A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  secondaryButtonText: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '600',
  },
});
