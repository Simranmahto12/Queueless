import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useMobile } from '../context/MobileContext';

export const HistoryScreen: React.FC = () => {
  const { tokensHistory } = useMobile();
  const [tab, setTab] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const filtered = tokensHistory.filter((t) => {
    if (tab === 'COMPLETED') return t.status === 'COMPLETED';
    if (tab === 'CANCELLED') return t.status === 'CANCELLED';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking & Token History</Text>
        <Text style={styles.subtitle}>Past consultations, checks, and completed visits</Text>

        {/* Tab Filters */}
        <View style={styles.tabRow}>
          {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'ALL' ? 'All Tokens' : t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((t) => (
          <View key={t.tokenId} style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.tokenNumber}>{t.tokenNumber}</Text>
                <Text style={styles.tokenDate}>
                  {t.scheduledSlot.date} • {t.scheduledSlot.startTime} AM
                </Text>
              </View>
              <View
                style={[
                  styles.statusTag,
                  t.status === 'COMPLETED'
                    ? styles.statusCompleted
                    : t.status === 'CANCELLED'
                    ? styles.statusCancelled
                    : styles.statusWaiting,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    t.status === 'COMPLETED'
                      ? styles.textCompleted
                      : t.status === 'CANCELLED'
                      ? styles.textCancelled
                      : styles.textWaiting,
                  ]}
                >
                  {t.status}
                </Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <Text style={styles.serviceName}>
                {t.serviceId.replace('srv-', '').toUpperCase()} Consultation
              </Text>
              <Text style={styles.assignedDesk}>
                {t.assignedCounterNumber || 'Station Window'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAF1',
    gap: 8,
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
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  tabActive: {
    backgroundColor: '#142B4A',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tokenNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#172033',
  },
  tokenDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusCancelled: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusWaiting: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textCompleted: {
    color: '#166534',
  },
  textCancelled: {
    color: '#991B1B',
  },
  textWaiting: {
    color: '#1E40AF',
  },
  cardBottom: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#172033',
  },
  assignedDesk: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
