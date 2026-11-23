import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useMobile, MobileScreen } from '../context/MobileContext';

export const BottomNav: React.FC = () => {
  const { currentScreen, setCurrentScreen, activeToken } = useMobile();

  // Hide bottom nav on onboarding, auth, or booking flow
  if (
    currentScreen === 'onboarding' ||
    currentScreen === 'auth' ||
    currentScreen === 'service_selection' ||
    currentScreen === 'booking_confirmation'
  ) {
    return null;
  }

  const tabs: { id: MobileScreen; label: string; icon: string; badge?: boolean }[] = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'discovery', label: 'Discover', icon: '🔍' },
    { id: 'live_queue', label: 'Queue', icon: '⏱', badge: !!activeToken },
    { id: 'history', label: 'History', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = currentScreen === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            activeOpacity={0.8}
            onPress={() => setCurrentScreen(tab.id)}
          >
            <View style={styles.iconContainer}>
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                {tab.icon}
              </Text>
              {tab.badge && <View style={styles.badgeDot} />}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5EAF1',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  iconContainer: {
    position: 'relative',
  },
  tabIcon: {
    fontSize: 18,
    color: '#64748B',
  },
  tabIconActive: {
    color: '#142B4A',
    fontWeight: '800',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2563EB',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#142B4A',
    fontWeight: '700',
  },
});
