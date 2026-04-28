import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor:  '#252525',
          borderTopWidth:  1,
        },
        tabBarActiveTintColor:   '#c8ff57',
        tabBarInactiveTintColor: '#444444',
        tabBarLabelStyle: {
          fontSize:      9,
          fontWeight:    'bold',
          letterSpacing: 0.05,
          textTransform: 'uppercase',
          marginBottom:  4,
        },
      }}
    >
      <Tabs.Screen name="(tabs)/index"   options={{ title: 'Discover' }} />
      <Tabs.Screen name="(tabs)/routes"  options={{ title: 'Routes'   }} />
      <Tabs.Screen name="(tabs)/parks"   options={{ title: 'Parks'    }} />
      <Tabs.Screen name="(tabs)/profile" options={{ title: 'Profile'  }} />
    </Tabs>
  )
}