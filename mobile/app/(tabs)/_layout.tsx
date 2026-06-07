import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: "#18181b", borderTopColor: "#27272a" },
      tabBarActiveTintColor: "#a855f7",
      tabBarInactiveTintColor: "#71717a",
    }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="camera" options={{ title: "Capture", tabBarIcon: ({ color, size }) => <Ionicons name="camera" size={size} color={color} /> }} />
      <Tabs.Screen name="editor" options={{ title: "Edit", tabBarIcon: ({ color, size }) => <Ionicons name="color-wand" size={size} color={color} /> }} />
      <Tabs.Screen name="dashboard" options={{ title: "History", tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} /> }} />
    </Tabs>
  );
}
