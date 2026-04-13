// app/splashScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Animated, StyleSheet, Dimensions, StatusBar, Text, Easing } from "react-native";
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
  
  // Scanner and Progress Animations
  const scanAnim = useRef(new Animated.Value(-100)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progressPercent, setProgressPercent] = useState(0);

  // Technical elements animations
  const gridFade = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;

  const SPLASH_DURATION = 14000; // 14 Seconds as requested

  // Floating nodes with random drift
  const dots = Array.from({ length: 20 }, () => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(Math.random() * height),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.2 + Math.random() * 0.4),
  }));

  // Verification badges that move from bottom to top
  const badges = Array.from({ length: 6 }, () => ({
    x: Math.random() * (width - 40),
    y: new Animated.Value(height + 100),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.6 + Math.random() * 0.4),
  }));

  const router = useRouter();

  const checkLogin = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        router.replace("/(tabs)");
      } else {
        router.replace("/Auth/Login");
      }
    } catch (e) {
      router.replace("/Auth/Login");
    }
  };

  useEffect(() => {
    // 1. Loading Bar Logic (0 to 100%)
    progressAnim.addListener(({ value }) => {
      setProgressPercent(Math.floor(value));
    });

    Animated.timing(progressAnim, {
      toValue: 100,
      duration: SPLASH_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // 2. Scanner Beam Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: height + 100,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, { toValue: -100, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    // 3. Technical Grid and Background Pulse
    Animated.timing(gridFade, { toValue: 0.1, duration: 2000, useNativeDriver: true }).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgAnim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(bgAnim, { toValue: 0, duration: 4000, useNativeDriver: false }),
      ])
    ).start();

    // 4. Entrance Animation Sequence
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
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // 5. Floating Nodes (Blockchain Constellation)
    dots.forEach((dot, i) => {
      const delay = i * 200;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(dot.y, { toValue: -50, duration: 10000, useNativeDriver: true }),
            Animated.timing(dot.opacity, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
          ]),
          Animated.timing(dot.opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
          Animated.timing(dot.y, { toValue: height + 50, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    });

    // 6. Verification Badges (Moving from bottom to top)
    badges.forEach((badge, i) => {
      const delay = i * 2000;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(badge.y, { toValue: -100, duration: 12000, easing: Easing.linear, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(badge.opacity, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
              Animated.delay(8000),
              Animated.timing(badge.opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
            ])
          ]),
          Animated.timing(badge.y, { toValue: height + 100, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    });

    // 7. Final Trigger after 14 seconds
    const splashTimer = setTimeout(() => {
      checkLogin();
    }, SPLASH_DURATION);

    return () => {
      clearTimeout(splashTimer);
      progressAnim.removeAllListeners();
    };
  }, []);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(200, 16, 46, 0)", "rgba(200, 16, 46, 0.2)"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#c8102e' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      
      <LinearGradient 
        colors={["#c8102e", "#6b0a1a", "#000000"]} 
        style={styles.gradient} 
      />
      
      <Animated.View style={[styles.overlay, { backgroundColor: bgColor }]} />
      <Animated.View style={[styles.grid, { opacity: gridFade }]} />

      <Animated.View style={[styles.scanBeam, { transform: [{ translateY: scanAnim }] }]}>
        <View style={styles.beamInner} />
        <LinearGradient
          colors={["transparent", "rgba(255, 215, 0, 0.15)", "transparent"]}
          style={styles.beamGlow}
        />
      </Animated.View>

      {/* Floating Verification Badges */}
      {badges.map((badge, index) => (
        <Animated.View
          key={`badge-${index}`}
          style={[
            styles.dot,
            {
              opacity: badge.opacity,
              transform: [
                { translateX: badge.x },
                { translateY: badge.y },
                { scale: badge.scale },
              ],
            },
          ]}
        >
          {/* Updated name for wider compatibility */}
          <Ionicons name="checkmark-done-circle-outline" size={32} color="rgba(255,215,0,0.3)" />
        </Animated.View>
      ))}

      {/* Floating Nodes */}
      {dots.map((dot, index) => (
        <Animated.View
          key={`dot-${index}`}
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
          <Ionicons name="link-outline" size={18} color="rgba(255,215,0,0.4)" />
        </Animated.View>
      ))}

      <View style={styles.center}>
        <Animated.View style={{ 
          opacity: fadeAnim, 
          transform: [{ scale: Animated.multiply(scaleAnim, logoPulse) }], 
          alignItems: 'center' 
        }}>
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

      <Animated.View style={[styles.footer, { opacity: mottoFade }]}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingTrack}>
            <Animated.View style={[styles.loadingFill, { width: progressWidth }]} />
          </View>
          <View style={styles.loadingInfo}>
            <Text style={styles.loadingText}>INITIALIZING SECURE VOTING ...</Text>
            <Text style={styles.loadingText}>{progressPercent}%</Text>
          </View>
        </View>

        <View style={styles.secureBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#FFD700" />
            <Text style={styles.footerText}>SECURED BY BLOCKCHAIN TECHNOLOGY</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject },
  grid: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'transparent',
  },
  scanBeam: {
    position: 'absolute',
    width: '100%',
    height: 80,
    zIndex: 10,
  },
  beamInner: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.6)',
    shadowColor: "#FFD700",
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  beamGlow: {
    width: '100%',
    height: '100%',
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoShadow: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 25,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  logo: { width: 130, height: 130 },
  textContainer: { alignItems: 'center', marginTop: 30 },
  text: { 
    fontSize: 34, 
    fontWeight: "900", 
    color: "#fff", 
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10
  },
  separator: { 
    width: 50, 
    height: 2, 
    backgroundColor: '#FFD700', 
    marginVertical: 15,
    borderRadius: 2 
  },
  motto: {
    fontSize: 13,
    color: "#fff",
    fontWeight: '700',
    letterSpacing: 5,
    opacity: 0.8,
  },
  dot: { position: "absolute" },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    gap: 15
  },
  loadingContainer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 10
  },
  loadingTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 8
  },
  loadingFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  loadingInfo: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    gap: 8
  },
  footerText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5
  }
});