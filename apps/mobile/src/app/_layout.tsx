import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { ServicesProvider } from "../composition/app-services";
import type { AppServices } from "../composition/app-services";
import { createProductionServices } from "../composition/production-services";

export default function RootLayout() {
  const [services, setServices] = useState<AppServices | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    createProductionServices().then(setServices, () => setFailed(true));
  }, []);

  if (!services) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        {failed ? <Text>Uygulama verisi açılamadı.</Text> : <ActivityIndicator />}
      </View>
    );
  }

  return (
    <ServicesProvider services={services}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="lesson/[id]" options={{ title: "Ders" }} />
        <Stack.Screen name="import" options={{ title: "Ders al" }} />
      </Stack>
    </ServicesProvider>
  );
}
