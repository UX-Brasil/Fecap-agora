import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EVENTS, companyById } from "@/src/services/mock-data";
import { useTheme } from "@/src/theme/ThemeContext";

export default function Events() {
  const { colors, typography, radius } = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]} testID="events-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }} testID="events-back-button">
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={{ color: colors.onSurface, fontSize: 20, fontWeight: typography.weight.heavy, marginLeft: 8, letterSpacing: -0.3 }}>Eventos</Text>
      </View>
      <FlatList
        data={EVENTS}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const co = item.companyId ? companyById(item.companyId) : null;
          return (
            <Pressable onPress={() => co && router.push(`/company/${co.id}`)} style={{ borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surfaceSecondary }} testID={`event-${item.id}`}>
              <View style={{ height: 140 }}>
                <Image source={{ uri: item.coverUrl }} style={StyleSheet.absoluteFillObject as any} contentFit="cover" />
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={StyleSheet.absoluteFillObject} />
                <View style={{ position: "absolute", top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#10B981" }}>
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>{item.kind}</Text>
                </View>
                <View style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 }}>{item.title}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 }}>{new Date(item.date).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} • {item.location}</Text>
                </View>
              </View>
              <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Ionicons name="people" size={16} color={colors.brandPrimary} />
                <Text style={{ color: colors.onSurface, fontSize: 13, flex: 1 }}>{item.attendees} inscritos</Text>
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.brandPrimary }}>
                  <Text style={{ color: colors.onBrandPrimary, fontSize: 12, fontWeight: typography.weight.bold }}>RSVP</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 12 },
});
