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

export const NotificationsScreen: React.FC = () => {
  const { notifications, markNotificationAsRead, setCurrentScreen } = useMobile();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Arrival alerts, queue updates, and desk calls</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        ) : (
          notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.notifCard, !n.isRead && styles.notifUnread]}
              activeOpacity={0.8}
              onPress={() => markNotificationAsRead(n.id)}
            >
              <View style={styles.notifHeader}>
                <View style={styles.titleRow}>
                  {!n.isRead && <View style={styles.unreadDot} />}
                  <Text style={styles.notifTitle}>{n.title}</Text>
                </View>
                <Text style={styles.notifTime}>{n.time}</Text>
              </View>
              <Text style={styles.notifMessage}>{n.message}</Text>
            </TouchableOpacity>
          ))
        )}
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
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAF1',
  },
  backBtn: {
    marginBottom: 6,
  },
  backBtnText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
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
  list: {
    padding: 20,
    gap: 12,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5EAF1',
    gap: 6,
  },
  notifUnread: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFF',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#172033',
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  notifMessage: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
});
