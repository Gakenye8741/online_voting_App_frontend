import { Tabs } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import AppLayout from "@/src/components/AppLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const theme = useSelector((state: RootState) => state.theme.mode);
  const accent = useSelector((state: RootState) => state.theme.accent);
  const insets = useSafeAreaInsets();

  const inactiveColor = theme === "dark" ? "#aaa" : "#444";
  const backgroundColor = theme === "dark" ? "#1c1c1c" : "#fff";

  return (
    <AppLayout>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: accent,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            backgroundColor,
            borderTopWidth: 0.4,
            borderTopColor: "#ddd",
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowOffset: { width: 0, height: -3 },
            shadowRadius: 5,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />
       <Tabs.Screen
  name="Candidate"
  options={{
    title: "Candidates",
    tabBarIcon: ({ color }) => (
      <MaterialCommunityIcons name="account-group" size={26} color={color} />
    ),
  }}
/>

        <Tabs.Screen
          name="vote"
          options={{
            title: "Vote",
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="vote" size={26} color={color} />,
          }}
        />
        <Tabs.Screen
          name="results"
          options={{
            title: "Results",
            tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={25} color={color} />,
          }}
        />
        {/* <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
          }}
        /> */}
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            tabBarIcon: ({ color }) => <Ionicons name="ellipsis-horizontal" size={25} color={color} />,
          }}
        />
      </Tabs>
    </AppLayout>
  );
}
