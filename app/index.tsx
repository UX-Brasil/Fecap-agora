import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";

import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { storage } from "@/src/utils/storage";

const ONBOARDING_KEY = "asa_onboarded";

export default function Splash() {
  const { user, loading } = useAuth();
  const { colors, typography } = useTheme();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    (async () => {
      const v = await storage.getItem<string>(ONBOARDING_KEY, "");
      setOnboarded(v === "true");
    })();
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withDelay(150, withTiming(1, { duration: 400 }));
  }, [opacity, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!loading && onboarded !== null) {
    if (user) return <Redirect href="/(tabs)" />;
    if (!onboarded) return <Redirect href="/onboarding" />;
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]} testID="splash-screen">
      <LinearGradient colors={[colors.brandPrimary + "22", "transparent"]} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[styles.logo, logoStyle]}>
        <LinearGradient colors={[colors.brand, colors.brandPrimary]} style={styles.logoInner}>
          <Text style={[styles.logoText, { color: colors.onBrandPrimary, fontWeight: typography.weight.heavy }]}>A</Text>
        </LinearGradient>
        <Text style={[styles.brand, { color: colors.onSurface, letterSpacing: -0.5 }]}>ASA Connect</Text>
        <Text style={[styles.tagline, { color: colors.onSurfaceTertiary }]}>Conecte-se ao seu futuro</Text>
      </Animated.View>
      <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { alignItems: "center" },
  logoInner: {
    width: 96, height: 96, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 20,
    shadowColor: "#10B981", shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  logoText: { fontSize: 48, fontWeight: "800" },
  brand: { fontSize: 32, fontWeight: "800" },
  tagline: { fontSize: 15, marginTop: 6 },
});
