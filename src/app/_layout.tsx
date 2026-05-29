import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDb } from '../database/db';
import { theme } from '../constants/theme';
import { CartProvider } from '../context/CartContext';

export default function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    async function initDb() {
      try {
        await getDb();
        setDbInitialized(true);
      } catch (e) {
        console.error('Failed to init DB:', e);
      }
    }
    initDb();
  }, []);

  if (!dbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Database...</Text>
      </View>
    );
  }

  return (
    <CartProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.backgroundCream,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="new-order" options={{ presentation: 'modal' }} />
        <Stack.Screen name="delivery-details" />
        <Stack.Screen name="order-details" options={{ presentation: 'modal' }} />
      </Stack>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundCream,
  },
  loadingText: {
    color: theme.colors.primaryOrange,
    fontSize: theme.typography.fontSize.h3,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
