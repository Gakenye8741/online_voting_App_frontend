// app/splashScreen.tsx
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions, StatusBar, Text } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(50)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const mottoFade = useRef(new Animated.Value(0)).current;
  const mottoSlide = useRef(new Animated.Value(30)).current;

  // Dots now represent "Floating Ballots/Checkmarks" for the election feel
  const dots = Array.from({ length: 12 }, () => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(Math.random() * height),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.3 + Math.random() * 0.5),
  }));

  const router = useRouter();

  const checkLogin = async () => {
    const token = await AsyncStorage.getItem("token");
    setTimeout(() => {
      if (token) {
        router.replace("/(tabs)");
      } else {
        router.replace("/Auth/Login");
      }
    }, 500);
  };

  useEffect(() => {
    // Elegant Pulse for the background
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(bgAnim, { toValue: 0, duration: 4000, useNativeDriver: false }),
      ])
    ).start();

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1.1, friction: 4, useNativeDriver: true }),
        Animated.timing(textFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(textSlide, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(mottoFade, { toValue: 1, duration: 1200, delay: 200, useNativeDriver: true }),
        Animated.timing(mottoSlide, { toValue: 0, duration: 1200, delay: 200, useNativeDriver: true }),
      ]),
      Animated.delay(1000),
    ]).start(() => {
      checkLogin();
    });

    dots.forEach((dot, i) => {
      const delay = i * 300;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(dot.y, { toValue: height * 0.2, duration: 6000, useNativeDriver: true }),
            Animated.timing(dot.opacity, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
          ]),
          Animated.timing(dot.opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
          Animated.timing(dot.y, { toValue: height, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(200, 16, 46, 0)", "rgba(200, 16, 46, 0.2)"], // Subtle Crimson pulse
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#c8102e' }}>
      <StatusBar barStyle="light-content" />
      
      {/* 1. Official Gradient: Deep Red to Black (Authored look) */}
      <LinearGradient 
        colors={["#c8102e", "#8a0b1f", "#1a1a1a"]} 
        style={styles.gradient} 
      />
      
      <Animated.View style={[styles.overlay, { backgroundColor: bgColor }]} />

      {/* 2. Floating "Checkmark" particles instead of plain dots */}
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
        >
            <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.4)" />
        </Animated.View>
      ))}

      <View style={styles.center}>
        {/* Logo Container with Glow */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
            <View style={styles.logoShadow}>
                <Animated.Image
                source={require("../assets/images/Laikipia-logo.png")}
                style={styles.logo}
                resizeMode="contain"
                />
            </View>
        </Animated.View>

        <View style={styles.textContainer}>
            <Animated.Text style={[styles.text, { opacity: textFade, transform: [{ translateY: textSlide }] }]}>
                LAIKIPIA <Text style={{ color: '#FFD700' }}>E-VOTE</Text>
            </Animated.Text>

            <View style={styles.separator} />

            <Animated.Text style={[styles.motto, { opacity: mottoFade, transform: [{ translateY: mottoSlide }] }]}>
                ONE STUDENT, ONE VOTE
            </Animated.Text>
        </View>
      </View>

      {/* Footer Branding */}
      <Animated.View style={[styles.footer, { opacity: mottoFade }]}>
        <Ionicons name="shield-checkmark" size={16} color="#FFD700" />
        <Text style={styles.footerText}>SECURED BY BLOCKCHAIN TECHNOLOGY</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoShadow: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logo: { width: 120, height: 120 },
  textContainer: { alignItems: 'center', marginTop: 30 },
  text: { 
    fontSize: 34, 
    fontWeight: "900", 
    color: "#fff", 
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10
  },
  separator: { 
    width: 40, 
    height: 3, 
    backgroundColor: '#FFD700', 
    marginVertical: 15,
    borderRadius: 2 
  },
  motto: {
    fontSize: 14,
    color: "#fff",
    fontWeight: '600',
    letterSpacing: 4,
    opacity: 0.9,
  },
  dot: { position: "absolute" },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  }
});