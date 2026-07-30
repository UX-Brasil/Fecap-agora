import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
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
import { getProgress, RANKS, XP_RULES } from "@/src/services/gamification";

const LIGHT = { background: "#F5F5F5", surface: "#FFFFFF", surfaceAlt: "#E9FFFC", primary: "#00D9CC", primaryStrong: "#007F78", text: "#101414", muted: "#66706F", border: "#DDE7E5", track: "#D6E4E1" };
const DARK = { background: "#07110F", surface: "#0E1B18", surfaceAlt: "#12312B", primary: "#00FFEF", primaryStrong: "#80FFF7", text: "#F3FFFD", muted: "#9AAEAA", border: "#203A35", track: "#24413B" };

const rankIcon = (rankId: string): keyof typeof Ionicons.glyphMap => {
  switch (rankId) {
    case "comerciante": return "cash-outline";
    case "rei": return "diamond-outline";
    case "semideus": return "flash-outline";
    case "tita": return "earth-outline";
    case "alvarista": return "sparkles-outline";
    default: return "bag-handle-outline";
  }
};

const XP_ACTIVITIES = [
  { key: "DAILY_LOGIN" as const, icon: "calendar-outline" as const, label: "Login diário", detail: "Uma vez por dia" },
  { key: "FEED_PARTICIPATION" as const, icon: "heart-outline" as const, label: "Participar do feed", detail: "Até 3 vezes por dia" },
  { key: "FRIEND_ADDED" as const, icon: "person-add-outline" as const, label: "Nova conexão aceita", detail: "Até 5 vezes por dia" },
  { key: "EVENT_ATTENDANCE" as const, icon: "mic-outline" as const, label: "Participar de palestra", detail: "Presença confirmada" },
  { key: "COURSE_ENROLLMENT" as const, icon: "school-outline" as const, label: "Inscrever-se em curso", detail: "Inscrição confirmada" },
  { key: "PROFILE_COMPLETED" as const, icon: "checkmark-circle-outline" as const, label: "Completar o perfil", detail: "Conquista única" },
];

export default function ProgressScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const colors = isDark ? DARK : LIGHT;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = USERS.find((item) => item.isMe) ?? USERS[0];
  const progress = getProgress(user.xp ?? 0);
  const nextRank = RANKS.find((rank) => rank.order === progress.rank.order + 1);
  const xpUntilNextLevel = Math.max(0, progress.nextLevelXp - progress.xp);
  const xpUntilNextRank = nextRank ? Math.max(0, nextRank.minXp - progress.xp) : 0;
  const streak = 7;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Minha progressão</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/rewards")}>
            <Ionicons name="gift-outline" size={21} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.rankIconLarge}>
              <Ionicons name={rankIcon(progress.rank.id)} size={35} color="#042421" />
            </View>
            <View style={styles.heroTitleBlock}>
              <Text style={styles.eyebrow}>RANK ATUAL</Text>
              <Text style={styles.rankName}>{progress.rank.name}</Text>
              <Text style={styles.rarity}>{progress.rank.rarity} · {progress.rank.symbol}</Text>
            </View>
            <View style={styles.levelBubble}>
              <Text style={styles.levelLabel}>NÍVEL</Text>
              <Text style={styles.levelValue}>{progress.level}</Text>
            </View>
          </View>

          <View style={styles.xpLine}>
            <Text style={styles.xpValue}>{progress.xp.toLocaleString("pt-BR")} XP</Text>
            <Text style={styles.xpGoal}>{progress.nextLevelXp.toLocaleString("pt-BR")} XP</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(3, progress.levelProgress * 100)}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            {progress.isMaxLevel ? "Você chegou ao nível máximo." : `Faltam ${xpUntilNextLevel.toLocaleString("pt-BR")} XP para o próximo nível.`}
          </Text>

          {nextRank && (
            <View style={styles.nextRankBox}>
              <View style={styles.nextRankLeft}>
                <Ionicons name={rankIcon(nextRank.id)} size={21} color={colors.primaryStrong} />
                <View>
                  <Text style={styles.nextRankLabel}>PRÓXIMO RANK</Text>
                  <Text style={styles.nextRankName}>{nextRank.name}</Text>
                </View>
              </View>
              <Text style={styles.nextRankXp}>{xpUntilNextRank.toLocaleString("pt-BR")} XP restantes</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}><Ionicons name="flame" size={22} color={colors.primaryStrong} /></View>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>dias de sequência</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}><Ionicons name="ribbon-outline" size={22} color={colors.primaryStrong} /></View>
            <Text style={styles.statValue}>{user.badges?.length ?? 0}</Text>
            <Text style={styles.statLabel}>conquistas</Text>
          </View>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push("/(tabs)/ranking")}> 
            <View style={styles.statIcon}><Ionicons name="podium-outline" size={22} color={colors.primaryStrong} /></View>
            <Text style={styles.statValue}>#{[...USERS].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0)).findIndex((item) => item.isMe) + 1}</Text>
            <Text style={styles.statLabel}>ranking geral</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Jornada de ranks</Text>
          <Text style={styles.sectionMeta}>6 etapas</Text>
        </View>
        <View style={styles.rankJourney}>
          {RANKS.map((rank, index) => {
            const completed = progress.xp >= rank.minXp;
            const current = rank.id === progress.rank.id;
            return (
              <View key={rank.id} style={styles.rankStep}>
                <View style={styles.rankTimelineColumn}>
                  <View style={[styles.rankDot, completed && styles.rankDotCompleted, current && styles.rankDotCurrent]}>
                    <Ionicons name={rankIcon(rank.id)} size={16} color={completed ? "#042421" : colors.muted} />
                  </View>
                  {index < RANKS.length - 1 && <View style={[styles.rankLine, completed && styles.rankLineCompleted]} />}
                </View>
                <View style={[styles.rankStepCard, current && styles.rankStepCardCurrent]}>
                  <View style={styles.rankStepMain}>
                    <Text style={styles.rankStepName}>{rank.name}</Text>
                    <Text style={styles.rankStepMeta}>{rank.rarity} · {rank.symbol}</Text>
                  </View>
                  <Text style={[styles.rankStepXp, current && styles.rankStepXpCurrent]}>
                    {rank.minXp.toLocaleString("pt-BR")} XP
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Como ganhar XP</Text>
          <Text style={styles.sectionMeta}>ações válidas</Text>
        </View>
        <View style={styles.activityList}>
          {XP_ACTIVITIES.map((activity, index) => (
            <View key={activity.key} style={[styles.activityRow, index < XP_ACTIVITIES.length - 1 && styles.activityBorder]}>
              <View style={styles.activityIcon}>
                <Ionicons name={activity.icon} size={21} color={colors.primaryStrong} />
              </View>
              <View style={styles.activityMain}>
                <Text style={styles.activityTitle}>{activity.label}</Text>
                <Text style={styles.activityDetail}>{activity.detail}</Text>
              </View>
              <Text style={styles.activityXp}>+{XP_RULES[activity.key].xp} XP</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.rewardsButton} onPress={() => router.push("/rewards")}> 
          <View style={styles.rewardsButtonIcon}><Ionicons name="gift" size={22} color="#042421" /></View>
          <View style={styles.rewardsButtonMain}>
            <Text style={styles.rewardsButtonTitle}>Ver recompensas</Text>
            <Text style={styles.rewardsButtonText}>Descubra o que seu progresso já desbloqueou.</Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color={colors.primaryStrong} />
        </TouchableOpacity>
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
    heroCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 20 },
    heroHeader: { flexDirection: "row", alignItems: "center", gap: 13 },
    rankIconLarge: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    heroTitleBlock: { flex: 1 },
    eyebrow: { color: colors.primaryStrong, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
    rankName: { color: colors.text, fontSize: 25, fontWeight: "900", marginTop: 2 },
    rarity: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 2 },
    levelBubble: { width: 59, height: 59, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
    levelLabel: { color: colors.muted, fontSize: 8, fontWeight: "900" },
    levelValue: { color: colors.primaryStrong, fontSize: 22, fontWeight: "900" },
    xpLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 23, marginBottom: 8 },
    xpValue: { color: colors.text, fontSize: 14, fontWeight: "900" },
    xpGoal: { color: colors.muted, fontSize: 12, fontWeight: "700" },
    progressTrack: { height: 11, borderRadius: 999, backgroundColor: colors.track, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 999, backgroundColor: colors.primary },
    progressHint: { color: colors.muted, fontSize: 11, marginTop: 8 },
    nextRankBox: { marginTop: 18, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    nextRankLeft: { flexDirection: "row", alignItems: "center", gap: 9 },
    nextRankLabel: { color: colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
    nextRankName: { color: colors.text, fontSize: 13, fontWeight: "900", marginTop: 1 },
    nextRankXp: { color: colors.primaryStrong, fontSize: 11, fontWeight: "900" },
    statsRow: { flexDirection: "row", gap: 9, marginTop: 13 },
    statCard: { flex: 1, minHeight: 118, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", padding: 10 },
    statIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
    statValue: { color: colors.text, fontSize: 20, fontWeight: "900", marginTop: 7 },
    statLabel: { color: colors.muted, fontSize: 9, textAlign: "center", marginTop: 2 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 26, marginBottom: 11 },
    sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "900" },
    sectionMeta: { color: colors.muted, fontSize: 11, fontWeight: "700" },
    rankJourney: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 15 },
    rankStep: { flexDirection: "row", minHeight: 69 },
    rankTimelineColumn: { width: 36, alignItems: "center" },
    rankDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", zIndex: 2 },
    rankDotCompleted: { backgroundColor: colors.primary, borderColor: colors.primary },
    rankDotCurrent: { borderWidth: 4, borderColor: colors.primaryStrong },
    rankLine: { width: 2, flex: 1, backgroundColor: colors.border },
    rankLineCompleted: { backgroundColor: colors.primary },
    rankStepCard: { flex: 1, height: 53, marginLeft: 9, borderRadius: 15, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    rankStepCardCurrent: { backgroundColor: colors.surfaceAlt },
    rankStepMain: { flex: 1 },
    rankStepName: { color: colors.text, fontSize: 14, fontWeight: "900" },
    rankStepMeta: { color: colors.muted, fontSize: 10, marginTop: 2 },
    rankStepXp: { color: colors.muted, fontSize: 10, fontWeight: "800" },
    rankStepXpCurrent: { color: colors.primaryStrong },
    activityList: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    activityRow: { minHeight: 71, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 11 },
    activityBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    activityIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
    activityMain: { flex: 1 },
    activityTitle: { color: colors.text, fontSize: 13, fontWeight: "800" },
    activityDetail: { color: colors.muted, fontSize: 10, marginTop: 3 },
    activityXp: { color: colors.primaryStrong, fontSize: 12, fontWeight: "900" },
    rewardsButton: { marginTop: 17, minHeight: 78, backgroundColor: colors.surfaceAlt, borderRadius: 20, borderWidth: 1, borderColor: colors.primary, flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
    rewardsButtonIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    rewardsButtonMain: { flex: 1 },
    rewardsButtonTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
    rewardsButtonText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  });
}
