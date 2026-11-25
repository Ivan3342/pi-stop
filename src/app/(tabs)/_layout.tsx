import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          // Hide default tab bar to match the single-CTA footer design
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'PiStop',
          }}
        />
      </Tabs>
    </>
  );
}