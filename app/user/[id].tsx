import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { companyById, userById } from "@/src/services/mock-data";
import { degreesBetween, shortestPath, formatPathNames } from "@/src/services/graph";
import { useTheme } from "@/src/theme/ThemeContext";

export default function UserPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, radius } = useTheme();
  const router = useRouter();
  const u = userById(id ?? "");
  if (!u) return null;
  const co = u.companyCurrent ? companyById(u.companyCurrent) : null;
  const deg = degreesBetween("u_me", u.id);
  const path = shortestPath("u_me", u.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]} testID={`user-screen-${u.id}`}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={[colors.brandPrimary, colors.brand]} style={{ paddingTop: 20, paddingBottom: 40 }}>
          <View style={{ flexDirection: "row", paddingHorizontal: 12 }}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} testID="user-back-button">
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>
        <View style={{ paddingHorizontal: 20, marginTop: -40, alignItems: "center" }}>
          <View style={{ padding: 4, borderRadius: 60, backgroundColor: colors.surface }}>
            <Image source={{ uri: u.avatarUrl }} style={{ width: 96, height: 96, borderRadius: 48 }} contentFit="cover" />
          </View>
          <Text style={{ color: colors.onSurface, fontSize: 22, fontWeight: typography.weight.heavy, marginTop: 10, letterSpacing: -0.3 }}>{u.name}</Text>
          <Text style={{ color: colors.onSurfaceTertiary, fontSize: 13 }}>{u.handle} • {u.course}</Text>
          {co && <Text style={{ color: colors.brandPrimary, fontSize: 13, fontWeight: typography.weight.bold, marginTop: 4 }}>{co.name}</Text>}

          {deg !== null && path && (
            <View style={{ marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: colors.brandSecondary, alignSelf: "stretch" }} testID="user-path-card">
              <Text style={{ color: colors.onBrandSecondary, fontWeight: typography.weight.bold, fontSize: 14, textAlign: "center" }}>
                Vocês estão a {deg} conexão{deg === 1 ? "" : "ões"}
              </Text>
              <Text style={{ color: colors.onBrandSecondary, fontSize: 12, textAlign: "center", opacity: 0.8, marginTop: 4 }}>{formatPathNames(path)}</Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14, alignSelf: "stretch" }}>
            <Pressable style={{ flex: 1, backgroundColor: colors.brandPrimary, paddingVertical: 12, borderRadius: radius.md, alignItems: "center" }} testID="user-connect-button">
              <Text style={{ color: colors.onBrandPrimary, fontWeight: typography.weight.bold, fontSize: 14 }}>+ Conectar</Text>
            </Pressable>
            <Pressable style={{ paddingHorizontal: 18, backgroundColor: colors.surfaceSecondary, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 6 }} testID="user-message-button">
              <Ionicons name="chatbubbles-outline" size={16} color={colors.onSurface} />
              <Text style={{ color: colors.onSurface, fontWeight: typography.weight.bold, fontSize: 13 }}>Msg</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 20, alignSelf: "stretch" }}>
            <Text style={{ color: colors.onSurface, fontSize: 15, fontWeight: typography.weight.bold, marginBottom: 10 }}>Bio</Text>
            <Text style={{ color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 22 }}>{u.bio}</Text>
          </View>

          <View style={{ marginTop: 20, alignSelf: "stretch" }}>
            <Text style={{ color: colors.onSurface, fontSize: 15, fontWeight: typography.weight.bold, marginBottom: 10 }}>Skills</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {u.skills.map((s) => (
                <View key={s} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: typography.weight.medium }}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
});
