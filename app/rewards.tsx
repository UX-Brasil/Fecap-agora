import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { USERS } from "@/src/services/mock-data";
import { getProgress } from "@/src/services/gamification";

type RewardStatus = "locked" | "available" | "requested" | "approved" | "claimed";

type Reward = {
  id: string;
  title: string;
  description: string;
  xpRequired: number;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
  featured?: boolean;
};

const STORAGE_KEY = "@asa-connect/reward-statuses";

const REWARDS: Reward[] = [
  { id: "r1", title: "Badge Viajante", description: "Distintivo exclusivo para exibir no seu perfil.", xpRequired: 500, icon: "bag-handle-outline", category: "Perfil" },
  { id: "r2", title: "Workshop de carreira", description: "Acesso a uma oficina de currículo e entrevistas.", xpRequired: 1500, icon: "school-outline", category: "Formação", featured: true },
  { id: "r3", title: "Mentoria com alumni", description: "Sessão de mentoria com um ex-aluno da sua área.", xpRequired: 3000, icon: "people-outline", category: "Networking", featured: true },
  { id: "r4", title: "Ingresso para palestra", description: "Prioridade em uma palestra selecionada pela FECAP.", xpRequired: 5000, icon: "mic-outline", category: "Evento" },
  { id: "r5", title: "Curso parceiro", description: "Vaga patrocinada em um curso disponível no catálogo.", xpRequired: 9000, icon: "library-outline", category: "Formação" },
  { id: "r6", title: "Visita técnica", description: "Participação em uma visita a uma empresa parceira.", xpRequired: 13000, icon: "business-outline", category: "Experiência", featured: true },
  { id: "r7", title: "Conversa com recrutador", description: "Encontro orientativo com recrutamento de empresa parceira.", xpRequired: 17000, icon: "briefcase-outline", category: "Carreira" },
];

const LIGHT = { background: "#F5F5F5", surface: "#FFFFFF", surfaceAlt: "#E9FFFC", primary: "#00D9CC", primaryStrong: "#007F78", text: "#101414", muted: "#66706F", border: "#DDE7E5", danger: "#B54747" };
const DARK = { background: "#07110F", surface: "#0E1B18", surfaceAlt: "#12312B", primary: "#00FFEF", primaryStrong: "#80FFF7", text: "#F3FFFD", muted: "#9AAEAA", border: "#203A35", danger: "#FF9A9A" };

export default function RewardsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DARK : LIGHT;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentUser = USERS.find((user) => user.isMe) ?? USERS[0];
  const progress = getProgress(currentUser.xp ?? 0);
  const [statuses, setStatuses] = useState<Record<string, RewardStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) setStatuses(JSON.parse(value));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const getStatus = (reward: Reward): RewardStatus => {
    const stored = statuses[reward.id];
    if (stored) return stored;
    return progress.xp >= reward.xpRequired ? "available" : "locked";
  };

  const requestReward = (reward: Reward) => {
    Alert.alert(
      "Solicitar recompensa?",
      "A solicitação será enviada para validação da FECAP. O XP não será descontado neste protótipo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Solicitar",
          onPress: async () => {
            const next = { ...statuses, [reward.id]: "requested" as RewardStatus };
            setStatuses(next);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          },
        },
      ],
    );
  };

  const statusLabel = (status: RewardStatus) => {
    if (status === "requested") return "Em análise";
    if (status === "approved") return "Aprovada";
    if (status === "claimed") return "Resgatada";
    if (status === "available") return "Disponível";
    return "Bloqueada";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recompensas</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/profile/progress")}>
            <Ionicons name="stats-chart-outline" size={21} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="gift" size={28} color="#042421" />
            </View>
            <View style={styles.heroMain}>
              <Text style={styles.heroLabel}>SEU SALDO DE PROGRESSO</Text>
              <Text style={styles.heroXp}>{progress.xp.toLocaleString("pt-BR")} XP</Text>
            </View>
          </View>
          <Text style={styles.heroText}>Seu XP desbloqueia recompensas, mas não é consumido ao solicitar um benefício.</Text>
          <View style={styles.heroFooter}>
            <Text style={styles.heroRank}>{progress.rank.name} · nível {progress.level}</Text>
            <TouchableOpacity onPress={() => router.push("/profile/progress")}>
              <Text style={styles.heroLink}>Ver progresso</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={21} color={colors.primaryStrong} />
          <Text style={styles.noticeText}>Recompensas físicas ou pagas dependem de aprovação da FECAP e disponibilidade.</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Catálogo</Text>
          <Text style={styles.sectionMeta}>{REWARDS.length} recompensas</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}><Text style={styles.loadingText}>Carregando recompensas...</Text></View>
        ) : (
          REWARDS.map((reward) => {
            const status = getStatus(reward);
            const locked = status === "locked";
            const available = status === "available";
            const missingXp = Math.max(0, reward.xpRequired - progress.xp);

            return (
              <View key={reward.id} style={[styles.rewardCard, reward.featured && styles.rewardFeatured, locked && styles.rewardLocked]}>
                <View style={styles.rewardTop}>
                  <View style={[styles.rewardIcon, locked && styles.rewardIconLocked]}>
                    <Ionicons name={locked ? "lock-closed-outline" : reward.icon} size={25} color={locked ? colors.muted : colors.primaryStrong} />
                  </View>
                  <View style={styles.rewardMain}>
                    <View style={styles.rewardTitleLine}>
                      <Text style={styles.rewardTitle}>{reward.title}</Text>
                      {reward.featured && <Text style={styles.featuredTag}>DESTAQUE</Text>}
                    </View>
                    <Text style={styles.rewardCategory}>{reward.category}</Text>
                  </View>
                  <View style={[styles.statusPill, available && styles.statusPillAvailable]}>
                    <Text style={[styles.statusText, available && styles.statusTextAvailable]}>{statusLabel(status)}</Text>
                  </View>
                </View>
                <Text style={styles.rewardDescription}>{reward.description}</Text>
                <View style={styles.rewardFooter}>
                  <View>
                    <Text style={styles.requirementLabel}>REQUISITO</Text>
                    <Text style={styles.requirementValue}>{reward.xpRequired.toLocaleString("pt-BR")} XP</Text>
                  </View>
                  {available ? (
                    <TouchableOpacity style={styles.primaryButton} onPress={() => requestReward(reward)}>
                      <Text style={styles.primaryButtonText}>Solicitar</Text>
                    </TouchableOpacity>
                  ) : status === "requested" ? (
                    <View style={styles.pendingButton}>
                      <Ionicons name="time-outline" size={16} color={colors.primaryStrong} />
                      <Text style={styles.pendingButtonText}>Em análise</Text>
                    </View>
                  ) : locked ? (
                    <Text style={styles.missingXp}>Faltam {missingXp.toLocaleString("pt-BR")} XP</Text>
                  ) : (
                    <Text style={styles.completedText}>{statusLabel(status)}</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: typeof LIGHT) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 42 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
    headerTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
    iconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    hero: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.primary, borderRadius: 24, padding: 20 },
    heroTop: { flexDirection: "row", alignItems: "center", gap: 14 },
    heroIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    heroMain: { flex: 1 },
    heroLabel: { color: colors.primaryStrong, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
    heroXp: { color: colors.text, fontSize: 28, fontWeight: "900", marginTop: 2 },
    heroText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 16 },
    heroFooter: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 16, paddingTop: 14, flexDirection: "row", justifyContent: "space-between" },
    heroRank: { color: colors.text, fontSize: 13, fontWeight: "800" },
    heroLink: { color: colors.primaryStrong, fontSize: 13, fontWeight: "900" },
    notice: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    noticeText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 26, marginBottom: 11 },
    sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "900" },
    sectionMeta: { color: colors.muted, fontSize: 12, fontWeight: "600" },
    loadingCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 30, alignItems: "center" },
    loadingText: { color: colors.muted },
    rewardCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
    rewardFeatured: { borderColor: colors.primary },
    rewardLocked: { opacity: 0.72 },
    rewardTop: { flexDirection: "row", alignItems: "center", gap: 11 },
    rewardIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
    rewardIconLocked: { backgroundColor: colors.background },
    rewardMain: { flex: 1 },
    rewardTitleLine: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
    rewardTitle: { color: colors.text, fontSize: 15, fontWeight: "900" },
    featuredTag: { color: "#042421", backgroundColor: colors.primary, fontSize: 8, fontWeight: "900", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5, overflow: "hidden" },
    rewardCategory: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 3 },
    statusPill: { backgroundColor: colors.background, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
    statusPillAvailable: { backgroundColor: colors.surfaceAlt },
    statusText: { color: colors.muted, fontSize: 9, fontWeight: "900" },
    statusTextAvailable: { color: colors.primaryStrong },
    rewardDescription: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 13 },
    rewardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
    requirementLabel: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
    requirementValue: { color: colors.text, fontSize: 14, fontWeight: "900", marginTop: 2 },
    primaryButton: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 17, paddingVertical: 11 },
    primaryButtonText: { color: "#042421", fontSize: 12, fontWeight: "900" },
    pendingButton: { flexDirection: "row", gap: 5, alignItems: "center", backgroundColor: colors.surfaceAlt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
    pendingButtonText: { color: colors.primaryStrong, fontSize: 11, fontWeight: "900" },
    missingXp: { color: colors.muted, fontSize: 11, fontWeight: "800" },
    completedText: { color: colors.primaryStrong, fontSize: 12, fontWeight: "900" },
  });
}
