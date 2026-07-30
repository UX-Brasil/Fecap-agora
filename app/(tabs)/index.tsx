import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ComponentProps, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/contexts/AuthContext";
import { fecapPartnerCompanies } from "@/src/services/fecap-partners";
import {
  COMPANIES,
  FEED,
  STORIES,
  companyById,
} from "@/src/services/mock-data";
import { sortCompaniesForFecap } from "@/src/services/recommendation";
import { useTheme } from "@/src/theme/ThemeContext";

import type { Company } from "@/src/types";

type IconName = ComponentProps<typeof Ionicons>["name"];

type CompatibleCompany = Company & {
  logo?: string;
  logoUrl?: string;
  color?: string;
  isFecapPartner?: boolean;
};

const MAX_PAGE_WIDTH = 1100;
const MAX_FEED_WIDTH = 760;
const MOBILE_BREAKPOINT = 480;
const TABLET_BREAKPOINT = 768;

function normalizeCompanyId(companyId?: string | null) {
  if (!companyId) {
    return "";
  }

  return companyId.trim().toLowerCase().replace(/^c_/, "").replace(/_/g, "-");
}

function normalizeCompanyName(name?: string | null) {
  if (!name) {
    return "";
  }

  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getCompanyLogoUrl(company?: CompatibleCompany | null) {
  if (!company) {
    return "";
  }

  return company.logo ?? company.logoUrl ?? "";
}

function resolveCompany(companyId?: string | null): CompatibleCompany | null {
  if (!companyId) {
    return null;
  }

  const normalizedId = normalizeCompanyId(companyId);

  const partnerById = fecapPartnerCompanies.find(
    (company) => normalizeCompanyId(company.id) === normalizedId,
  );

  if (partnerById) {
    return partnerById;
  }

  const oldCompany =
    companyById(companyId) ??
    companyById(normalizedId) ??
    companyById(`c_${normalizedId}`);

  if (!oldCompany) {
    return null;
  }

  const partnerByName = fecapPartnerCompanies.find(
    (company) =>
      normalizeCompanyName(company.name) ===
      normalizeCompanyName(oldCompany.name),
  );

  if (partnerByName) {
    return {
      ...oldCompany,
      ...partnerByName,
      id: partnerByName.id,
      logo: partnerByName.logo ?? oldCompany.logo ?? oldCompany.logoUrl,
    };
  }

  return oldCompany;
}

function isSameCompany(firstId?: string | null, secondId?: string | null) {
  return normalizeCompanyId(firstId) === normalizeCompanyId(secondId);
}

function timeAgo(iso: string) {
  const timestamp = new Date(iso).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const difference = Math.max(0, Date.now() - timestamp);

  const minutes = Math.floor(difference / 60_000);

  const hours = Math.floor(difference / 3_600_000);

  const days = Math.floor(difference / 86_400_000);

  if (minutes < 1) {
    return "agora";
  }

  if (minutes < 60) {
    return `${minutes}min`;
  }

  if (hours < 24) {
    return `${hours}h`;
  }

  if (days === 1) {
    return "ontem";
  }

  return `${days}d`;
}

export default function Home() {
  const { colors, spacing, radius, typography } = useTheme();

  const { user } = useAuth();
  const router = useRouter();

  const { width } = useWindowDimensions();

  const isMobile = width < TABLET_BREAKPOINT;
  const isCompact = width < MOBILE_BREAKPOINT;

  const horizontalPadding = isCompact ? 14 : isMobile ? 20 : 28;

  const pageWidth = Math.min(
    Math.max(width - horizontalPadding * 2, 0),
    MAX_PAGE_WIDTH,
  );

  const feedWidth = Math.min(pageWidth, MAX_FEED_WIDTH);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "estudante";

  const storyCompanies = useMemo(() => {
    const companies: CompatibleCompany[] = [];
    const addedCompanies = new Set<string>();

    STORIES.forEach((story) => {
      const company = resolveCompany(story.companyId);

      if (!company) {
        return;
      }

      const normalizedId = normalizeCompanyId(company.id);

      if (addedCompanies.has(normalizedId)) {
        return;
      }

      addedCompanies.add(normalizedId);
      companies.push(company);
    });

    return companies;
  }, []);

  const partnerCompanies = useMemo(() => {
    return sortCompaniesForFecap(fecapPartnerCompanies).slice(
      0,
      isCompact ? 8 : 10,
    );
  }, [isCompact]);

  const allCompanies = useMemo(() => {
    const companies = new Map<string, CompatibleCompany>();

    COMPANIES.forEach((company) => {
      companies.set(normalizeCompanyId(company.id), company);
    });

    fecapPartnerCompanies.forEach((company) => {
      companies.set(normalizeCompanyId(company.id), company);
    });

    return companies;
  }, []);

  const findFeedCompany = (companyId: string) => {
    const resolved = resolveCompany(companyId);

    if (resolved) {
      return resolved;
    }

    return allCompanies.get(normalizeCompanyId(companyId)) ?? null;
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
      testID="home-screen"
    >
      <View
        style={[
          styles.headerOuter,
          {
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              width: pageWidth,
            },
          ]}
        >
          <View style={styles.headerGreeting}>
            <Text
              style={{
                color: colors.onSurfaceTertiary,
                fontSize: 12,
                fontWeight: typography.weight.medium,
              }}
            >
              Olá,
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.greetingName,
                {
                  color: colors.onSurface,
                  fontSize: isCompact ? 20 : 22,
                  fontWeight: typography.weight.heavy,
                },
              ]}
            >
              {firstName} 👋
            </Text>
          </View>

          <View style={styles.headerActions}>
            <HeaderButton
              icon="notifications-outline"
              accessibilityLabel="Abrir notificações"
              onPress={() => router.push("/notifications")}
              colors={colors}
              showBadge
              testID="home-notifications-button"
            />

            <HeaderButton
              icon="search-outline"
              accessibilityLabel="Abrir pesquisa"
              onPress={() => router.push("/search")}
              colors={colors}
              testID="home-search-button"
            />
          </View>
        </View>
      </View>

      <FlatList
        data={FEED}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: isMobile ? 120 : 64,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            {storyCompanies.length > 0 && (
              <View
                style={[
                  styles.fullWidthSection,
                  {
                    width: pageWidth,
                  },
                ]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.storiesContent,
                    {
                      paddingHorizontal: isMobile ? 0 : 2,
                    },
                  ]}
                  testID="stories-row"
                >
                  {storyCompanies.map((company) => (
                    <StoryCircle
                      key={company.id}
                      company={company}
                      compact={isCompact}
                      onPress={() => router.push(`/story/${company.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {partnerCompanies.length > 0 && (
              <View
                style={[
                  styles.fullWidthSection,
                  {
                    width: pageWidth,
                    paddingBottom: 14,
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.onSurface,
                        fontWeight: typography.weight.bold,
                        fontSize: 15,
                      }}
                    >
                      Parceiros FECAP
                    </Text>

                    <Text
                      style={{
                        color: colors.onSurfaceTertiary,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      Empresas com relevância reforçada para estudantes
                    </Text>
                  </View>

                  {!isCompact && (
                    <View
                      style={[
                        styles.fecapBadge,
                        {
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="school-outline"
                        size={13}
                        color={colors.brandPrimary}
                      />

                      <Text
                        style={{
                          color: colors.brandPrimary,
                          fontSize: 10,
                          fontWeight: typography.weight.bold,
                        }}
                      >
                        Parceiros oficiais
                      </Text>
                    </View>
                  )}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.partnersContent}
                >
                  {partnerCompanies.map((company) => (
                    <PartnerCard
                      key={company.id}
                      company={company}
                      compact={isCompact}
                      onPress={() => router.push(`/company/${company.id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            <View
              style={[
                styles.feedTitleContainer,
                {
                  width: feedWidth,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.onSurface,
                  fontWeight: typography.weight.bold,
                  fontSize: 17,
                }}
              >
                Feed para você
              </Text>

              <Text
                style={{
                  color: colors.onSurfaceTertiary,
                  fontSize: 12,
                  lineHeight: 18,
                  marginTop: 3,
                }}
              >
                Personalizado pela IA a partir das suas skills
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const company = findFeedCompany(item.companyId);

          if (!company) {
            return null;
          }

          return (
            <View
              style={[
                styles.feedCardWrapper,
                {
                  width: feedWidth,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir empresa ${company.name}`}
                onPress={() => router.push(`/company/${company.id}`)}
                style={({ pressed }) => [
                  styles.feedCard,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    padding: isCompact ? 13 : 16,
                  },
                  pressed && styles.cardPressed,
                ]}
                testID={`feed-card-${item.id}`}
              >
                <View style={styles.feedHeader}>
                  <CompanyLogo
                    company={company}
                    size={isCompact ? 40 : 44}
                    borderRadius={12}
                  />

                  <View style={styles.feedCompanyInfo}>
                    <View style={styles.feedCompanyNameRow}>
                      <Text
                        numberOfLines={1}
                        style={{
                          flex: 1,
                          color: colors.onSurface,
                          fontWeight: typography.weight.bold,
                          fontSize: 14,
                        }}
                      >
                        {company.name}
                      </Text>

                      {company.isFecapPartner && (
                        <Ionicons
                          name="school"
                          size={13}
                          color={colors.brandPrimary}
                        />
                      )}
                    </View>

                    <Text
                      numberOfLines={1}
                      style={{
                        color: colors.onSurfaceTertiary,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {company.industry}
                      {" • "}
                      {timeAgo(item.createdAt)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.tag,
                      {
                        backgroundColor: colors.brandSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: colors.onBrandSecondary,
                        fontSize: 9,
                        fontWeight: typography.weight.bold,
                        textTransform: "uppercase",
                      }}
                    >
                      {tagOf(item.kind)}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.feedTitle,
                    {
                      color: colors.onSurface,
                      fontSize: isCompact ? 15 : 17,
                      fontWeight: typography.weight.bold,
                    },
                  ]}
                >
                  {item.title}
                </Text>

                <Text
                  style={{
                    color: colors.onSurfaceSecondary,
                    fontSize: 14,
                    lineHeight: 21,
                    marginTop: 6,
                  }}
                >
                  {item.body}
                </Text>

                {item.imageUrl && (
                  <View
                    style={[
                      styles.feedImageContainer,
                      {
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Image
                      source={{
                        uri: item.imageUrl,
                      }}
                      style={styles.feedImage}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />

                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.42)"]}
                      style={styles.feedImageGradient}
                      pointerEvents="none"
                    />
                  </View>
                )}

                <View style={styles.feedFooter}>
                  <FooterItem
                    icon="heart-outline"
                    text={String(item.reactions)}
                    color={colors.onSurfaceTertiary}
                  />

                  <FooterItem
                    icon="chatbubble-outline"
                    text={String(item.comments)}
                    color={colors.onSurfaceTertiary}
                  />

                  <View style={{ flex: 1 }} />

                  {!isCompact && (
                    <View
                      style={[
                        styles.suggestedTag,
                        {
                          backgroundColor: colors.surfaceTertiary,
                        },
                      ]}
                    >
                      <Ionicons
                        name="sparkles"
                        size={11}
                        color={colors.brandPrimary}
                      />

                      <Text
                        style={{
                          color: colors.brandPrimary,
                          fontSize: 10,
                          fontWeight: typography.weight.bold,
                        }}
                      >
                        Sugerido
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

function CompanyLogo({
  company,
  size,
  borderRadius,
}: {
  company: CompatibleCompany;
  size: number;
  borderRadius: number;
}) {
  const { colors } = useTheme();

  const logoUrl = getCompanyLogoUrl(company);

  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const initials = useMemo(() => {
    return company.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  }, [company.name]);

  return (
    <View
      style={[
        styles.companyLogo,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {logoUrl && !imageFailed ? (
        <Image
          source={{
            uri: logoUrl,
          }}
          style={{
            width: size - 8,
            height: size - 8,
          }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={150}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View
          style={[
            styles.companyLogoFallback,
            {
              backgroundColor: company.color ?? "#2563EB",
            },
          ]}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: Math.max(12, size * 0.3),
              fontWeight: "800",
            }}
          >
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

function StoryCircle({
  company,
  compact,
  onPress,
}: {
  company: CompatibleCompany;
  compact: boolean;
  onPress: () => void;
}) {
  const { colors, typography } = useTheme();

  const outerSize = compact ? 66 : 72;
  const middleSize = outerSize - 6;
  const logoSize = middleSize - 6;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir stories de ${company.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.storyButton,
        {
          width: compact ? 68 : 76,
        },
        pressed && styles.buttonPressed,
      ]}
      testID={`story-${company.name}`}
    >
      <LinearGradient
        colors={[colors.brand, colors.brandPrimary, "#F59E0B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          alignItems: "center",
          justifyContent: "center",
          padding: 3,
        }}
      >
        <View
          style={{
            width: middleSize,
            height: middleSize,
            borderRadius: middleSize / 2,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
            padding: 3,
          }}
        >
          <View
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: logoSize / 2,
              overflow: "hidden",
            }}
          >
            <CompanyLogo
              company={company}
              size={logoSize}
              borderRadius={logoSize / 2}
            />
          </View>
        </View>
      </LinearGradient>

      <Text
        numberOfLines={1}
        style={{
          width: "100%",
          color: colors.onSurface,
          fontSize: 11,
          marginTop: 6,
          textAlign: "center",
          fontWeight: typography.weight.medium,
        }}
      >
        {company.name}
      </Text>
    </Pressable>
  );
}

function PartnerCard({
  company,
  compact,
  onPress,
}: {
  company: CompatibleCompany;
  compact: boolean;
  onPress: () => void;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir empresa ${company.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.partnerCard,
        {
          width: compact ? 116 : 132,
          minHeight: compact ? 138 : 148,
          padding: compact ? 11 : 13,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
        },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.partnerIconRow}>
        <CompanyLogo
          company={company}
          size={compact ? 48 : 54}
          borderRadius={13}
        />

        <View
          style={[
            styles.partnerCheck,
            {
              backgroundColor: colors.brandPrimary,
            },
          ]}
        >
          <Ionicons name="school" size={9} color="#FFFFFF" />
        </View>
      </View>

      <Text
        numberOfLines={2}
        style={{
          width: "100%",
          color: colors.onSurface,
          fontSize: 12,
          lineHeight: 16,
          fontWeight: typography.weight.semibold,
          textAlign: "center",
          marginTop: 9,
        }}
      >
        {company.name}
      </Text>

      <Text
        numberOfLines={1}
        style={{
          width: "100%",
          color: colors.onSurfaceTertiary,
          fontSize: 10,
          textAlign: "center",
          marginTop: 3,
        }}
      >
        {company.industry}
      </Text>
    </Pressable>
  );
}

function QuickAction({
  icon,
  label,
  tint,
  onPress,
  testID,
  compact,
}: {
  icon: IconName;
  label: string;
  tint: string;
  onPress: () => void;
  testID: string;
  compact: boolean;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${label}`}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.quickAction,
        {
          minWidth: compact ? "47%" : undefined,
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.md,
        },
        pressed && styles.buttonPressed,
      ]}
    >
      <View
        style={[
          styles.quickActionIcon,
          {
            backgroundColor: `${tint}20`,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={tint} />
      </View>

      <Text
        style={{
          color: colors.onSurface,
          fontSize: 12,
          fontWeight: typography.weight.semibold,
          marginTop: 6,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HeaderButton({
  icon,
  accessibilityLabel,
  onPress,
  colors,
  showBadge = false,
  testID,
}: {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  showBadge?: boolean;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
        },
        pressed && styles.buttonPressed,
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.onSurface} />

      {showBadge && (
        <View
          style={[
            styles.notificationBadge,
            {
              backgroundColor: colors.brandPrimary,
              borderColor: colors.surfaceSecondary,
            },
          ]}
        />
      )}
    </Pressable>
  );
}

function FooterItem({
  icon,
  text,
  color,
}: {
  icon: IconName;
  text: string;
  color: string;
}) {
  return (
    <View style={styles.footerItem}>
      <Ionicons name={icon} size={17} color={color} />

      <Text
        style={{
          color,
          fontSize: 12,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function tagOf(kind: string) {
  switch (kind) {
    case "job_opened":
      return "Vaga";

    case "hackathon":
      return "Hackathon";

    case "event":
      return "Evento";

    case "challenge":
      return "Desafio";

    default:
      return "Artigo";
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  headerOuter: {
    width: "100%",
    alignItems: "center",
  },

  header: {
    minHeight: 66,
    paddingTop: 8,
    paddingBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerGreeting: {
    flex: 1,
    minWidth: 0,
  },

  greetingName: {
    letterSpacing: -0.5,
    marginTop: 1,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
  },

  listContent: {
    alignItems: "center",
  },

  headerContent: {
    width: "100%",
    alignItems: "center",
  },

  fullWidthSection: {
    alignSelf: "center",
  },

  storiesContent: {
    gap: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },

  storyButton: {
    alignItems: "center",
  },

  quickActionsGrid: {
    flexDirection: "row",
    gap: 10,
  },

  quickActionsGridCompact: {
    flexWrap: "wrap",
  },

  quickAction: {
    flex: 1,
    minHeight: 78,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 11,
  },

  quickActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeader: {
    minHeight: 48,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  fecapBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  partnersContent: {
    gap: 10,
    paddingBottom: 2,
  },

  partnerCard: {
    borderWidth: 1,
    alignItems: "center",
  },

  partnerIconRow: {
    position: "relative",
  },

  partnerCheck: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  feedTitleContainer: {
    alignSelf: "center",
    paddingTop: 12,
    paddingBottom: 12,
  },

  feedCardWrapper: {
    alignSelf: "center",
  },

  feedCard: {
    width: "100%",
    borderWidth: 1,

    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },

  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  feedCompanyInfo: {
    flex: 1,
    minWidth: 0,
  },

  feedCompanyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  companyLogo: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  companyLogoFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  tag: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  feedTitle: {
    marginTop: 11,
    lineHeight: 22,
    letterSpacing: -0.3,
  },

  feedImageContainer: {
    width: "100%",
    marginTop: 13,
    overflow: "hidden",
    aspectRatio: 16 / 9,
  },

  feedImage: {
    width: "100%",
    height: "100%",
  },

  feedImageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
  },

  feedFooter: {
    minHeight: 30,
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  footerItem: {
    marginRight: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  suggestedTag: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  buttonPressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  cardPressed: {
    opacity: 0.86,
    transform: [
      {
        scale: 0.992,
      },
    ],
  },
});
