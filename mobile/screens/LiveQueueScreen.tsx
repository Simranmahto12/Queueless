import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert as RNAlert,
} from 'react-native';
import { useMobile } from '../context/MobileContext';

export const LiveQueueScreen: React.FC = () => {
  const { activeToken, cancelActiveToken, setCurrentScreen } = useMobile();

  const [lastRefreshed, setLastRefreshed] = useState('Just now');

  if (!activeToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Active Token</Text>
          <Text style={styles.emptyDesc}>You do not have any tokens currently waiting in queue.</Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => setCurrentScreen('discovery')}
          >
            <Text style={styles.bookButtonText}>Find Institution & Book</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Live Position Calculation Mock
  const currentServingToken = 'CARD-101';
  const peopleAhead = 1;

  const handleCancel = () => {
    RNAlert.alert(
      'Cancel Token',
      `Are you sure you want to cancel ${activeToken.tokenNumber}?`,
      [
        { text: 'Keep Token', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            await cancelActiveToken();
            setCurrentScreen('home');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Live Queue Tracker</Text>
          <Text style={styles.subtitle}>Last synchronized: {lastRefreshed}</Text>
        </View>

        {/* Big Live Position Monitor */}
        <View style={styles.monitorCard}>
          <View style={styles.monitorHeader}>
            <View style={styles.pulseDot} />
            <Text style={styles.monitorTag}>NOW SERVING AT COUNTER 01</Text>
          </View>
          <Text style={styles.servingTokenLarge}>{currentServingToken}</Text>
          <Text style={styles.servingDeskNote}>Phlebotomist / Physician actively consulting</Text>

          {/* Your Token Callout */}
          <View style={styles.yourTokenBox}>
            <View>
              <Text style={styles.yourTokenLabel}>YOUR TICKET</Text>
              <Text style={styles.yourTokenNumber}>{activeToken.tokenNumber}</Text>
            </View>
            <View style={styles.aheadPill}>
              <Text style={styles.aheadCount}>{peopleAhead}</Text>
              <Text style={styles.aheadLabel}>person ahead</Text>
            </View>
          </View>
        </View>

        {/* Progress Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Queue Journey Status</Text>

          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.dotDone]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStep}>1. Digital Token Issued</Text>
                <Text style={styles.timelineSub}>Slot reserved at {activeToken.scheduledSlot.startTime} AM</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.dotDone]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStep}>2. Check-In Verified</Text>
                <Text style={styles.timelineSub}>Lobby presence confirmed via kiosk</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.dotCurrent]} />
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineStep, styles.stepCurrent]}>3. Next in Line</Text>
                <Text style={styles.timelineSub}>Estimated call time in ~{activeToken.estimatedWaitMinutes} minutes</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.dotPending]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStep}>4. Counter Consultation</Text>
                <Text style={styles.timelineSub}>Counter 01 Desk</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Physical Arrival Guidance */}
        <View style={styles.guidanceCard}>
          <Text style={styles.guidanceTitle}>Waiting Area Instructions</Text>
          <Text style={styles.guidanceText}>
            Please remain seated in the Cardiology 3rd Floor Waiting Lounge. An audio chime and visual screen display will flash your token number ({activeToken.tokenNumber}) when called.
          </Text>
        </View>

        {/* Cancellation Option */}
        <TouchableOpacity style={styles.cancelLink} onPress={handleCancel}>
          <Text style={styles.cancelLinkText}>Cancel This Queue Token</Text>
        </TouchableOpacity>
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
    padding: 20,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172033',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  bookButton: {
    marginTop: 10,
    backgroundColor: '#142B4A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingVertical: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172033',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  monitorCard: {
    backgroundColor: '#142B4A',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#142B4A',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  monitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  monitorTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.8,
  },
  servingTokenLarge: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  servingDeskNote: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  yourTokenBox: {
    marginTop: 18,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  yourTokenLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD',
  },
  yourTokenNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  aheadPill: {
    alignItems: 'flex-end',
  },
  aheadCount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  aheadLabel: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5EAF1',
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172033',
    marginBottom: 14,
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  dotDone: {
    backgroundColor: '#16A36A',
  },
  dotCurrent: {
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#93C5FD',
  },
  dotPending: {
    backgroundColor: '#CBD5E1',
  },
  timelineContent: {
    flex: 1,
  },
  timelineStep: {
    fontSize: 13,
    fontWeight: '600',
    color: '#172033',
  },
  stepCurrent: {
    color: '#2563EB',
    fontWeight: '700',
  },
  timelineSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  guidanceCard: {
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  guidanceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 3,
  },
  guidanceText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 17,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelLinkText: {
    fontSize: 13,
    color: '#DC4C4C',
    fontWeight: '600',
  },
});
