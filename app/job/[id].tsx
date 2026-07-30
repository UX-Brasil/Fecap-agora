import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { companyById, jobById } from "@/src/services/mock-data";
import { companyPathSummary } from "@/src/services/graph";
import { useTheme } from "@/src/theme/ThemeContext";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, typography, radius, spacing } = useTheme();
  const router = useRouter();
  const job = jobById(id ?? "");
  if (!job) return null;
  const co = companyById(job.companyId)!;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]} testID={`job-screen-${job.id}`}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Hero */}
        <View style={{ height: 220 }}>
          <Image source={{ uri: co.coverUrl }} style={StyleSheet.absoluteFillObject as any} contentFit="cover" />
          <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent", "rgba(0,0,0,0.85)"]} style={StyleSheet.absoluteFillObject} />
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="job-back-button">
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <View style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: co.color, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>{co.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.4 }}>{job.title}</Text>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{co.name} • {job.location}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ padding: 20 }}>
          {/* Match & path */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, padding: 12, backgroundColor: colors.brandSecondary, borderRadius: radius.md, alignItems: "center" }}>
              <Text style={{ color: colors.onBrandSecondary, fontWeight: typography.weight.heavy, fontSize: 22 }}>{job.matchScore}%</Text>
              <Text style={{ color: colors.onBrandSecondary, fontSize: 11 }}>Match</Text>
            </View>
            <View style={{ flex: 2, padding: 12, backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, justifyContent: "center" }} testID="job-path-card">
              <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: typography.weight.semibold }}>{companyPathSummary("u_me", co.id)}</Text>
            </View>
          </View>

          {/* Chips */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
            <Chip icon="cash" label={job.salary} />
            <Chip icon="briefcase" label={job.seniority} />
            <Chip icon="location" label={job.workModel} />
          </View>

          {/* Description */}
          <Section title="Descrição da vaga">
            <Text style={{ color: colors.onSurfaceSecondary, fontSize: 14, lineHeight: 22 }}>{job.description}</Text>
          </Section>

          {/* Skills */}
          <Section title="Skills necessárias">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {job.skills.map((s) => (
                <View key={s} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1 }}>
                  <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: typography.weight.medium }}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>

          {/* Benefits */}
          <Section title="Benefícios">
            {job.benefits.map((b) => (
              <View key={b} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
                <Ionicons name="checkmark-circle" size={16} color={colors.brandPrimary} />
                <Text style={{ color: colors.onSurfaceSecondary, fontSize: 14 }}>{b}</Text>
              </View>
            ))}
          </Section>
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 34, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", gap: 10 }}>
        <Pressable style={{ paddingHorizontal: 20, backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, alignItems: "center", justifyContent: "center" }} testID="job-save-button">
          <Ionicons name="bookmark-outline" size={20} color={colors.onSurface} />
        </Pressable>
        <Pressable style={{ flex: 1, backgroundColor: colors.brandPrimary, paddingVertical: 14, borderRadius: radius.md, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }} testID="job-apply-button">
          <Text style={{ color: colors.onBrandPrimary, fontWeight: typography.weight.bold, fontSize: 15 }}>Candidatar-se agora</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.onBrandPrimary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ color: colors.onSurface, fontSize: 15, fontWeight: typography.weight.bold, marginBottom: 10 }}>{title}</Text>
      {children}
    </View>
  );
}
function Chip({ icon, label }: { icon: any; label: string }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1 }}>
      <Ionicons name={icon} size={12} color={colors.brandPrimary} />
      <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: typography.weight.semibold, textTransform: "capitalize" }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: { position: "absolute", top: 12, left: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
});
