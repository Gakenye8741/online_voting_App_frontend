// app/_layout.tsx
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../src/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splashScreen" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="theme" />
      </Stack>
    </Provider>
  );
}
