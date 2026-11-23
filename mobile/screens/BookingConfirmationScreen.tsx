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

export const BookingConfirmationScreen: React.FC = () => {
  const { activeToken, setCurrentScreen } = useMobile();

  if (!activeToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No token currently active.</Text>
          <TouchableOpacity onPress={() => setCurrentScreen('home')}>
            <Text style={styles.linkText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Success Header */}
        <View style={styles.header}>
          <View style={styles.checkmarkBadge}>
            <Text style={styles.checkText}>✓</Text>
          </View>
          <Text style={styles.title}>Token Confirmed</Text>
          <Text style={styles.subtitle}>Your position in queue is secured</Text>
        </View>

        {/* Digital Boarding Pass Ticket */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketTop}>
            <Text style={styles.ticketTag}>OFFICIAL QUEUE PASS</Text>
            <Text style={styles.tokenNumber}>{activeToken.tokenNumber}</Text>
            <Text style={styles.visitorName}>{activeToken.visitorName}</Text>
          </View>

          {/* Dotted Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.notchLeft} />
            <View style={styles.dashLine} />
            <View style={styles.notchRight} />
          </View>

          {/* QR Code Presentation Box */}
          <View style={styles.ticketBody}>
            <View style={styles.qrBox}>
              <View style={styles.qrMockMatrix}>
                <View style={styles.qrFinderTopLeft} />
                <View style={styles.qrFinderTopRight} />
                <View style={styles.qrFinderBottomLeft} />
                <Text style={styles.qrCenterText}>SCAN AT KIOSK</Text>
              </View>
              <Text style={styles.qrCaption}>Scan upon arrival at entrance kiosk</Text>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Arrival Window</Text>
                <Text style={styles.detailValue}>
                  {activeToken.scheduledSlot.startTime} AM
                </Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Est. Wait Time</Text>
                <Text style={styles.detailValue}>
                  {activeToken.estimatedWaitMinutes} Minutes
                </Text>
              </View>
            </View>

            <View style={styles.singleDetailRow}>
              <Text style={styles.detailLabel}>Department</Text>
              <Text style={styles.detailValue}>{activeToken.departmentId.replace('dep-', '').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.trackButton}
            activeOpacity={0.85}
            onPress={() => setCurrentScreen('live_queue')}
          >
            <Text style={styles.trackButtonText}>Track Live Queue Progress →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            activeOpacity={0.85}
            onPress={() => setCurrentScreen('home')}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
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
    padding: 24,
    alignItems: 'center',
    gap: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
  },
  linkText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
  },
  checkmarkBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16A36A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#172033',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ticketCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    shadowColor: '#142B4A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  ticketTop: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#142B4A',
  },
  ticketTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 1,
  },
  tokenNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 6,
    letterSpacing: -1,
  },
  visitorName: {
    fontSize: 14,
    color: '#E2E8F0',
    marginTop: 4,
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    backgroundColor: '#FFFFFF',
  },
  notchLeft: {
    width: 14,
    height: 20,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#F7F9FC',
    borderRightWidth: 1,
    borderColor: '#E5EAF1',
  },
  dashLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  notchRight: {
    width: 14,
    height: 20,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#F7F9FC',
    borderLeftWidth: 1,
    borderColor: '#E5EAF1',
  },
  ticketBody: {
    padding: 24,
    alignItems: 'center',
    gap: 18,
  },
  qrBox: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  qrMockMatrix: {
    width: 140,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#172033',
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrFinderTopLeft: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderWidth: 3,
    borderColor: '#142B4A',
  },
  qrFinderTopRight: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderWidth: 3,
    borderColor: '#142B4A',
  },
  qrFinderBottomLeft: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 24,
    height: 24,
    borderWidth: 3,
    borderColor: '#142B4A',
  },
  qrCenterText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
  },
  qrCaption: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#172033',
    marginTop: 2,
  },
  singleDetailRow: {
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  trackButton: {
    backgroundColor: '#142B4A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  homeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  homeButtonText: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '600',
  },
});
