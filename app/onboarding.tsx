import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/ThemeContext";
import { storage } from "@/src/utils/storage";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "flash" as const,
    title: "Descubra oportunidades",
    subtitle: "Stories das principais empresas do país, atualizados em tempo real. Vagas, hackathons e eventos ao seu alcance.",
    color1: "#10B981",
    color2: "#059669",
  },
  {
    icon: "flame" as const,
    title: "Match inteligente",
    subtitle: "Swipe em vagas como no Tinder. Nossa IA aprende seus interesses a cada like e sugere o que faz sentido pra você.",
    color1: "#F59E0B",
    color2: "#EF4444",
  },
  {
    icon: "git-network" as const,
    title: "Grafo de conexões",
    subtitle: "Veja em quantos passos você chega a qualquer profissional. Solicite apresentações e cresça sua rede FECAP.",
    color1: "#3B82F6",
    color2: "#8B5CF6",
  },
];

export default function Onboarding() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const finish = async () => {
    await storage.setItem("asa_onboarded", "true");
    router.replace("/(auth)/login");
  };

  const next = () => {
    if (index === SLIDES.length - 1) return finish();
    const ni = index + 1;
    setIndex(ni);
    listRef.current?.scrollToIndex({ index: ni, animated: true });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.surface }]} edges={["top", "bottom"]} testID="onboarding-screen">
      <TouchableOpacity onPress={finish} style={styles.skip} testID="onboarding-skip">
        <Text style={{ color: colors.onSurfaceTertiary, fontWeight: typography.weight.medium, fontSize: 14 }}>Pular</Text>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <LinearGradient colors={[item.color1, item.color2]} style={styles.iconWrap}>
              <Ionicons name={item.icon} size={72} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.title, { color: colors.onSurface, letterSpacing: -0.5 }]}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? colors.brandPrimary : colors.border,
                width: i === index ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity onPress={next} activeOpacity={0.85} style={[styles.cta, { backgroundColor: colors.brandPrimary, marginHorizontal: spacing.xl, borderRadius: radius.lg }]} testID="onboarding-next">
        <Text style={{ color: colors.onBrandPrimary, fontWeight: typography.weight.bold, fontSize: 16 }}>
          {index === SLIDES.length - 1 ? "Começar" : "Continuar"}
        </Text>
        <Ionicons name="arrow-forward" size={18} color={colors.onBrandPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  skip: { alignSelf: "flex-end", padding: 20 },
  slide: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconWrap: { width: 160, height: 160, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 48 },
  title: { fontSize: 30, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: "center", lineHeight: 24, maxWidth: 320 },
  dots: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 24 },
  dot: { height: 8, borderRadius: 4 },
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 56, marginTop: 24, marginBottom: 8 },
});
