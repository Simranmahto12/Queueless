import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MobileProvider, useMobile } from './context/MobileContext';
import { BottomNav } from './navigation/BottomNav';

// 10 Screens
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { DiscoveryScreen } from './screens/DiscoveryScreen';
import { ServiceSelectionScreen } from './screens/ServiceSelectionScreen';
import { BookingConfirmationScreen } from './screens/BookingConfirmationScreen';
import { LiveQueueScreen } from './screens/LiveQueueScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';

const MobileNavigator: React.FC = () => {
  const { currentScreen } = useMobile();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen />;
      case 'auth':
        return <AuthScreen />;
      case 'home':
        return <HomeScreen />;
      case 'discovery':
        return <DiscoveryScreen />;
      case 'service_selection':
        return <ServiceSelectionScreen />;
      case 'booking_confirmation':
        return <BookingConfirmationScreen />;
      case 'live_queue':
        return <LiveQueueScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar style="dark" />
      <View style={styles.screenWrapper}>{renderScreen()}</View>
      <BottomNav />
    </View>
  );
};

export default function App() {
  return (
    <MobileProvider>
      <MobileNavigator />
    </MobileProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  screenWrapper: {
    flex: 1,
  },
});
