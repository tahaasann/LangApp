import { Tabs } from "expo-router/js-tabs";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Oluştur", tabBarLabel: "Oluştur", tabBarIcon: () => null }} />
      <Tabs.Screen name="lessons" options={{ title: "Dersler", tabBarLabel: "Dersler", tabBarIcon: () => null }} />
      <Tabs.Screen name="quiz" options={{ title: "Quiz", tabBarLabel: "Quiz", tabBarIcon: () => null }} />
    </Tabs>
  );
}
