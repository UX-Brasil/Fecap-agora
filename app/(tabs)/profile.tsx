import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/contexts/AuthContext";
import { companyById } from "@/src/services/mock-data";
import { useTheme } from "@/src/theme/ThemeContext";

const WEB_BREAKPOINT = 768;
const WEB_MAX_WIDTH = 960;

export default function Profile() {
  const {
    colors,
    typography,
    radius,
    mode,
    toggleTheme,
  } = useTheme();

  const { user, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width >= WEB_BREAKPOINT;

  if (!user) {
    return null;
  }

  const nextLevelXp = Math.max(user.level * 500, 1);
  const progress = Math.min(
    1,
    Math.max(0, user.xp / nextLevelXp),
  );

  const desiredCompany = user.companyDesired
    ? companyById(user.companyDesired)
    : null;

  const handleSignOut = () => {
    const executeSignOut = async () => {
      try {
        await signOut();
        router.replace("/(auth)/login");
      } catch (error) {
        console.error("Erro ao sair da conta:", error);

        Alert.alert(
          "Não foi possível sair",
          "Tente novamente em alguns instantes.",
        );
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Deseja realmente sair da sua conta?",
      );

      if (confirmed) {
        void executeSignOut();
      }

      return;
    }

    Alert.alert(
      "Sair da conta",
      "Deseja realmente encerrar sua sessão?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            void executeSignOut();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: colors.surface,
        },
      ]}
      edges={["top"]}
      testID="profile-screen"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileHero
          isDesktop={isDesktop}
          mode={mode}
          onToggleTheme={toggleTheme}
          onOpenSettings={() =>
            router.push("/settings" as never)
          }
        />

        <View
          style={[
            styles.content,
            {
              maxWidth: isDesktop
                ? WEB_MAX_WIDTH
                : undefined,
              paddingHorizontal: isDesktop ? 24 : 16,
            },
          ]}
        >
          <ProfileIdentity
            user={user}
            desiredCompanyName={desiredCompany?.name}
          />

          <ProfileStats user={user} />

          <GamificationCard
            level={user.level}
            xp={user.xp}
            nextLevelXp={nextLevelXp}
            progress={progress}
          />

          <ProfileSection
            title="Conquistas"
            subtitle="Badges conquistadas pela sua participação"
          >
            <BadgesList badges={user.badges ?? []} />
          </ProfileSection>

          <ProfileSection
            title="Habilidades"
            subtitle="Competências adicionadas ao seu perfil"
          >
            <SkillsList skills={user.skills ?? []} />
          </ProfileSection>

          <ProfileSection
            title="Links profissionais"
            subtitle="Portfólio e redes profissionais"
          >
            <View style={styles.linksList}>
              {user.github ? (
                <LinkRow
                  icon="logo-github"
                  label={`github.com/${user.github}`}
                  url={`https://github.com/${user.github}`}
                  testID="profile-github"
                />
              ) : null}

              {user.linkedin ? (
                <LinkRow
                  icon="logo-linkedin"
                  label={`linkedin.com/in/${user.linkedin}`}
                  url={`https://www.linkedin.com/in/${user.linkedin}`}
                  testID="profile-linkedin"
                />
              ) : null}

              {user.portfolio ? (
                <LinkRow
                  icon="globe-outline"
                  label={user.portfolio}
                  url={normalizeUrl(user.portfolio)}
                  testID="profile-portfolio"
                />
              ) : null}

              {!user.github &&
              !user.linkedin &&
              !user.portfolio ? (
                <EmptyLinks />
              ) : null}
            </View>
          </ProfileSection>

          <Pressable
            onPress={() =>
              router.push("/profile/edit" as never)
            }
            style={({ pressed }) => [
              styles.editProfileButton,
              {
                backgroundColor: colors.brandPrimary,
                borderRadius: radius.lg,
                opacity: pressed ? 0.78 : 1,
                transform: [
                  {
                    scale: pressed ? 0.995 : 1,
                  },
                ],
              },
            ]}
            testID="profile-edit-button"
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={colors.onBrandPrimary}
            />

            <Text
              style={[
                styles.editProfileText,
                {
                  color: colors.onBrandPrimary,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              Editar perfil
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOutButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                borderRadius: radius.lg,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
            testID="profile-signout-button"
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
          >
            <Ionicons
              name="log-out-outline"
              size={19}
              color={colors.error}
            />

            <Text
              style={[
                styles.signOutText,
                {
                  color: colors.error,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              Sair da conta
            </Text>
          </Pressable>

          <Text
            style={[
              styles.versionText,
              {
                color: colors.onSurfaceTertiary,
              },
            ]}
          >
            ASA Connect • Versão 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ProfileHeroProps = {
  isDesktop: boolean;
  mode: "light" | "dark";
  onToggleTheme: () => void;
  onOpenSettings: () => void;
};

function ProfileHero({
  isDesktop,
  mode,
  onToggleTheme,
  onOpenSettings,
}: ProfileHeroProps) {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[
        colors.brandPrimary,
        colors.brand,
      ]}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 1,
        y: 1,
      }}
      style={[
        styles.hero,
        {
          minHeight: isDesktop ? 230 : 190,
          paddingHorizontal: isDesktop ? 28 : 16,
        },
      ]}
    >
      <View
        style={[
          styles.heroContent,
          {
            maxWidth: isDesktop
              ? WEB_MAX_WIDTH
              : undefined,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroLabel}>
            <Ionicons
              name="person-circle-outline"
              size={17}
              color="#FFFFFF"
            />

            <Text style={styles.heroLabelText}>
              Meu perfil
            </Text>
          </View>

          <View style={styles.heroActions}>
            <HeaderButton
              icon={mode === "dark" ? "sunny" : "moon"}
              label={
                mode === "dark"
                  ? "Ativar tema claro"
                  : "Ativar tema escuro"
              }
              onPress={onToggleTheme}
              testID="profile-theme-toggle"
            />

            <HeaderButton
              icon="settings-outline"
              label="Abrir configurações"
              onPress={onOpenSettings}
              testID="profile-settings-button"
            />
          </View>
        </View>

        <View style={styles.heroTextContent}>
          <Text style={styles.heroTitle}>
            Perfil profissional
          </Text>

          <Text style={styles.heroSubtitle}>
            Gerencie suas experiências, habilidades e
            objetivos profissionais.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

type HeaderButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  testID: string;
};

function HeaderButton({
  icon,
  label,
  onPress,
  testID,
}: HeaderButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.headerButton,
        {
          opacity: pressed ? 0.7 : 1,
          transform: [
            {
              scale: pressed ? 0.94 : 1,
            },
          ],
        },
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={19}
        color="#FFFFFF"
      />
    </Pressable>
  );
}

function ProfileIdentity({
  user,
  desiredCompanyName,
}: {
  user: ReturnType<typeof useAuth>["user"];
  desiredCompanyName?: string;
}) {
  const { colors, typography, radius } = useTheme();

  if (!user) {
    return null;
  }

  return (
    <View style={styles.identitySection}>
      <View
        style={[
          styles.avatarBorder,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Image
          source={{
            uri: user.avatarUrl,
          }}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />

        <View
          style={[
            styles.onlineIndicator,
            {
              backgroundColor: colors.like,
              borderColor: colors.surface,
            },
          ]}
        />
      </View>

      <Text
        style={[
          styles.userName,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.heavy,
          },
        ]}
      >
        {user.name}
      </Text>

      <Text
        style={[
          styles.userDetails,
          {
            color: colors.onSurfaceTertiary,
          },
        ]}
      >
        {user.handle} • {user.course}
      </Text>

      <View style={styles.profilePills}>
        <View
          style={[
            styles.profilePill,
            {
              backgroundColor: colors.brandSecondary,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Ionicons
            name="school-outline"
            size={13}
            color={colors.onBrandSecondary}
          />

          <Text
            style={[
              styles.profilePillText,
              {
                color: colors.onBrandSecondary,
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            {user.semester}º semestre
          </Text>
        </View>

        {desiredCompanyName ? (
          <View
            style={[
              styles.profilePill,
              {
                backgroundColor:
                  colors.surfaceSecondary,
                borderColor: colors.border,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Ionicons
              name="flag-outline"
              size={13}
              color={colors.brandPrimary}
            />

            <Text
              numberOfLines={1}
              style={[
                styles.profilePillText,
                {
                  color:
                    colors.onSurfaceSecondary,
                  fontWeight:
                    typography.weight.semibold,
                },
              ]}
            >
              {desiredCompanyName}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ProfileStats({
  user,
}: {
  user: NonNullable<
    ReturnType<typeof useAuth>["user"]
  >;
}) {
  const { colors, typography, radius } = useTheme();

  const stats = [
    {
      id: "connections",
      icon: "people-outline" as const,
      value:
        "connectionsCount" in user
          ? String(user.connectionsCount ?? 0)
          : "0",
      label: "Conexões",
    },
    {
      id: "applications",
      icon: "briefcase-outline" as const,
      value:
        "applicationsCount" in user
          ? String(user.applicationsCount ?? 0)
          : "0",
      label: "Candidaturas",
    },
    {
      id: "badges",
      icon: "ribbon-outline" as const,
      value: String(user.badges?.length ?? 0),
      label: "Conquistas",
    },
  ];

  return (
    <View
      style={[
        styles.statsCard,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      {stats.map((stat, index) => (
        <View
          key={stat.id}
          style={[
            styles.statItem,
            index < stats.length - 1 && {
              borderRightWidth:
                StyleSheet.hairlineWidth,
              borderRightColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name={stat.icon}
            size={18}
            color={colors.brandPrimary}
          />

          <Text
            style={[
              styles.statValue,
              {
                color: colors.onSurface,
                fontWeight: typography.weight.heavy,
              },
            ]}
          >
            {stat.value}
          </Text>

          <Text
            style={[
              styles.statLabel,
              {
                color: colors.onSurfaceTertiary,
              },
            ]}
          >
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

type GamificationCardProps = {
  level: number;
  xp: number;
  nextLevelXp: number;
  progress: number;
};

function GamificationCard({
  level,
  xp,
  nextLevelXp,
  progress,
}: GamificationCardProps) {
  const { colors, typography, radius } = useTheme();

  const remainingXp = Math.max(nextLevelXp - xp, 0);

  return (
    <View
      style={[
        styles.gamificationCard,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
      testID="profile-gamification"
    >
      <View style={styles.gamificationHeader}>
        <View style={styles.levelContent}>
          <LinearGradient
            colors={[
              colors.brand,
              colors.brandPrimary,
            ]}
            style={styles.levelBadge}
          >
            <Text
              style={[
                styles.levelNumber,
                {
                  color: colors.onBrandPrimary,
                  fontWeight: typography.weight.heavy,
                },
              ]}
            >
              {level}
            </Text>
          </LinearGradient>

          <View style={styles.levelInfo}>
            <Text
              style={[
                styles.levelTitle,
                {
                  color: colors.onSurface,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              Nível {level}
            </Text>

            <Text
              style={[
                styles.levelXp,
                {
                  color: colors.onSurfaceTertiary,
                },
              ]}
            >
              {xp.toLocaleString("pt-BR")} de{" "}
              {nextLevelXp.toLocaleString("pt-BR")} XP
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.trophyContainer,
            {
              backgroundColor: `${colors.warning}18`,
            },
          ]}
        >
          <Ionicons
            name="trophy"
            size={22}
            color={colors.warning}
          />
        </View>
      </View>

      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: colors.surfaceTertiary,
          },
        ]}
      >
        <LinearGradient
          colors={[
            colors.brand,
            colors.brandPrimary,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 0,
          }}
          style={[
            styles.progressBar,
            {
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.progressFooter}>
        <Text
          style={[
            styles.progressLabel,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
        >
          {Math.round(progress * 100)}% concluído
        </Text>

        <Text
          style={[
            styles.progressLabel,
            {
              color: colors.brandPrimary,
              fontWeight: typography.weight.semibold,
            },
          ]}
        >
          {remainingXp > 0
            ? `Faltam ${remainingXp.toLocaleString("pt-BR")} XP`
            : "Próximo nível disponível"}
        </Text>
      </View>
    </View>
  );
}

function ProfileSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeading}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.onSurface,
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={[
                styles.sectionSubtitle,
                {
                  color: colors.onSurfaceTertiary,
                },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {children}
    </View>
  );
}

function BadgesList({
  badges,
}: {
  badges: Array<{
    id: string;
    icon: string;
    label: string;
  }>;
}) {
  const { colors, typography } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.badgesList}
    >
      {badges.map((badge, index) => (
        <View
          key={badge.id}
          style={styles.badgeItem}
          testID={`badge-${badge.id}`}
        >
          <LinearGradient
            colors={
              index % 2 === 0
                ? [colors.warning, "#EF4444"]
                : [colors.brandPrimary, colors.brand]
            }
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 1,
            }}
            style={styles.badgeIcon}
          >
            <Ionicons
              name={
                badge.icon as keyof typeof Ionicons.glyphMap
              }
              size={25}
              color="#FFFFFF"
            />
          </LinearGradient>

          <Text
            numberOfLines={2}
            style={[
              styles.badgeLabel,
              {
                color: colors.onSurface,
                fontWeight:
                  typography.weight.semibold,
              },
            ]}
          >
            {badge.label}
          </Text>
        </View>
      ))}

      <View
        style={styles.badgeItem}
        testID="badge-locked"
      >
        <View
          style={[
            styles.lockedBadge,
            {
              backgroundColor:
                colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="lock-closed"
            size={22}
            color={colors.onSurfaceTertiary}
          />
        </View>

        <Text
          numberOfLines={2}
          style={[
            styles.badgeLabel,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
        >
          Top Recruit
        </Text>
      </View>
    </ScrollView>
  );
}

function SkillsList({
  skills,
}: {
  skills: string[];
}) {
  const { colors, typography, radius } = useTheme();

  if (skills.length === 0) {
    return (
      <View
        style={[
          styles.emptySkills,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
            borderRadius: radius.lg,
          },
        ]}
      >
        <Ionicons
          name="code-slash-outline"
          size={22}
          color={colors.onSurfaceTertiary}
        />

        <Text
          style={[
            styles.emptySkillsText,
            {
              color: colors.onSurfaceSecondary,
            },
          ]}
        >
          Nenhuma habilidade adicionada ao perfil.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.skillsContainer}>
      {skills.map((skill) => (
        <View
          key={skill}
          style={[
            styles.skillChip,
            {
              backgroundColor:
                colors.surfaceSecondary,
              borderColor: colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={14}
            color={colors.brandPrimary}
          />

          <Text
            style={[
              styles.skillText,
              {
                color: colors.onSurface,
                fontWeight:
                  typography.weight.medium,
              },
            ]}
          >
            {skill}
          </Text>
        </View>
      ))}
    </View>
  );
}

type LinkRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  url: string;
  testID: string;
};

function LinkRow({
  icon,
  label,
  url,
  testID,
}: LinkRowProps) {
  const { colors, typography, radius } = useTheme();

  const handleOpenLink = async () => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Link indisponível",
          "Não foi possível abrir este endereço.",
        );
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error("Erro ao abrir link:", error);

      Alert.alert(
        "Erro ao abrir link",
        "Tente novamente em alguns instantes.",
      );
    }
  };

  return (
    <Pressable
      onPress={handleOpenLink}
      style={({ pressed }) => [
        styles.linkRow,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg,
          opacity: pressed ? 0.72 : 1,
          transform: [
            {
              scale: pressed ? 0.995 : 1,
            },
          ],
        },
      ]}
      testID={testID}
      accessibilityRole="link"
      accessibilityLabel={`Abrir ${label}`}
    >
      <View
        style={[
          styles.linkIcon,
          {
            backgroundColor: `${colors.brandPrimary}14`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={colors.brandPrimary}
        />
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.linkText,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.medium,
          },
        ]}
      >
        {label}
      </Text>

      <Ionicons
        name="open-outline"
        size={17}
        color={colors.onSurfaceTertiary}
      />
    </Pressable>
  );
}

function EmptyLinks() {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.emptyLinks,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <Ionicons
        name="link-outline"
        size={22}
        color={colors.onSurfaceTertiary}
      />

      <Text
        style={[
          styles.emptyLinksText,
          {
            color: colors.onSurfaceSecondary,
          },
        ]}
      >
        Nenhum link profissional foi adicionado.
      </Text>
    </View>
  );
}

function normalizeUrl(url: string) {
  const trimmedUrl = url.trim();

  if (
    trimmedUrl.startsWith("http://") ||
    trimmedUrl.startsWith("https://")
  ) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 130,
  },

  hero: {
    width: "100%",
    paddingTop: 18,
    paddingBottom: 72,
  },

  heroContent: {
    width: "100%",
    alignSelf: "center",
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  heroLabel: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  heroLabelText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroTextContent: {
    maxWidth: 520,
    marginTop: 28,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  heroSubtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    lineHeight: 18,
  },

  content: {
    width: "100%",
    alignSelf: "center",
    marginTop: -55,
  },

  identitySection: {
    alignItems: "center",
  },

  avatarBorder: {
    position: "relative",
    padding: 4,
    borderRadius: 58,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },

  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },

  onlineIndicator: {
    position: "absolute",
    right: 4,
    bottom: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
  },

  userName: {
    marginTop: 12,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.45,
    textAlign: "center",
  },

  userDetails: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  profilePills: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 7,
  },

  profilePill: {
    maxWidth: 220,
    minHeight: 30,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  profilePillText: {
    fontSize: 10,
  },

  statsCard: {
    width: "100%",
    marginTop: 20,
    paddingVertical: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },

  statItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  statValue: {
    fontSize: 18,
    lineHeight: 22,
  },

  statLabel: {
    fontSize: 9,
    textAlign: "center",
  },

  gamificationCard: {
    marginTop: 14,
    padding: 15,
    borderWidth: 1,
  },

  gamificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  levelContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  levelBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  levelNumber: {
    fontSize: 17,
  },

  levelInfo: {
    flex: 1,
  },

  levelTitle: {
    fontSize: 14,
  },

  levelXp: {
    marginTop: 2,
    fontSize: 10,
  },

  trophyContainer: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  progressTrack: {
    height: 8,
    marginTop: 14,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius: 999,
  },

  progressFooter: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  progressLabel: {
    fontSize: 9,
  },

  section: {
    marginTop: 24,
  },

  sectionHeader: {
    marginBottom: 11,
  },

  sectionHeading: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 15,
  },

  badgesList: {
    gap: 11,
    paddingRight: 18,
  },

  badgeItem: {
    width: 82,
    alignItems: "center",
  },

  badgeIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },

  lockedBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },

  badgeLabel: {
    marginTop: 7,
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
  },

  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  skillChip: {
    minHeight: 32,
    paddingHorizontal: 11,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  skillText: {
    fontSize: 11,
  },

  emptySkills: {
    minHeight: 86,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  emptySkillsText: {
    fontSize: 10,
    textAlign: "center",
  },

  linksList: {
    gap: 8,
  },

  linkRow: {
    minHeight: 62,
    padding: 11,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  linkIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  linkText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
  },

  emptyLinks: {
    minHeight: 86,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  emptyLinksText: {
    fontSize: 10,
    textAlign: "center",
  },

  editProfileButton: {
    minHeight: 52,
    marginTop: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  editProfileText: {
    fontSize: 13,
  },

  signOutButton: {
    minHeight: 52,
    marginTop: 9,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  signOutText: {
    fontSize: 13,
  },

  versionText: {
    marginTop: 20,
    fontSize: 9,
    textAlign: "center",
  },
});