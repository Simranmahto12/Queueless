import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useMobile } from '../context/MobileContext';
import { MOCK_INSTITUTIONS, InstitutionSector } from '@queueless/shared';

export const HomeScreen: React.FC = () => {
  const {
    user,
    activeToken,
    setCurrentScreen,
    setSelectedInstitution,
  } = useMobile();

  const categories = [
    { label: 'Healthcare', sector: InstitutionSector.HEALTHCARE, count: '14 Clinics' },
    { label: 'Banking', sector: InstitutionSector.BANKING, count: '8 Branches' },
    { label: 'Civic / Gov', sector: InstitutionSector.GOVERNMENT, count: '5 Centers' },
    { label: 'Academic', sector: InstitutionSector.EDUCATION, count: '3 Offices' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Greeting */}
        <View style={styles.greetingHeader}>
          <div>
            <Text style={styles.greetingTitle}>Hello, {user?.name || 'Visitor'}</Text>
            <Text style={styles.greetingSubtitle}>Plan arrivals, avoid crowded waiting rooms</Text>
          </div>
          <TouchableOpacity
            style={styles.notifBadge}
            onPress={() => setCurrentScreen('notifications')}
          >
            <Text style={styles.notifBadgeText}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Active Token Hero Card */}
        {activeToken ? (
          <TouchableOpacity
            style={styles.activeTokenCard}
            activeOpacity={0.9}
            onPress={() => setCurrentScreen('live_queue')}
          >
            <View style={styles.tokenTopRow}>
              <View>
                <Text style={styles.activeTokenBadge}>ACTIVE QUEUE TICKET</Text>
                <Text style={styles.tokenNumberLarge}>{activeToken.tokenNumber}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{activeToken.status}</Text>
              </View>
            </View>

            <View style={styles.tokenDetails}>
              <Text style={styles.tokenService}>12-Lead ECG & Vitals</Text>
              <Text style={styles.tokenInstitution}>Downtown Medical Campus</Text>
            </View>

            <View style={styles.tokenFooterRow}>
              <View>
                <Text style={styles.metricLabel}>Smart Arrival Window</Text>
                <Text style={styles.metricValue}>09:35 AM - 09:45 AM</Text>
              </View>
              <View style={styles.alignRight}>
                <Text style={styles.metricLabel}>Est. Wait</Text>
                <Text style={styles.metricValue}>{activeToken.estimatedWaitMinutes} mins</Text>
              </View>
            </View>

            <View style={styles.trackCta}>
              <Text style={styles.trackCtaText}>Tap to View Live Queue Position →</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.noTokenCard}>
            <Text style={styles.noTokenTitle}>No Active Token</Text>
            <Text style={styles.noTokenDesc}>Book a slot at a hospital, bank, or civic center.</Text>
            <TouchableOpacity
              style={styles.bookCta}
              onPress={() => setCurrentScreen('discovery')}
            >
              <Text style={styles.bookCtaText}>Find Institution</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sectors / Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Sector</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={styles.categoryCard}
                activeOpacity={0.8}
                onPress={() => setCurrentScreen('discovery')}
              >
                <Text style={styles.categoryName}>{cat.label}</Text>
                <Text style={styles.categoryCount}>{cat.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby / Recommended Institutions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Facilities</Text>
            <TouchableOpacity onPress={() => setCurrentScreen('discovery')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.institutionList}>
            {MOCK_INSTITUTIONS.map((inst) => (
              <TouchableOpacity
                key={inst.institutionId}
                style={styles.instCard}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedInstitution(inst);
                  setCurrentScreen('service_selection');
                }}
              >
                <View style={styles.instIcon}>
                  <Text style={styles.instIconText}>{inst.name[0]}</Text>
                </View>
                <View style={styles.instInfo}>
                  <Text style={styles.instName} numberOfLines={1}>
                    {inst.name}
                  </Text>
                  <Text style={styles.instSector}>{inst.sector.replace('_', ' ')}</Text>
                  <Text style={styles.instAddress} numberOfLines={1}>
                    Open 08:00 - 20:00 • Fast Check-In
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  notifBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  notifBadgeText: {
    fontSize: 18,
  },
  activeTokenCard: {
    backgroundColor: '#142B4A',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#142B4A',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  tokenTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activeTokenBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.8,
  },
  tokenNumberLarge: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  statusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tokenDetails: {
    marginTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  tokenService: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tokenInstitution: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  tokenFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  trackCta: {
    marginTop: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.4)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noTokenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    alignItems: 'center',
  },
  noTokenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#172033',
  },
  noTokenDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  bookCta: {
    marginTop: 14,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  bookCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172033',
  },
  seeAllText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172033',
  },
  categoryCount: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  institutionList: {
    gap: 10,
  },
  instCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  instIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instIconText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#142B4A',
  },
  instInfo: {
    flex: 1,
  },
  instName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172033',
  },
  instSector: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  instAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#94A3B8',
    marginLeft: 8,
  },
});
