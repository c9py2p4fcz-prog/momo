import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const isIOS =
    Platform.OS === 'ios' ||
    (Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent));

  // 56px provides safe clearance for iPhone Dynamic Island and notches
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 56 : (Platform.OS === 'ios' ? 54 : 0));
  // 36px provides safe clearance for iPhone Home indicator bar and Safari toolbar
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 36 : (Platform.OS === 'ios' ? 34 : 16));
  const tabHeight = 58 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerStatusBarHeight: topInset,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.cardBackground,
          borderTopColor: theme.border,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: theme.cardBackground,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: theme.text,
        },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Табло',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Транзакции',
          headerTitle: 'Всички транзакции',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Скенер',
          headerTitle: 'Сканиране на бележка',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'scan-circle' : 'scan-circle-outline'}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: 'Архив',
          headerTitle: 'Локален архив бележки',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'images' : 'images-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: 'Сметки',
          headerTitle: 'Периодични сметки',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
