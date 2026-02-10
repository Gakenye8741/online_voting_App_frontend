// app/splashScreen.tsx
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height, width } = Dimensions.get("window");

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(50)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const mottoFade = useRef(new Animated.Value(0)).current;
  const mottoSlide = useRef(new Animated.Value(30)).current;

  const dots = Array.from({ length: 8 }, () => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(Math.random() * height),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.3 + Math.random() * 0.5),
  }));

  const router = useRouter();

  // =============================
  // 🔥 AUTH LOGIC ADDED HERE
  // =============================
  const checkLogin = async () => {
    const token = await AsyncStorage.getItem("token");

    setTimeout(() => {
      if (token) {
        router.replace("/(tabs)"); // 👈 logged in → go to Home
      } else {
        router.replace("/Auth/Login"); // 👈 not logged in → go to Login
      }
    }, 500); // slight delay so animations finish nicely
  };

  useEffect(() => {
    // Background color animation (loop)
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 3000, useNativeDriver: false }),
        Animated.timing(bgAnim, { toValue: 0, duration: 3000, useNativeDriver: false }),
      ])
    ).start();

    // Main animations
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      ),
      Animated.parallel([
        Animated.timing(textFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(textSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(mottoFade, { toValue: 1, duration: 1200, delay: 300, useNativeDriver: true }),
        Animated.timing(mottoSlide, { toValue: 0, duration: 1200, delay: 300, useNativeDriver: true }),
      ]),
      Animated.delay(1500), // finish animation
    ]).start(() => {
      checkLogin(); // 👈 CALL THE FIX HERE
    });

    // Animate dots
    dots.forEach((dot, i) => {
      const delay = i * 400;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(dot.y, { toValue: Math.random() * height, duration: 4000, useNativeDriver: true }),
            Animated.timing(dot.opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(dot.scale, { toValue: 0.5 + Math.random() * 0.5, duration: 4000, useNativeDriver: true }),
          ]),
          Animated.timing(dot.opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
          Animated.timing(dot.y, { toValue: Math.random() * height, duration: 0, useNativeDriver: true }),
          Animated.timing(dot.scale, { toValue: 0.3 + Math.random() * 0.5, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffe6f0", "#ff3366"],
  });

  return (
    <Animated.View style={{ flex: 1 }}>
      <LinearGradient colors={["#fff0f5", "#ffccd9", "#ff3366"]} style={styles.gradient} />
      <Animated.View style={[styles.overlay, { backgroundColor: bgColor }]} />

      {/* Animated Dots */}
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              opacity: dot.opacity,
              transform: [
                { translateX: dot.x },
                { translateY: dot.y },
                { scale: dot.scale },
              ],
            },
          ]}
        />
      ))}

      {/* Main Logo and Text */}
      <View style={styles.center}>
        <Animated.Image
          source={require("../assets/images/Laikipia-logo.png")}
          style={[styles.logo, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
          resizeMode="contain"
        />

        <Animated.Text style={[styles.text, { opacity: textFade, transform: [{ translateY: textSlide }] }]}>
          Laikipia E-Vote
        </Animated.Text>

        <Animated.Text style={[styles.motto, { opacity: mottoFade, transform: [{ translateY: mottoSlide }] }]}>
          Secure & Transparent Voting
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { width: 100, height: 100, marginBottom: 20 },
  text: { fontSize: 32, fontWeight: "700", color: "#fff", marginTop: 20 },
  motto: {
    fontSize: 18,
    color: "#fff",
    marginTop: 12,
    opacity: 0.95,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  dot: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#fff" },
});
