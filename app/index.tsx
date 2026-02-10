import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/splashScreen");
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Starting Laikipia University Student Voting System...</Text>
      <ActivityIndicator size="large" color="#ff3366" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 18,
    color: "#ff3366",
    marginBottom: 10,
  },
});
