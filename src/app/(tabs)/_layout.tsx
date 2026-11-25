import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const activeColor = isDark ? '#3B82F6' : '#1A56DB';
  const inactiveColor = isDark ? '#94A3B8' : '#6B7280';
  const tabBarBg = isDark ? '#1E293B' : '#FFFFFF';
  const tabBarBorder = isDark ? '#334155' : '#E5E7EB';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            backgroundColor: tabBarBg,
            borderTopColor: tabBarBorder,
            borderTopWidth: 1,
            height: Platform.OS === 'android' ? 62 : 84,
            paddingBottom: Platform.OS === 'android' ? 8 : 24,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Pocetna',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="timetables"
          options={{
            title: 'Red Voznje',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'bus' : 'bus-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
      <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
    </Tabs>
    </>
  );
}