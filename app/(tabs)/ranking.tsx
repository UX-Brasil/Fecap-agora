// app/(tabs)/ranking.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getProgress } from "@/src/services/gamification";
import { USERS } from "@/src/services/mock-data";
import { useTheme } from "@/src/theme/ThemeContext";

type RankingFilter = "geral" | "estudantes" | "alumni";

type RankingEntry = {
  user: (typeof USERS)[number];
  progress: ReturnType<typeof getProgress>;
  position: number;
};

type IoniconName = keyof typeof Ionicons.glyphMap;

const WEB_CONTENT_MAX_WIDTH = 1180;
const MOBILE_TABBAR_SPACE = 108;

const FILTERS: Array<{
  id: RankingFilter;
  label: string;
  icon: IoniconName;
}> = [
  {
    id: "geral",
    label: "Geral",
    icon: "people-outline",
  },
  {
    id: "estudantes",
    label: "Estudantes",
    icon: "school-outline",
  },
  {
    id: "alumni",
    label: "Alumni",
    icon: "briefcase-outline",
  },
];

const rankIcon = (rankId: string): IoniconName => {
  switch (rankId) {
    case "comerciante":
      return "cash-outline";

    case "rei":
      return "diamond-outline";

    case "semideus":
      return "flash-outline";

    case "tita":
      return "earth-outline";

    case "alvarista":
      return "sparkles-outline";

    default:
      return "bag-handle-outline";
  }
};

const getFirstName = (name: string) => {
  return name.trim().split(/\s+/)[0] || name;
};

export default function RankingScreen() {
  const router = useRouter();

  const { colors, mode, typography, spacing, radius } = useTheme();

  const { width } = useWindowDimensions();

  const [filter, setFilter] = useState<RankingFilter>("geral");

  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width >= 960;
  const isSmallMobile = width < 380;

  const styles = useMemo(
    () =>
      createStyles({
        colors,
        typography,
        spacing,
        radius,
        isDesktop,
        isSmallMobile,
      }),
    [
      colors,
      typography,
      spacing,
      radius,
      isDesktop,
      isSmallMobile,
    ],
  );

  const medalColors = useMemo(
    () => ({
      gold: mode === "dark" ? "#F8D768" : "#D9A514",
      silver: mode === "dark" ? "#D3DEDC" : "#8E9897",
      bronze: mode === "dark" ? "#E4A171" : "#A96B3B",
    }),
    [mode],
  );

  const ranking = useMemo<RankingEntry[]>(() => {
    return USERS.filter((user) => {
      if (filter === "estudantes") {
        return user.role === "student";
      }

      if (filter === "alumni") {
        return user.role === "alumni";
      }

      return true;
    })
      .map((user) => ({
        user,
        progress: getProgress(user.xp ?? 0),
      }))
      .sort((a, b) => {
        if (b.progress.xp !== a.progress.xp) {
          return b.progress.xp - a.progress.xp;
        }

        return a.user.name.localeCompare(b.user.name, "pt-BR");
      })
      .map((entry, index) => ({
        ...entry,
        position: index + 1,
      }));
  }, [filter]);

  const currentUser = useMemo(
    () => ranking.find((entry) => entry.user.isMe),
    [ranking],
  );

  const podium = useMemo(() => ranking.slice(0, 3), [ranking]);

  const podiumDisplayOrder = useMemo(() => {
    if (podium.length === 1) {
      return [podium[0]];
    }

    if (podium.length === 2) {
      return [podium[1], podium[0]];
    }

    return [podium[1], podium[0], podium[2]];
  }, [podium]);

  const totalXp = useMemo(
    () =>
      ranking.reduce((total, entry) => {
        return total + entry.progress.xp;
      }, 0),
    [ranking],
  );

  const averageXp = ranking.length > 0 ? Math.round(totalXp / ranking.length) : 0;

  const handleOpenUser = (entry: RankingEntry) => {
    if (entry.user.isMe) {
      router.push("/profile/progress" as never);
      return;
    }

    router.push(`/user/${entry.user.id}` as never);
  };

  return (
    <SafeAreaView edges={["left", "right"]} style={styles.safeArea}>
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.surface}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageContainer}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <View style={styles.eyebrowContainer}>
                <View style={styles.eyebrowIcon}>
                  <Ionicons
                    name="game-controller"
                    size={14}
                    color={colors.brandPrimary}
                  />
                </View>

                <Text style={styles.eyebrow}>Fecap Ágora</Text>
              </View>

              <Text style={styles.title}>Ranking</Text>

              <Text style={styles.subtitle}>
                Acompanhe sua evolução, conquiste experiência e fique entre os
                destaques da comunidade FECAP.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir central de recompensas"
              onPress={() => router.push("/rewards" as never)}
              style={({ hovered, pressed }) => [
                styles.rewardsButton,
                hovered && styles.rewardsButtonHovered,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.rewardsButtonIcon}>
                <Ionicons
                  name="gift-outline"
                  size={21}
                  color={colors.brandPrimary}
                />
              </View>

              {isDesktop ? (
                <View>
                  <Text style={styles.rewardsButtonLabel}>Recompensas</Text>

                  <Text style={styles.rewardsButtonDescription}>
                    Veja suas conquistas
                  </Text>
                </View>
              ) : null}

              {isDesktop ? (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.onSurfaceTertiary}
                />
              ) : null}
            </Pressable>
          </View>

          <View style={styles.filtersContainer}>
            {FILTERS.map((item) => {
              const isActive = filter === item.id;

              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Filtrar ranking por ${item.label}`}
                  onPress={() => setFilter(item.id)}
                  style={({ hovered, pressed }) => [
                    styles.filterButton,
                    isActive && styles.filterButtonActive,
                    hovered && !isActive && styles.filterButtonHovered,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={17}
                    color={
                      isActive
                        ? colors.onBrandPrimary
                        : colors.onSurfaceTertiary
                    }
                  />

                  <Text
                    style={[
                      styles.filterButtonText,
                      isActive && styles.filterButtonTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {ranking.length > 0 ? (
            <>
              <View style={styles.overviewGrid}>
                <View style={styles.podiumCard}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardEyebrow}>DESTAQUES</Text>

                      <Text style={styles.cardTitle}>Pódio da comunidade</Text>
                    </View>

                    <View style={styles.trophyContainer}>
                      <Ionicons
                        name="trophy"
                        size={20}
                        color={medalColors.gold}
                      />
                    </View>
                  </View>

                  <View style={styles.podiumRow}>
                    {podiumDisplayOrder.map((entry) => {
                      const isWinner = entry.position === 1;

                      const medalColor =
                        entry.position === 1
                          ? medalColors.gold
                          : entry.position === 2
                            ? medalColors.silver
                            : medalColors.bronze;

                      return (
                        <Pressable
                          key={entry.user.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${entry.user.name}, posição ${entry.position}`}
                          onPress={() => handleOpenUser(entry)}
                          style={({ hovered, pressed }) => [
                            styles.podiumItem,
                            isWinner && styles.podiumWinner,
                            hovered && styles.podiumItemHovered,
                            pressed && styles.buttonPressed,
                          ]}
                        >
                          {isWinner ? (
                            <View style={styles.crownContainer}>
                              <Ionicons
                                name="crown"
                                size={19}
                                color={medalColors.gold}
                              />
                            </View>
                          ) : (
                            <View style={styles.crownPlaceholder} />
                          )}

                          <View
                            style={[
                              styles.podiumAvatarRing,
                              {
                                borderColor: medalColor,
                              },
                              isWinner && styles.podiumAvatarRingWinner,
                            ]}
                          >
                            {entry.user.avatarUrl ? (
                              <Image
                                source={{ uri: entry.user.avatarUrl }}
                                style={[
                                  styles.podiumAvatar,
                                  isWinner && styles.podiumAvatarWinner,
                                ]}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                style={[
                                  styles.podiumAvatar,
                                  styles.avatarFallback,
                                  isWinner && styles.podiumAvatarWinner,
                                ]}
                              >
                                <Text style={styles.avatarFallbackText}>
                                  {entry.user.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}

                            <View
                              style={[
                                styles.positionBadge,
                                {
                                  backgroundColor: medalColor,
                                },
                              ]}
                            >
                              <Text style={styles.positionBadgeText}>
                                {entry.position}
                              </Text>
                            </View>
                          </View>

                          <Text
                            numberOfLines={1}
                            style={styles.podiumName}
                          >
                            {entry.user.isMe
                              ? "Você"
                              : getFirstName(entry.user.name)}
                          </Text>

                          <Text style={styles.podiumXp}>
                            {entry.progress.xp.toLocaleString("pt-BR")} XP
                          </Text>

                          <View style={styles.rankPill}>
                            <Ionicons
                              name={rankIcon(entry.progress.rank.id)}
                              size={12}
                              color={colors.brandPrimary}
                            />

                            <Text
                              numberOfLines={1}
                              style={styles.rankPillText}
                            >
                              {entry.progress.rank.name}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.sideColumn}>
                  {currentUser ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Abrir meu progresso"
                      onPress={() =>
                        router.push("/profile/progress" as never)
                      }
                      style={({ hovered, pressed }) => [
                        styles.myPositionCard,
                        hovered && styles.myPositionCardHovered,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <View style={styles.myPositionHeader}>
                        <View style={styles.myPositionIcon}>
                          <Ionicons
                            name="trending-up"
                            size={22}
                            color={colors.brandPrimary}
                          />
                        </View>

                        <View style={styles.myPositionHeaderText}>
                          <Text style={styles.myPositionEyebrow}>
                            SUA POSIÇÃO
                          </Text>

                          <Text style={styles.myPositionTitle}>
                            #{currentUser.position} no ranking
                          </Text>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={colors.onSurfaceTertiary}
                        />
                      </View>

                      <View style={styles.myPositionInformation}>
                        <View style={styles.myPositionInformationItem}>
                          <Text style={styles.myPositionInformationLabel}>
                            Experiência
                          </Text>

                          <Text style={styles.myPositionInformationValue}>
                            {currentUser.progress.xp.toLocaleString("pt-BR")} XP
                          </Text>
                        </View>

                        <View style={styles.verticalDivider} />

                        <View style={styles.myPositionInformationItem}>
                          <Text style={styles.myPositionInformationLabel}>
                            Nível
                          </Text>

                          <Text style={styles.myPositionInformationValue}>
                            {currentUser.progress.level}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.currentRankContainer}>
                        <View style={styles.currentRankIcon}>
                          <Ionicons
                            name={rankIcon(currentUser.progress.rank.id)}
                            size={18}
                            color={colors.brandPrimary}
                          />
                        </View>

                        <View style={styles.currentRankText}>
                          <Text style={styles.currentRankLabel}>
                            Classificação atual
                          </Text>

                          <Text style={styles.currentRankValue}>
                            {currentUser.progress.rank.name}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ) : (
                    <View style={styles.filterNoticeCard}>
                      <View style={styles.filterNoticeIcon}>
                        <Ionicons
                          name="information-circle-outline"
                          size={23}
                          color={colors.brandPrimary}
                        />
                      </View>

                      <Text style={styles.filterNoticeTitle}>
                        Você não aparece neste filtro
                      </Text>

                      <Text style={styles.filterNoticeDescription}>
                        Selecione a categoria geral para visualizar sua posição
                        atual.
                      </Text>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setFilter("geral")}
                        style={({ hovered, pressed }) => [
                          styles.filterNoticeButton,
                          hovered && styles.filterNoticeButtonHovered,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.filterNoticeButtonText}>
                          Ver ranking geral
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  <View style={styles.statisticsGrid}>
                    <View style={styles.statisticCard}>
                      <View style={styles.statisticIcon}>
                        <Ionicons
                          name="people-outline"
                          size={18}
                          color={colors.brandPrimary}
                        />
                      </View>

                      <Text style={styles.statisticValue}>
                        {ranking.length.toLocaleString("pt-BR")}
                      </Text>

                      <Text style={styles.statisticLabel}>Participantes</Text>
                    </View>

                    <View style={styles.statisticCard}>
                      <View style={styles.statisticIcon}>
                        <Ionicons
                          name="flash-outline"
                          size={18}
                          color={colors.brandPrimary}
                        />
                      </View>

                      <Text style={styles.statisticValue}>
                        {averageXp.toLocaleString("pt-BR")}
                      </Text>

                      <Text style={styles.statisticLabel}>Média de XP</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.rankingSection}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionEyebrow}>COMUNIDADE</Text>

                    <Text style={styles.sectionTitle}>
                      Classificação completa
                    </Text>
                  </View>

                  <View style={styles.participantsBadge}>
                    <Ionicons
                      name="people-outline"
                      size={14}
                      color={colors.onSurfaceTertiary}
                    />

                    <Text style={styles.participantsBadgeText}>
                      {ranking.length}{" "}
                      {ranking.length === 1
                        ? "participante"
                        : "participantes"}
                    </Text>
                  </View>
                </View>

                <View style={styles.listCard}>
                  {ranking.map((entry, index) => {
                    const isTopThree = entry.position <= 3;

                    const medalColor =
                      entry.position === 1
                        ? medalColors.gold
                        : entry.position === 2
                          ? medalColors.silver
                          : medalColors.bronze;

                    return (
                      <Pressable
                        key={entry.user.id}
                        accessibilityRole="button"
                        accessibilityLabel={`Abrir perfil de ${entry.user.name}`}
                        onPress={() => handleOpenUser(entry)}
                        style={({ hovered, pressed }) => [
                          styles.rankingRow,
                          index < ranking.length - 1 &&
                            styles.rankingRowBorder,
                          entry.user.isMe && styles.rankingRowMe,
                          hovered && styles.rankingRowHovered,
                          pressed && styles.rankingRowPressed,
                        ]}
                      >
                        <View style={styles.rowPositionContainer}>
                          {isTopThree ? (
                            <View
                              style={[
                                styles.rowMedal,
                                {
                                  backgroundColor: `${medalColor}20`,
                                },
                              ]}
                            >
                              <Ionicons
                                name={
                                  entry.position === 1
                                    ? "trophy"
                                    : "medal-outline"
                                }
                                size={16}
                                color={medalColor}
                              />
                            </View>
                          ) : (
                            <Text style={styles.rowPosition}>
                              {entry.position}
                            </Text>
                          )}
                        </View>

                        <View style={styles.rowAvatarContainer}>
                          {entry.user.avatarUrl ? (
                            <Image
                              source={{ uri: entry.user.avatarUrl }}
                              style={styles.rowAvatar}
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={[
                                styles.rowAvatar,
                                styles.avatarFallback,
                              ]}
                            >
                              <Text style={styles.rowAvatarFallbackText}>
                                {entry.user.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}

                          {entry.user.isMe ? (
                            <View style={styles.meIndicator} />
                          ) : null}
                        </View>

                        <View style={styles.rowMain}>
                          <View style={styles.rowNameLine}>
                            <Text
                              numberOfLines={1}
                              style={styles.rowName}
                            >
                              {entry.user.isMe ? "Você" : entry.user.name}
                            </Text>

                            {entry.user.isMe ? (
                              <View style={styles.youTag}>
                                <Text style={styles.youTagText}>VOCÊ</Text>
                              </View>
                            ) : null}
                          </View>

                          <View style={styles.rowRankLine}>
                            <Ionicons
                              name={rankIcon(entry.progress.rank.id)}
                              size={13}
                              color={colors.onSurfaceTertiary}
                            />

                            <Text
                              numberOfLines={1}
                              style={styles.rowDescription}
                            >
                              {entry.progress.rank.name}
                              {" · "}
                              Nível {entry.progress.level}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.rowXpBlock}>
                          <Text style={styles.rowXp}>
                            {entry.progress.xp.toLocaleString("pt-BR")}
                          </Text>

                          <Text style={styles.rowXpLabel}>XP</Text>
                        </View>

                        {!isSmallMobile ? (
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.onSurfaceTertiary}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIcon}>
                <Ionicons
                  name="people-outline"
                  size={32}
                  color={colors.brandPrimary}
                />
              </View>

              <Text style={styles.emptyStateTitle}>
                Nenhum participante encontrado
              </Text>

              <Text style={styles.emptyStateDescription}>
                Ainda não existem participantes disponíveis para a categoria
                selecionada.
              </Text>

              {filter !== "geral" ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setFilter("geral")}
                  style={({ hovered, pressed }) => [
                    styles.emptyStateButton,
                    hovered && styles.emptyStateButtonHovered,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={17}
                    color={colors.onBrandPrimary}
                  />

                  <Text style={styles.emptyStateButtonText}>
                    Ver ranking geral
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type CreateStylesParams = {
  colors: ReturnType<typeof useTheme>["colors"];
  typography: ReturnType<typeof useTheme>["typography"];
  spacing: ReturnType<typeof useTheme>["spacing"];
  radius: ReturnType<typeof useTheme>["radius"];
  isDesktop: boolean;
  isSmallMobile: boolean;
};

function createStyles({
  colors,
  typography,
  spacing,
  radius,
  isDesktop,
  isSmallMobile,
}: CreateStylesParams) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },

    scrollContent: {
      flexGrow: 1,

      paddingBottom:
        Platform.OS === "web" ? 48 : MOBILE_TABBAR_SPACE,
    },

    pageContainer: {
      width: "100%",
      maxWidth: WEB_CONTENT_MAX_WIDTH,

      alignSelf: "center",

      paddingHorizontal: isDesktop ? 28 : 18,
      paddingTop: isDesktop ? 32 : 22,
    },

    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",

      gap: 18,
    },

    headerTextContainer: {
      flex: 1,
      minWidth: 0,
    },

    eyebrowContainer: {
      flexDirection: "row",
      alignItems: "center",

      gap: 7,

      marginBottom: 7,
    },

    eyebrowIcon: {
      width: 25,
      height: 25,

      borderRadius: 8,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: `${colors.brandPrimary}12`,
    },

    eyebrow: {
      color: colors.brandPrimary,

      fontSize: 11,
      lineHeight: 15,

      fontWeight: typography.weight.bold,

      letterSpacing: 1.3,
    },

    title: {
      color: colors.onSurface,

      fontSize: isDesktop ? 34 : 29,
      lineHeight: isDesktop ? 41 : 36,

      fontWeight: typography.weight.heavy,

      letterSpacing: -1,
    },

    subtitle: {
      maxWidth: 610,

      marginTop: 7,

      color: colors.onSurfaceSecondary,

      fontSize: isDesktop ? 14 : 13,
      lineHeight: isDesktop ? 21 : 20,
    },

    rewardsButton: {
      minWidth: isDesktop ? 202 : 46,
      height: isDesktop ? 56 : 46,

      paddingHorizontal: isDesktop ? 10 : 0,

      borderRadius: isDesktop ? 16 : 14,
      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.surfaceSecondary,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: isDesktop ? "flex-start" : "center",

      gap: 10,

      ...Platform.select({
        web: {
          cursor: "pointer",
        },
      }),
    },

    rewardsButtonHovered: {
      borderColor: `${colors.brandPrimary}55`,
      backgroundColor: `${colors.brandPrimary}08`,
    },

    rewardsButtonIcon: {
      width: isDesktop ? 38 : 44,
      height: isDesktop ? 38 : 44,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: `${colors.brandPrimary}12`,
    },

    rewardsButtonLabel: {
      color: colors.onSurface,

      fontSize: 12,
      lineHeight: 16,

      fontWeight: typography.weight.bold,
    },

    rewardsButtonDescription: {
      marginTop: 1,

      color: colors.onSurfaceTertiary,

      fontSize: 9,
      lineHeight: 12,
    },

    buttonPressed: {
      opacity: 0.72,

      transform: [
        {
          scale: 0.985,
        },
      ],
    },

    filtersContainer: {
      flexDirection: "row",
      alignItems: "center",

      alignSelf: isDesktop ? "flex-start" : "stretch",

      gap: 8,

      marginTop: 24,
      marginBottom: 18,

      padding: 4,

      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.surfaceSecondary,
    },

    filterButton: {
      minWidth: isDesktop ? 126 : undefined,
      minHeight: 42,

      flex: isDesktop ? undefined : 1,

      paddingHorizontal: isSmallMobile ? 8 : 14,

      borderRadius: 12,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: isSmallMobile ? 5 : 7,

      ...Platform.select({
        web: {
          cursor: "pointer",
        },
      }),
    },

    filterButtonActive: {
      backgroundColor: colors.brandPrimary,

      shadowColor: colors.brandPrimary,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.18,
      shadowRadius: 7,

      elevation: 3,
    },

    filterButtonHovered: {
      backgroundColor: colors.surface,
    },

    filterButtonText: {
      color: colors.onSurfaceSecondary,

      fontSize: isSmallMobile ? 11 : 12,
      lineHeight: 16,

      fontWeight: typography.weight.semibold,
    },

    filterButtonTextActive: {
      color: colors.onBrandPrimary,

      fontWeight: typography.weight.bold,
    },

    overviewGrid: {
      flexDirection: isDesktop ? "row" : "column",
      alignItems: "stretch",

      gap: 16,
    },

    podiumCard: {
      flex: isDesktop ? 1.5 : undefined,

      minHeight: isDesktop ? 370 : undefined,

      paddingHorizontal: isSmallMobile ? 10 : isDesktop ? 24 : 16,
      paddingTop: 20,
      paddingBottom: 20,

      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.surfaceSecondary,

      overflow: "hidden",
    },

    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      marginBottom: 18,
    },

    cardEyebrow: {
      color: colors.brandPrimary,

      fontSize: 9,
      lineHeight: 13,

      fontWeight: typography.weight.bold,

      letterSpacing: 1.1,
    },

    cardTitle: {
      marginTop: 3,

      color: colors.onSurface,

      fontSize: 17,
      lineHeight: 22,

      fontWeight: typography.weight.heavy,
    },

    trophyContainer: {
      width: 40,
      height: 40,

      borderRadius: 13,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    podiumRow: {
      flex: 1,

      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",

      gap: isDesktop ? 12 : 2,
    },

    podiumItem: {
      flex: 1,

      maxWidth: 190,
      minWidth: 0,

      alignItems: "center",

      paddingHorizontal: isSmallMobile ? 2 : 6,
      paddingVertical: 10,

      borderRadius: 18,

      ...Platform.select({
        web: {
          cursor: "pointer",
        },
      }),
    },

    podiumWinner: {
      paddingBottom: isDesktop ? 30 : 22,

      backgroundColor: `${colors.brandPrimary}06`,
    },

    podiumItemHovered: {
      backgroundColor: `${colors.brandPrimary}0A`,
    },

    crownContainer: {
      height: 26,

      alignItems: "center",
      justifyContent: "center",

      marginBottom: 4,
    },

    crownPlaceholder: {
      height: 30,
    },

    podiumAvatarRing: {
      position: "relative",

      padding: 3,

      borderRadius: 999,
      borderWidth: 3,

      backgroundColor: colors.surface,
    },

    podiumAvatarRingWinner: {
      borderWidth: 4,
    },

    podiumAvatar: {
      width: isSmallMobile ? 54 : isDesktop ? 76 : 64,
      height: isSmallMobile ? 54 : isDesktop ? 76 : 64,

      borderRadius: 999,

      backgroundColor: colors.border,
    },

    podiumAvatarWinner: {
      width: isSmallMobile ? 62 : isDesktop ? 88 : 74,
      height: isSmallMobile ? 62 : isDesktop ? 88 : 74,
    },

    avatarFallback: {
      alignItems: "center",
      justifyContent: "center",

      backgroundColor: `${colors.brandPrimary}16`,
    },

    avatarFallbackText: {
      color: colors.brandPrimary,

      fontSize: isDesktop ? 24 : 20,

      fontWeight: typography.weight.heavy,
    },

    positionBadge: {
      position: "absolute",

      bottom: -8,
      left: "50%",

      width: 26,
      height: 26,

      marginLeft: -13,

      borderRadius: 13,
      borderWidth: 2,
      borderColor: colors.surface,

      alignItems: "center",
      justifyContent: "center",
    },

    positionBadgeText: {
      color: "#111111",

      fontSize: 11,
      lineHeight: 14,

      fontWeight: "900",
    },

    podiumName: {
      maxWidth: "100%",

      marginTop: 17,

      color: colors.onSurface,

      fontSize: isSmallMobile ? 12 : 14,
      lineHeight: 18,

      fontWeight: typography.weight.bold,

      textAlign: "center",
    },

    podiumXp: {
      marginTop: 2,

      color: colors.onSurfaceSecondary,

      fontSize: isSmallMobile ? 10 : 11,
      lineHeight: 15,

      fontWeight: typography.weight.semibold,
    },

    rankPill: {
      maxWidth: "100%",

      marginTop: 8,
      paddingHorizontal: isSmallMobile ? 6 : 9,
      paddingVertical: 5,

      borderRadius: 999,

      flexDirection: "row",
      alignItems: "center",

      gap: 4,

      backgroundColor: `${colors.brandPrimary}10`,
    },

    rankPillText: {
      flexShrink: 1,

      color: colors.brandPrimary,

      fontSize: isSmallMobile ? 8 : 9,
      lineHeight: 12,

      fontWeight: typography.weight.bold,
    },

    sideColumn: {
      flex: isDesktop ? 0.86 : undefined,

      gap: 12,
    },

    myPositionCard: {
      flex: isDesktop ? 1 : undefined,

      padding: 18,

      borderRadius: 22,
      borderWidth: 1,
      borderColor: `${colors.brandPrimary}45`,

      backgroundColor: `${colors.brandPrimary}0B`,

      ...Platform.select({
        web: {
          cursor: "pointer",
        },
      }),
    },

    myPositionCardHovered: {
      borderColor: colors.brandPrimary,
      backgroundColor: `${colors.brandPrimary}10`,
    },

    myPositionHeader: {
      flexDirection: "row",
      alignItems: "center",

      gap: 11,
    },

    myPositionIcon: {
      width: 44,
      height: 44,

      borderRadius: 14,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    myPositionHeaderText: {
      flex: 1,
      minWidth: 0,
    },

    myPositionEyebrow: {
      color: colors.brandPrimary,

      fontSize: 9,
      lineHeight: 12,

      fontWeight: typography.weight.bold,

      letterSpacing: 1,
    },

    myPositionTitle: {
      marginTop: 2,

      color: colors.onSurface,

      fontSize: 16,
      lineHeight: 21,

      fontWeight: typography.weight.heavy,
    },

    myPositionInformation: {
      marginTop: 20,
      paddingVertical: 16,

      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,

      flexDirection: "row",
      alignItems: "center",
    },

    myPositionInformationItem: {
      flex: 1,
    },

    myPositionInformationLabel: {
      color: colors.onSurfaceTertiary,

      fontSize: 10,
      lineHeight: 14,

      fontWeight: typography.weight.medium,
    },

    myPositionInformationValue: {
      marginTop: 3,

      color: colors.onSurface,

      fontSize: 16,
      lineHeight: 21,

      fontWeight: typography.weight.heavy,
    },

    verticalDivider: {
      width: StyleSheet.hairlineWidth,
      height: 34,

      marginHorizontal: 14,

      backgroundColor: colors.border,
    },

    currentRankContainer: {
      marginTop: 16,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,
    },

    currentRankIcon: {
      width: 38,
      height: 38,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    currentRankText: {
      flex: 1,
    },

    currentRankLabel: {
      color: colors.onSurfaceTertiary,

      fontSize: 10,
      lineHeight: 14,
    },

    currentRankValue: {
      marginTop: 1,

      color: colors.onSurface,

      fontSize: 13,
      lineHeight: 18,

      fontWeight: typography.weight.bold,
    },

    filterNoticeCard: {
      flex: isDesktop ? 1 : undefined,

      padding: 20,

      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.surfaceSecondary,

      alignItems: "flex-start",
    },

    filterNoticeIcon: {
      width: 44,
      height: 44,

      borderRadius: 14,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: `${colors.brandPrimary}12`,
    },

    filterNoticeTitle: {
      marginTop: 14,

      color: colors.onSurface,

      fontSize: 15,
      lineHeight: 20,

      fontWeight: typography.weight.bold,
    },

    filterNoticeDescription: {
      marginTop: 5,

      color: colors.onSurfaceSecondary,

      fontSize: 12,
      lineHeight: 18,
    },

    filterNoticeButton: {
      marginTop: 16,

      paddingHorizontal: 14,
      paddingVertical: 10,

      borderRadius: 11,

      backgroundColor: `${colors.brandPrimary}14`,

      ...Platform.select({
        web: {
          cursor: "pointer",
        },
      }),
    },

    filterNoticeButtonHovered: {
      backgroundColor: `${colors.brandPrimary}20`,
    },

    filterNoticeButtonText: {
      color: colors.brandPrimary,

      fontSize: 11,
      lineHeight: 15,

      fontWeight: typography.weight.bold,
    },

    statisticsGrid: {
      flexDirection: "row",

      gap: 12,
    },

    statisticCard: {
      flex: 1,

      minHeight: 108,

      padding: 14,

      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.surfaceSecondary,
    },

    statisticIcon: {
      width: 34,
      height: 34,

      borderRadius: 11,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: `${colors.brandPrimary}10`,
    },

    statisticValue: {
      marginTop: 10,

      color: colors.onSurface,

      fontSize: 18,
      lineHeight: 23,

      fontWeight: typography.weight.heavy,
    },

    statisticLabel: {
      marginTop: 1,

      color: colors.onSurfaceTertiary,

      fontSize: 10,
      lineHeight: 14,

      fontWeight: typography.weight.medium,
    },

    rankingSection: {
      marginTop: 28,
    },

    sectionHeader: {
      marginBottom: 12,

      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",

      gap: 12,
    },

    sectionEyebrow: {
      color: colors.brandPrimary,

      fontSize: 9,
      lineHeight: 13,

      fontWeight: typography.weight.bold,

      letterSpacing: 1.1,
    },

    sectionTitle: {
      marginTop: 2,

      color: colors.onSurface,

      fontSize: isDesktop ? 20 : 18,
      lineHeight: 25,

      fontWeight: typography.weight.heavy,
    },

    participantsBadge: {
      paddingHorizontal: 10,
      paddingVertical: 7,

      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.surfaceSecondary,

      flexDirection: "row",
      alignItems: "center",

      gap: 5,
    },

    participantsBadgeText: {
      color: colors.onSurfaceTertiary,

      fontSize: 10,
      lineHeight: 14,

      fontWeight: typography.weight.semibold,
    },

    listCard: {
      overflow: "hidden",

      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.surfaceSecondary,
    },

    rankingRow: {
      minHeight: isDesktop ? 82 : 76,

      paddingHorizontal: isSmallMobile ? 10 : isDesktop ? 18 : 13,

      flexDirection: "row",
      alignItems: "center",

      gap: isSmallMobile ? 8 : 11,

      ...Platform.select({
        web: {
          cursor: "pointer",
        },
      }),
    },

    rankingRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    rankingRowMe: {
      backgroundColor: `${colors.brandPrimary}0D`,
    },

    rankingRowHovered: {
      backgroundColor: `${colors.brandPrimary}08`,
    },

    rankingRowPressed: {
      opacity: 0.75,
    },

    rowPositionContainer: {
      width: isSmallMobile ? 25 : 32,

      alignItems: "center",
      justifyContent: "center",
    },

    rowPosition: {
      color: colors.onSurfaceTertiary,

      fontSize: 13,
      lineHeight: 18,

      fontWeight: typography.weight.bold,

      textAlign: "center",
    },

    rowMedal: {
      width: 30,
      height: 30,

      borderRadius: 10,

      alignItems: "center",
      justifyContent: "center",
    },

    rowAvatarContainer: {
      position: "relative",
    },

    rowAvatar: {
      width: isSmallMobile ? 40 : 45,
      height: isSmallMobile ? 40 : 45,

      borderRadius: 999,

      backgroundColor: colors.border,
    },

    rowAvatarFallbackText: {
      color: colors.brandPrimary,

      fontSize: 15,

      fontWeight: typography.weight.heavy,
    },

    meIndicator: {
      position: "absolute",

      right: -1,
      bottom: 0,

      width: 12,
      height: 12,

      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.surfaceSecondary,

      backgroundColor: colors.brandPrimary,
    },

    rowMain: {
      flex: 1,
      minWidth: 0,
    },

    rowNameLine: {
      flexDirection: "row",
      alignItems: "center",

      gap: 7,
    },

    rowName: {
      flexShrink: 1,

      color: colors.onSurface,

      fontSize: isSmallMobile ? 12 : 14,
      lineHeight: 18,

      fontWeight: typography.weight.bold,
    },

    youTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,

      borderRadius: 5,

      backgroundColor: `${colors.brandPrimary}14`,
    },

    youTagText: {
      color: colors.brandPrimary,

      fontSize: 8,
      lineHeight: 10,

      fontWeight: typography.weight.heavy,

      letterSpacing: 0.4,
    },

    rowRankLine: {
      marginTop: 4,

      flexDirection: "row",
      alignItems: "center",

      gap: 4,
    },

    rowDescription: {
      flexShrink: 1,

      color: colors.onSurfaceTertiary,

      fontSize: isSmallMobile ? 10 : 11,
      lineHeight: 15,
    },

    rowXpBlock: {
      minWidth: isSmallMobile ? 48 : 68,

      alignItems: "flex-end",
    },

    rowXp: {
      color: colors.onSurface,

      fontSize: isSmallMobile ? 12 : 14,
      lineHeight: 18,

      fontWeight: typography.weight.heavy,
    },

    rowXpLabel: {
      marginTop: 1,

      color: colors.onSurfaceTertiary,

      fontSize: 8,
      lineHeight: 10,

      fontWeight: typography.weight.bold,

      letterSpacing: 0.5,
    },

    emptyStateCard: {
      minHeight: 330,

      padding: 30,

      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.surfaceSecondary,

      alignItems: "center",
      justifyContent: "center",
    },

    emptyStateIcon: {
      width: 66,
      height: 66,

      borderRadius: 22,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: `${colors.brandPrimary}12`,
    },

    emptyStateTitle: {
      marginTop: 18,

      color: colors.onSurface,

      fontSize: 17,
      lineHeight: 22,

      fontWeight: typography.weight.heavy,

      textAlign: "center",
    },

    emptyStateDescription: {
      maxWidth: 400,

      marginTop: 6,

      color: colors.onSurfaceSecondary,

      fontSize: 12,
      lineHeight: 19,

      textAlign: "center",
    },

    emptyStateButton: {
      marginTop: 20,

      paddingHorizontal: 16,
      paddingVertical: 11,

      borderRadius: 12,

      backgroundColor: colors.brandPrimary,

      flexDirection: "row",
      alignItems: "center",

      gap: 7,

      ...Platform.select({
        web: {
          cursor: "pointer",
        },
      }),
    },

    emptyStateButtonHovered: {
      opacity: 0.88,
    },

    emptyStateButtonText: {
      color: colors.onBrandPrimary,

      fontSize: 12,
      lineHeight: 16,

      fontWeight: typography.weight.bold,
    },
  });
}