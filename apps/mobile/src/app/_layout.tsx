import * as Linking from 'expo-linking';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AuthProvider } from '@/lib/auth';

export default function RootLayout() {
  useEffect(() => {
    const goToBookings = (url: string) => {
      if (url.includes('booking-result')) {
        router.replace('/bookings');
      }
    };
    Linking.getInitialURL()
      .then((url) => {
        if (url) goToBookings(url);
      })
      .catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => goToBookings(url));
    return () => sub.remove();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}