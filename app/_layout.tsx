import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../src/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="contact/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="contact/create" options={{ headerShown: false }} />
        <Stack.Screen name="scan/confirm" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="personal-card/index" options={{ headerShown: false }} />
        <Stack.Screen name="personal-cards/index" options={{ headerShown: false }} />
        <Stack.Screen name="personal-cards/create" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
