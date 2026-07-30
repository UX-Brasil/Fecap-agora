import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  EVENTS,
  FEED,
  JOBS,
  USERS,
  companyById,
} from "@/src/services/mock-data";
import {
  companyPathSummary,
  pathToCompany,
} from "@/src/services/graph";
import { useTheme } from "@/src/theme/ThemeContext";

const TABS = [
  {
    key: "Sobre",
    icon: "business-outline",
  },
  {
    key: "Vagas",
    icon: "briefcase-outline",
  },
  {
    key: "Feed",
    icon: "newspaper-outline",
  },
  {
    key: "Alumni",
    icon: "people-outline",
  },
  {
    key: "Eventos",
    icon: "calendar-outline",
  },
] as const;

type CompanyTab = (typeof TABS)[number]["key"];

type TabCounts = {
  jobs: number;
  feed: number;
  alumni: number;
  events: number;
};

const CONTENT_MAX_WIDTH = 1180;
const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 920;

export default function CompanyPage() {
  const params = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors, typography, radius } = useTheme();

  const companyId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const company = companyById(companyId ?? "");

  const [tab, setTab] = useState<CompanyTab>("Sobre");
  const [logoError, setLogoError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const isMobile = width < MOBILE_BREAKPOINT;
  const isTablet =
    width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
  const isDesktop = width >= TABLET_BREAKPOINT;

  const horizontalPadding = isMobile ? 16 : isTablet ? 24 : 32;
  const coverHeight = isMobile ? 230 : isTablet ? 290 : 350;
  const logoSize = isMobile ? 84 : isTablet ? 104 : 118;
  const logoRadius = isMobile ? 22 : 28;
  const headerOverlap = isMobile ? 50 : 66;

  const jobs = useMemo(
    () =>
      JOBS.filter(
        (job) => job.companyId === company?.id,
      ),
    [company?.id],
  );

  const feed = useMemo(
    () =>
      FEED.filter(
        (item) => item.companyId === company?.id,
      ),
    [company?.id],
  );

  const alumni = useMemo(
    () =>
      USERS.filter(
        (user) => user.companyCurrent === company?.id,
      ),
    [company?.id],
  );

  const events = useMemo(
    () =>
      EVENTS.filter(
        (event) => event.companyId === company?.id,
      ),
    [company?.id],
  );

  const connectionPath = useMemo(() => {
    if (!company) {
      return null;
    }

    return pathToCompany("u_me", company.id);
  }, [company]);

  const tabCounts = useMemo<TabCounts>(
    () => ({
      jobs: jobs.length,
      feed: feed.length,
      alumni: alumni.length,
      events: events.length,
    }),
    [
      alumni.length,
      events.length,
      feed.length,
      jobs.length,
    ],
  );

  if (!company) {
    return (
      <SafeAreaView
        style={[
          styles.screen,
          {
            backgroundColor: colors.surface,
          },
        ]}
        edges={["top", "bottom"]}
      >
        <CompanyNotFound onBack={() => router.back()} />
      </SafeAreaView>
    );
  }

  const showLogo = Boolean(company.logoUrl) && !logoError;

  const cardColumns = isDesktop ? 2 : isTablet ? 2 : 1;
  const gridGap = 14;

  const cardWidth =
    cardColumns === 1
      ? "100%"
      : `calc(50% - ${gridGap / 2}px)`;

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: colors.surface,
        },
      ]}
      edges={["top"]}
      testID={`company-screen-${company.id}`}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: isMobile ? 110 : 80,
          },
        ]}
      >
        <View
          style={[
            styles.page,
            {
              maxWidth: CONTENT_MAX_WIDTH,
            },
          ]}
        >
          {/* Capa */}
          <View
            style={[
              styles.coverContainer,
              {
                height: coverHeight,
                borderBottomLeftRadius: isMobile ? 0 : 28,
                borderBottomRightRadius: isMobile ? 0 : 28,
              },
            ]}
          >
            {company.coverUrl ? (
              <Image
                source={{ uri: company.coverUrl }}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                transition={250}
                cachePolicy="memory-disk"
                accessibilityLabel={`Capa da empresa ${company.name}`}
              />
            ) : (
              <LinearGradient
                colors={[
                  company.color || colors.brandPrimary,
                  colors.brandPrimary,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}

            <LinearGradient
              colors={[
                "rgba(4,8,15,0.50)",
                "rgba(4,8,15,0.04)",
                "rgba(4,8,15,0.86)",
              ]}
              locations={[0, 0.48, 1]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />

            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={({ pressed }) => [
                styles.floatingButton,
                styles.backButton,
                {
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              testID="company-back-button"
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#FFFFFF"
              />
            </Pressable>

            <View
              style={[
                styles.coverBottomContent,
                {
                  paddingHorizontal: horizontalPadding,
                  paddingBottom: headerOverlap + 22,
                },
              ]}
            >
              {company.isFecapPartner ? (
                <View style={styles.coverBadge}>
                  <Ionicons
                    name="school"
                    size={14}
                    color="#FFFFFF"
                  />

                  <Text
                    style={[
                      styles.coverBadgeText,
                      {
                        fontWeight: typography.weight.bold,
                      },
                    ]}
                  >
                    Empresa parceira FECAP
                  </Text>
                </View>
              ) : null}

              {!isMobile ? (
                <Text
                  style={[
                    styles.coverIndustry,
                    {
                      fontWeight: typography.weight.semibold,
                    },
                  ]}
                >
                  {company.industry}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Área principal */}
          <View
            style={[
              styles.body,
              {
                paddingHorizontal: horizontalPadding,
                marginTop: -headerOverlap,
              },
            ]}
          >
            {/* Cartão principal da empresa */}
            <View
              style={[
                styles.profileCard,
                styles.cardShadow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: isMobile
                    ? radius.lg ?? 20
                    : radius.xl ?? 24,
                  padding: isMobile ? 16 : 22,
                },
              ]}
            >
              <View
                style={[
                  styles.companyHeader,
                  {
                    alignItems: isMobile
                      ? "flex-start"
                      : "center",
                  },
                ]}
              >
                <CompanyLogo
                  companyName={company.name}
                  logoUrl={company.logoUrl}
                  companyColor={
                    company.color || colors.brandPrimary
                  }
                  showLogo={showLogo}
                  logoSize={logoSize}
                  logoRadius={logoRadius}
                  onError={() => setLogoError(true)}
                />

                <View style={styles.companyHeading}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[
                        styles.companyName,
                        {
                          color: colors.onSurface,
                          fontSize: isMobile ? 23 : 30,
                          lineHeight: isMobile ? 29 : 37,
                          fontWeight: typography.weight.heavy,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {company.name}
                    </Text>

                    {company.isFecapPartner ? (
                      <View
                        style={[
                          styles.verifiedIcon,
                          {
                            backgroundColor: colors.brandPrimary,
                          },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={colors.onBrandPrimary}
                        />
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.companyIndustry,
                      {
                        color: colors.onSurfaceSecondary,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {company.industry}
                  </Text>

                  <View style={styles.companyMetaRow}>
                    <CompanyMeta
                      icon="people-outline"
                      label={`${formatCount(
                        company.employeesCount ?? 0,
                      )} funcionários`}
                    />

                    <CompanyMeta
                      icon="school-outline"
                      label={`${formatCount(
                        company.alumniCount ?? alumni.length,
                      )} alumni`}
                    />

                    {jobs.length > 0 ? (
                      <CompanyMeta
                        icon="briefcase-outline"
                        label={`${jobs.length} ${
                          jobs.length === 1
                            ? "vaga"
                            : "vagas"
                        }`}
                      />
                    ) : null}
                  </View>
                </View>

                {!isMobile ? (
                  <View style={styles.desktopActions}>
                    <FollowButton
                      isFollowing={isFollowing}
                      onPress={() =>
                        setIsFollowing((current) => !current)
                      }
                      companyName={company.name}
                    />

                    <MessageButton
                      companyName={company.name}
                      showLabel
                    />
                  </View>
                ) : null}
              </View>

              {isMobile ? (
                <View style={styles.mobileActions}>
                  <FollowButton
                    isFollowing={isFollowing}
                    onPress={() =>
                      setIsFollowing((current) => !current)
                    }
                    companyName={company.name}
                  />

                  <MessageButton
                    companyName={company.name}
                    showLabel={false}
                  />
                </View>
              ) : null}
            </View>

            {/* Informações institucionais */}
            {(company.isFecapPartner || connectionPath) && (
              <View
                style={[
                  styles.insightsGrid,
                  {
                    flexDirection:
                      isDesktop &&
                      company.isFecapPartner &&
                      connectionPath
                        ? "row"
                        : "column",
                  },
                ]}
              >
                {company.isFecapPartner ? (
                  <InsightCard
                    icon="school-outline"
                    title="Parceiro FECAP"
                    description={
                      company.partnershipType === "recruitment"
                        ? "A empresa possui relacionamento institucional com a FECAP e pode divulgar oportunidades direcionadas à comunidade acadêmica."
                        : "A parceria aumenta a visibilidade da empresa e aproxima estudantes, alumni e oportunidades profissionais."
                    }
                    testID="company-partner-badge"
                  />
                ) : null}

                {connectionPath ? (
                  <InsightCard
                    icon="git-network-outline"
                    title="Sua rede pode ajudar"
                    description={companyPathSummary(
                      "u_me",
                      company.id,
                    )}
                    testID="company-path-insight"
                  />
                ) : null}
              </View>
            )}

            {/* Abas */}
            <View
              style={[
                styles.tabsWrapper,
                {
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContent}
              >
                {TABS.map((tabItem) => {
                  const active = tab === tabItem.key;
                  const count = getTabCount(
                    tabItem.key,
                    tabCounts,
                  );

                  return (
                    <Pressable
                      key={tabItem.key}
                      onPress={() => setTab(tabItem.key)}
                      style={({ pressed }) => [
                        styles.tabButton,
                        {
                          backgroundColor: active
                            ? `${colors.brandPrimary}12`
                            : "transparent",
                          borderBottomColor: active
                            ? colors.brandPrimary
                            : "transparent",
                          opacity: pressed ? 0.72 : 1,
                        },
                      ]}
                      accessibilityRole="tab"
                      accessibilityState={{
                        selected: active,
                      }}
                      testID={`company-tab-${tabItem.key}`}
                    >
                      <Ionicons
                        name={tabItem.icon}
                        size={18}
                        color={
                          active
                            ? colors.brandPrimary
                            : colors.onSurfaceTertiary
                        }
                      />

                      <Text
                        style={[
                          styles.tabButtonText,
                          {
                            color: active
                              ? colors.brandPrimary
                              : colors.onSurfaceSecondary,
                            fontWeight: active
                              ? typography.weight.bold
                              : typography.weight.semibold,
                          },
                        ]}
                      >
                        {tabItem.key}
                      </Text>

                      {count !== null ? (
                        <View
                          style={[
                            styles.tabCount,
                            {
                              backgroundColor: active
                                ? colors.brandPrimary
                                : colors.surfaceSecondary,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tabCountText,
                              {
                                color: active
                                  ? colors.onBrandPrimary
                                  : colors.onSurfaceTertiary,
                                fontWeight:
                                  typography.weight.bold,
                              },
                            ]}
                          >
                            {count}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Conteúdo */}
            <View style={styles.tabContent}>
              {tab === "Sobre" ? (
                <AboutTab
                  description={company.description}
                  jobsCount={jobs.length}
                  alumniCount={alumni.length}
                  eventsCount={events.length}
                  employeesCount={
                    company.employeesCount ?? 0
                  }
                  industry={company.industry}
                  isMobile={isMobile}
                />
              ) : null}

              {tab === "Vagas" ? (
                <SectionContainer
                  title="Oportunidades disponíveis"
                  subtitle={
                    jobs.length > 0
                      ? "Encontre oportunidades publicadas pela empresa."
                      : undefined
                  }
                  count={jobs.length}
                >
                  {jobs.length > 0 ? (
                    <View
                      style={[
                        styles.cardsGrid,
                        {
                          gap: gridGap,
                        },
                      ]}
                    >
                      {jobs.map((job) => (
                        <Pressable
                          key={job.id}
                          onPress={() =>
                            router.push(`/job/${job.id}`)
                          }
                          style={({ pressed }) => [
                            styles.jobCard,
                            {
                              width: cardWidth as never,
                              backgroundColor:
                                colors.surfaceSecondary,
                              borderColor: colors.border,
                              borderRadius: radius.lg ?? 18,
                              opacity: pressed ? 0.78 : 1,
                              transform: [
                                {
                                  scale: pressed ? 0.995 : 1,
                                },
                              ],
                            },
                          ]}
                          testID={`company-job-${job.id}`}
                        >
                          <View style={styles.cardHeaderRow}>
                            <View
                              style={[
                                styles.cardIcon,
                                {
                                  backgroundColor: `${colors.brandPrimary}14`,
                                },
                              ]}
                            >
                              <Ionicons
                                name="briefcase-outline"
                                size={20}
                                color={colors.brandPrimary}
                              />
                            </View>

                            <View
                              style={[
                                styles.cardArrow,
                                {
                                  backgroundColor:
                                    colors.surface,
                                },
                              ]}
                            >
                              <Ionicons
                                name="arrow-forward"
                                size={17}
                                color={
                                  colors.onSurfaceTertiary
                                }
                              />
                            </View>
                          </View>

                          <Text
                            style={[
                              styles.cardTitle,
                              {
                                color: colors.onSurface,
                                fontWeight:
                                  typography.weight.bold,
                              },
                            ]}
                            numberOfLines={2}
                          >
                            {job.title}
                          </Text>

                          <View style={styles.chipsRow}>
                            {job.seniority ? (
                              <SmallChip
                                icon="ribbon-outline"
                                label={job.seniority}
                              />
                            ) : null}

                            {job.workModel ? (
                              <SmallChip
                                icon="desktop-outline"
                                label={job.workModel}
                              />
                            ) : null}
                          </View>

                          <View style={styles.cardFooter}>
                            <View style={styles.salaryContainer}>
                              <Text
                                style={[
                                  styles.salaryLabel,
                                  {
                                    color:
                                      colors.onSurfaceTertiary,
                                  },
                                ]}
                              >
                                Remuneração
                              </Text>

                              <Text
                                style={[
                                  styles.jobSalary,
                                  {
                                    color: job.salary
                                      ? colors.brandPrimary
                                      : colors.onSurfaceSecondary,
                                    fontWeight:
                                      typography.weight.bold,
                                  },
                                ]}
                              >
                                {job.salary ??
                                  "Não informada"}
                              </Text>
                            </View>

                            <Ionicons
                              name="bookmark-outline"
                              size={20}
                              color={colors.onSurfaceTertiary}
                            />
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      icon="briefcase-outline"
                      title="Nenhuma vaga disponível"
                      description="Essa empresa ainda não publicou novas oportunidades."
                    />
                  )}
                </SectionContainer>
              ) : null}

              {tab === "Feed" ? (
                <SectionContainer
                  title="Publicações"
                  subtitle={
                    feed.length > 0
                      ? "Notícias e atualizações publicadas pela empresa."
                      : undefined
                  }
                  count={feed.length}
                >
                  {feed.length > 0 ? (
                    <View style={styles.feedList}>
                      {feed.map((item) => (
                        <View
                          key={item.id}
                          style={[
                            styles.feedCard,
                            {
                              backgroundColor:
                                colors.surfaceSecondary,
                              borderColor: colors.border,
                              borderRadius: radius.lg ?? 18,
                            },
                          ]}
                          testID={`company-feed-${item.id}`}
                        >
                          <View style={styles.feedHeader}>
                            <CompanyMiniLogo
                              companyName={company.name}
                              logoUrl={company.logoUrl}
                              showLogo={showLogo}
                              companyColor={
                                company.color ||
                                colors.brandPrimary
                              }
                            />

                            <View style={styles.feedHeading}>
                              <View
                                style={
                                  styles.feedCompanyNameRow
                                }
                              >
                                <Text
                                  style={[
                                    styles.feedCompanyName,
                                    {
                                      color: colors.onSurface,
                                      fontWeight:
                                        typography.weight.bold,
                                    },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {company.name}
                                </Text>

                                {company.isFecapPartner ? (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={15}
                                    color={
                                      colors.brandPrimary
                                    }
                                  />
                                ) : null}
                              </View>

                              <Text
                                style={[
                                  styles.feedSubtitle,
                                  {
                                    color:
                                      colors.onSurfaceTertiary,
                                  },
                                ]}
                              >
                                Publicação da empresa
                              </Text>
                            </View>

                            <Pressable
                              hitSlop={10}
                              accessibilityRole="button"
                              accessibilityLabel="Mais opções"
                            >
                              <Ionicons
                                name="ellipsis-horizontal"
                                size={20}
                                color={
                                  colors.onSurfaceTertiary
                                }
                              />
                            </Pressable>
                          </View>

                          <Text
                            style={[
                              styles.feedTitle,
                              {
                                color: colors.onSurface,
                                fontWeight:
                                  typography.weight.bold,
                              },
                            ]}
                          >
                            {item.title}
                          </Text>

                          <Text
                            style={[
                              styles.feedBody,
                              {
                                color:
                                  colors.onSurfaceSecondary,
                              },
                            ]}
                          >
                            {item.body}
                          </Text>

                          <View
                            style={[
                              styles.feedActions,
                              {
                                borderTopColor: colors.border,
                              },
                            ]}
                          >
                            <FeedAction
                              icon="heart-outline"
                              label="Curtir"
                            />

                            <FeedAction
                              icon="chatbubble-outline"
                              label="Comentar"
                            />

                            <FeedAction
                              icon="share-social-outline"
                              label="Compartilhar"
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      icon="newspaper-outline"
                      title="Nenhuma publicação"
                      description="Notícias e atualizações da empresa aparecerão aqui."
                    />
                  )}
                </SectionContainer>
              ) : null}

              {tab === "Alumni" ? (
                <SectionContainer
                  title="Pessoas da comunidade"
                  subtitle={
                    alumni.length > 0
                      ? "Alumni e estudantes que trabalham nessa empresa."
                      : undefined
                  }
                  count={alumni.length}
                >
                  {alumni.length > 0 ? (
                    <View
                      style={[
                        styles.cardsGrid,
                        {
                          gap: gridGap,
                        },
                      ]}
                    >
                      {alumni.map((user) => (
                        <Pressable
                          key={user.id}
                          onPress={() =>
                            router.push(`/user/${user.id}`)
                          }
                          style={({ pressed }) => [
                            styles.alumniCard,
                            {
                              width: cardWidth as never,
                              backgroundColor:
                                colors.surfaceSecondary,
                              borderColor: colors.border,
                              borderRadius: radius.lg ?? 18,
                              opacity: pressed ? 0.78 : 1,
                            },
                          ]}
                          testID={`company-alumni-${user.id}`}
                        >
                          <View
                            style={[
                              styles.avatarBorder,
                              {
                                borderColor: `${colors.brandPrimary}35`,
                              },
                            ]}
                          >
                            <Image
                              source={{
                                uri: user.avatarUrl,
                              }}
                              style={styles.alumniAvatar}
                              contentFit="cover"
                              transition={150}
                              cachePolicy="memory-disk"
                              accessibilityLabel={`Foto de ${user.name}`}
                            />
                          </View>

                          <View style={styles.alumniInfo}>
                            <Text
                              style={[
                                styles.alumniName,
                                {
                                  color: colors.onSurface,
                                  fontWeight:
                                    typography.weight.bold,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {user.name}
                            </Text>

                            <Text
                              style={[
                                styles.alumniCourse,
                                {
                                  color:
                                    colors.onSurfaceTertiary,
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {user.course}
                            </Text>

                            <View
                              style={[
                                styles.alumniBadge,
                                {
                                  backgroundColor: `${colors.brandPrimary}12`,
                                },
                              ]}
                            >
                              <Ionicons
                                name="school-outline"
                                size={12}
                                color={colors.brandPrimary}
                              />

                              <Text
                                style={[
                                  styles.alumniBadgeText,
                                  {
                                    color:
                                      colors.brandPrimary,
                                    fontWeight:
                                      typography.weight.semibold,
                                  },
                                ]}
                              >
                                Comunidade FECAP
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.alumniAction,
                              {
                                backgroundColor:
                                  colors.surface,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Ionicons
                              name="arrow-forward"
                              size={18}
                              color={colors.brandPrimary}
                            />
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      icon="people-outline"
                      title="Nenhum alumni encontrado"
                      description="Ainda não há pessoas da comunidade vinculadas a essa empresa."
                    />
                  )}
                </SectionContainer>
              ) : null}

              {tab === "Eventos" ? (
                <SectionContainer
                  title="Eventos da empresa"
                  subtitle={
                    events.length > 0
                      ? "Encontros, palestras e oportunidades de networking."
                      : undefined
                  }
                  count={events.length}
                >
                  {events.length > 0 ? (
                    <View
                      style={[
                        styles.cardsGrid,
                        {
                          gap: gridGap,
                        },
                      ]}
                    >
                      {events.map((event) => (
                        <Pressable
                          key={event.id}
                          style={({ pressed }) => [
                            styles.eventCard,
                            {
                              width: cardWidth as never,
                              backgroundColor:
                                colors.surfaceSecondary,
                              borderColor: colors.border,
                              borderRadius: radius.lg ?? 18,
                              opacity: pressed ? 0.78 : 1,
                            },
                          ]}
                          testID={`company-event-${event.id}`}
                        >
                          <View
                            style={[
                              styles.eventDateBlock,
                              {
                                backgroundColor: `${colors.brandPrimary}14`,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.eventDateDay,
                                {
                                  color: colors.brandPrimary,
                                  fontWeight:
                                    typography.weight.heavy,
                                },
                              ]}
                            >
                              {getEventDay(event.date)}
                            </Text>

                            <Text
                              style={[
                                styles.eventDateMonth,
                                {
                                  color: colors.brandPrimary,
                                  fontWeight:
                                    typography.weight.bold,
                                },
                              ]}
                            >
                              {getEventMonth(event.date)}
                            </Text>
                          </View>

                          <View style={styles.eventContent}>
                            <Text
                              style={[
                                styles.cardTitle,
                                {
                                  color: colors.onSurface,
                                  fontWeight:
                                    typography.weight.bold,
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {event.title}
                            </Text>

                            <View style={styles.eventInfoRow}>
                              <Ionicons
                                name="calendar-clear-outline"
                                size={15}
                                color={
                                  colors.onSurfaceTertiary
                                }
                              />

                              <Text
                                style={[
                                  styles.eventInfoText,
                                  {
                                    color:
                                      colors.onSurfaceTertiary,
                                  },
                                ]}
                              >
                                {formatEventDate(event.date)}
                              </Text>
                            </View>

                            <View style={styles.eventInfoRow}>
                              <Ionicons
                                name="location-outline"
                                size={15}
                                color={
                                  colors.onSurfaceTertiary
                                }
                              />

                              <Text
                                style={[
                                  styles.eventInfoText,
                                  {
                                    color:
                                      colors.onSurfaceTertiary,
                                  },
                                ]}
                                numberOfLines={2}
                              >
                                {event.location}
                              </Text>
                            </View>
                          </View>

                          <Ionicons
                            name="chevron-forward"
                            size={19}
                            color={colors.onSurfaceTertiary}
                          />
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      icon="calendar-outline"
                      title="Sem eventos por enquanto"
                      description="Os próximos eventos organizados pela empresa aparecerão aqui."
                    />
                  )}
                </SectionContainer>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CompanyLogo({
  companyName,
  logoUrl,
  companyColor,
  showLogo,
  logoSize,
  logoRadius,
  onError,
}: {
  companyName: string;
  logoUrl?: string;
  companyColor: string;
  showLogo: boolean;
  logoSize: number;
  logoRadius: number;
  onError: () => void;
}) {
  const { colors, typography } = useTheme();

  return (
    <View
      style={[
        styles.logoOuterContainer,
        styles.cardShadow,
        {
          width: logoSize,
          height: logoSize,
          borderRadius: logoRadius,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View
        style={[
          styles.logoInnerContainer,
          {
            borderRadius: logoRadius - 5,
            backgroundColor: showLogo
              ? "#FFFFFF"
              : companyColor,
            borderColor: colors.border,
          },
        ]}
      >
        {showLogo ? (
          <Image
            source={{ uri: logoUrl }}
            style={styles.companyLogo}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
            onError={onError}
            accessibilityLabel={`Logo da empresa ${companyName}`}
          />
        ) : (
          <Text
            style={[
              styles.logoFallbackText,
              {
                color: "#FFFFFF",
                fontSize: logoSize * 0.4,
                fontWeight: typography.weight.heavy,
              },
            ]}
          >
            {companyName.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
    </View>
  );
}

function CompanyMiniLogo({
  companyName,
  logoUrl,
  companyColor,
  showLogo,
}: {
  companyName: string;
  logoUrl?: string;
  companyColor: string;
  showLogo: boolean;
}) {
  const { colors, typography } = useTheme();

  return (
    <View
      style={[
        styles.feedCompanyLogo,
        {
          backgroundColor: showLogo ? "#FFFFFF" : companyColor,
          borderColor: colors.border,
        },
      ]}
    >
      {showLogo ? (
        <Image
          source={{ uri: logoUrl }}
          style={styles.feedLogoImage}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      ) : (
        <Text
          style={[
            styles.feedLogoFallback,
            {
              color: "#FFFFFF",
              fontWeight: typography.weight.heavy,
            },
          ]}
        >
          {companyName.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function CompanyMeta({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.metaChip,
        {
          backgroundColor: colors.surfaceSecondary,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={colors.onSurfaceTertiary}
      />

      <Text
        style={[
          styles.companyMetaText,
          {
            color: colors.onSurfaceTertiary,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function FollowButton({
  isFollowing,
  onPress,
  companyName,
}: {
  isFollowing: boolean;
  onPress: () => void;
  companyName: string;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.followButton,
        {
          backgroundColor: isFollowing
            ? colors.surfaceSecondary
            : colors.brandPrimary,
          borderColor: isFollowing
            ? colors.border
            : colors.brandPrimary,
          borderRadius: radius.md,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        isFollowing
          ? `Deixar de seguir ${companyName}`
          : `Seguir ${companyName}`
      }
      accessibilityState={{
        selected: isFollowing,
      }}
      testID="company-follow-button"
    >
      <Ionicons
        name={isFollowing ? "checkmark" : "add"}
        size={19}
        color={
          isFollowing
            ? colors.onSurface
            : colors.onBrandPrimary
        }
      />

      <Text
        style={[
          styles.followButtonText,
          {
            color: isFollowing
              ? colors.onSurface
              : colors.onBrandPrimary,
            fontWeight: typography.weight.bold,
          },
        ]}
      >
        {isFollowing ? "Seguindo" : "Seguir"}
      </Text>
    </Pressable>
  );
}

function MessageButton({
  companyName,
  showLabel,
}: {
  companyName: string;
  showLabel: boolean;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.messageButton,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.md,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Enviar mensagem para ${companyName}`}
      testID="company-message-button"
    >
      <Ionicons
        name="chatbubble-ellipses-outline"
        size={19}
        color={colors.onSurface}
      />

      {showLabel ? (
        <Text
          style={[
            styles.messageButtonText,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.semibold,
            },
          ]}
        >
          Mensagem
        </Text>
      ) : null}
    </Pressable>
  );
}

function InsightCard({
  icon,
  title,
  description,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  testID: string;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.insightCard,
        {
          backgroundColor: `${colors.brandPrimary}0D`,
          borderColor: `${colors.brandPrimary}28`,
          borderRadius: radius.lg ?? 18,
        },
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.insightIcon,
          {
            backgroundColor: `${colors.brandPrimary}18`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={colors.brandPrimary}
        />
      </View>

      <View style={styles.insightContent}>
        <Text
          style={[
            styles.insightTitle,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.insightDescription,
            {
              color: colors.onSurfaceSecondary,
            },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

function SectionContainer({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  children: React.ReactNode;
}) {
  const { colors, typography } = useTheme();

  return (
    <View>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionHeadingText}>
          <View style={styles.sectionTitleRow}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.onSurface,
                  fontWeight: typography.weight.heavy,
                },
              ]}
            >
              {title}
            </Text>

            {typeof count === "number" ? (
              <View
                style={[
                  styles.sectionCount,
                  {
                    backgroundColor:
                      colors.surfaceSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sectionCountText,
                    {
                      color: colors.onSurfaceTertiary,
                      fontWeight:
                        typography.weight.bold,
                    },
                  ]}
                >
                  {count}
                </Text>
              </View>
            ) : null}
          </View>

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

function AboutTab({
  description,
  jobsCount,
  alumniCount,
  eventsCount,
  employeesCount,
  industry,
  isMobile,
}: {
  description: string;
  jobsCount: number;
  alumniCount: number;
  eventsCount: number;
  employeesCount: number;
  industry: string;
  isMobile: boolean;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View style={styles.aboutLayout}>
      <View
        style={[
          styles.aboutCard,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
            borderRadius: radius.lg ?? 18,
          },
        ]}
      >
        <View
          style={[
            styles.aboutIconContainer,
            {
              backgroundColor: `${colors.brandPrimary}14`,
            },
          ]}
        >
          <Ionicons
            name="business-outline"
            size={22}
            color={colors.brandPrimary}
          />
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.heavy,
            },
          ]}
        >
          Sobre a empresa
        </Text>

        <Text
          style={[
            styles.aboutDescription,
            {
              color: colors.onSurfaceSecondary,
            },
          ]}
        >
          {description ||
            "Essa empresa ainda não adicionou uma descrição detalhada."}
        </Text>

        <View
          style={[
            styles.aboutDivider,
            {
              backgroundColor: colors.border,
            },
          ]}
        />

        <View style={styles.aboutDetails}>
          <AboutDetail
            icon="layers-outline"
            label="Setor"
            value={industry}
          />

          <AboutDetail
            icon="people-outline"
            label="Porte estimado"
            value={`${formatCount(
              employeesCount,
            )} funcionários`}
          />
        </View>
      </View>

      <View>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.heavy,
            },
          ]}
        >
          Visão geral
        </Text>

        <Text
          style={[
            styles.sectionSubtitle,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
        >
          Informações disponíveis na plataforma.
        </Text>

        <View
          style={[
            styles.statGrid,
            {
              flexDirection: isMobile ? "row" : "row",
            },
          ]}
        >
          <Stat
            icon="briefcase-outline"
            n={jobsCount}
            label="Vagas"
          />

          <Stat
            icon="people-outline"
            n={alumniCount}
            label="Alumni"
          />

          <Stat
            icon="calendar-outline"
            n={eventsCount}
            label="Eventos"
          />
        </View>
      </View>
    </View>
  );
}

function AboutDetail({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.aboutDetail}>
      <View
        style={[
          styles.aboutDetailIcon,
          {
            backgroundColor: `${colors.brandPrimary}12`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={colors.brandPrimary}
        />
      </View>

      <View style={styles.aboutDetailText}>
        <Text
          style={[
            styles.aboutDetailLabel,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.aboutDetailValue,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.semibold,
            },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function Stat({
  icon,
  n,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  n: number;
  label: string;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg ?? 18,
        },
      ]}
    >
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: `${colors.brandPrimary}14`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={colors.brandPrimary}
        />
      </View>

      <Text
        style={[
          styles.statNumber,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.heavy,
          },
        ]}
      >
        {n}
      </Text>

      <Text
        style={[
          styles.statLabel,
          {
            color: colors.onSurfaceTertiary,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function SmallChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const { colors, typography } = useTheme();

  return (
    <View
      style={[
        styles.smallChip,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={13}
        color={colors.onSurfaceTertiary}
      />

      <Text
        style={[
          styles.smallChipText,
          {
            color: colors.onSurfaceSecondary,
            fontWeight: typography.weight.semibold,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function FeedAction({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const { colors, typography } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.feedAction,
        {
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={colors.onSurfaceTertiary}
      />

      <Text
        style={[
          styles.feedActionText,
          {
            color: colors.onSurfaceTertiary,
            fontWeight: typography.weight.semibold,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.emptyState,
        {
          borderColor: colors.border,
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.lg ?? 18,
        },
      ]}
    >
      <View
        style={[
          styles.emptyStateGlow,
          {
            backgroundColor: `${colors.brandPrimary}0D`,
          },
        ]}
      >
        <View
          style={[
            styles.emptyStateIcon,
            {
              backgroundColor: `${colors.brandPrimary}16`,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={30}
            color={colors.brandPrimary}
          />
        </View>
      </View>

      <Text
        style={[
          styles.emptyStateTitle,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.bold,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.emptyStateDescription,
          {
            color: colors.onSurfaceTertiary,
          },
        ]}
      >
        {description}
      </Text>
    </View>
  );
}

function CompanyNotFound({
  onBack,
}: {
  onBack: () => void;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View style={styles.notFoundContainer}>
      <View
        style={[
          styles.notFoundIconOuter,
          {
            backgroundColor: `${colors.brandPrimary}0D`,
          },
        ]}
      >
        <View
          style={[
            styles.notFoundIcon,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="business-outline"
            size={38}
            color={colors.brandPrimary}
          />
        </View>
      </View>

      <Text
        style={[
          styles.notFoundTitle,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.heavy,
          },
        ]}
      >
        Empresa não encontrada
      </Text>

      <Text
        style={[
          styles.notFoundDescription,
          {
            color: colors.onSurfaceTertiary,
          },
        ]}
      >
        Não foi possível localizar os dados dessa empresa.
        Verifique o endereço acessado ou volte para a tela
        anterior.
      </Text>

      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.notFoundButton,
          {
            backgroundColor: colors.brandPrimary,
            borderRadius: radius.md,
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <Ionicons
          name="arrow-back"
          size={18}
          color={colors.onBrandPrimary}
        />

        <Text
          style={[
            styles.notFoundButtonText,
            {
              color: colors.onBrandPrimary,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          Voltar
        </Text>
      </Pressable>
    </View>
  );
}

function getTabCount(
  tab: CompanyTab,
  counts: TabCounts,
): number | null {
  switch (tab) {
    case "Vagas":
      return counts.jobs;

    case "Feed":
      return counts.feed;

    case "Alumni":
      return counts.alumni;

    case "Eventos":
      return counts.events;

    default:
      return null;
  }
}

const formatCount = (value: number) => {
  if (value >= 1_000_000) {
    const formatted = value / 1_000_000;

    return `${
      Number.isInteger(formatted)
        ? formatted
        : formatted.toFixed(1)
    } mi+`;
  }

  if (value >= 1_000) {
    const formatted = value / 1_000;

    return `${
      Number.isInteger(formatted)
        ? formatted
        : formatted.toFixed(1)
    } mil+`;
  }

  return String(value);
};

const parseEventDate = (date: string | Date) => {
  const parsedDate = new Date(date);

  return Number.isNaN(parsedDate.getTime())
    ? null
    : parsedDate;
};

const formatEventDate = (date: string | Date) => {
  const parsedDate = parseEventDate(date);

  if (!parsedDate) {
    return "Data a definir";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
};

const getEventDay = (date: string | Date) => {
  const parsedDate = parseEventDate(date);

  if (!parsedDate) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
  }).format(parsedDate);
};

const getEventMonth = (date: string | Date) => {
  const parsedDate = parseEventDate(date);

  if (!parsedDate) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
  })
    .format(parsedDate)
    .replace(".", "")
    .toUpperCase();
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  page: {
    width: "100%",
    alignSelf: "center",
  },

  coverContainer: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },

  floatingButton: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(5,10,18,0.56)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.32)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  backButton: {
    top: 16,
    left: 16,
  },

  coverBottomContent: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },

  coverBadge: {
    minHeight: 30,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.46)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  coverBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
  },

  coverIndustry: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    marginTop: 9,
  },

  body: {
    width: "100%",
    zIndex: 2,
  },

  profileCard: {
    width: "100%",
    borderWidth: 1,
  },

  cardShadow: Platform.select({
    web: {
      boxShadow: "0px 14px 40px rgba(0,0,0,0.12)",
    } as never,

    default: {
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 5,
    },
  }),

  companyHeader: {
    width: "100%",
    flexDirection: "row",
    gap: 16,
  },

  logoOuterContainer: {
    flexShrink: 0,
    padding: 4,
  },

  logoInnerContainer: {
    flex: 1,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  companyLogo: {
    width: "80%",
    height: "80%",
  },

  logoFallbackText: {
    textAlign: "center",
  },

  companyHeading: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 4,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  companyName: {
    flexShrink: 1,
    letterSpacing: -0.65,
  },

  verifiedIcon: {
    width: 21,
    height: 21,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  companyIndustry: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  companyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },

  metaChip: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  companyMetaText: {
    fontSize: 11,
    lineHeight: 15,
  },

  desktopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginLeft: 10,
  },

  mobileActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 17,
  },

  followButton: {
    minHeight: 45,
    minWidth: 118,
    paddingHorizontal: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  followButtonText: {
    fontSize: 13,
  },

  messageButton: {
    minHeight: 45,
    minWidth: 48,
    paddingHorizontal: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  messageButtonText: {
    fontSize: 13,
  },

  insightsGrid: {
    width: "100%",
    gap: 12,
    marginTop: 16,
  },

  insightCard: {
    flex: 1,
    minWidth: 0,
    padding: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  insightContent: {
    flex: 1,
    minWidth: 0,
  },

  insightTitle: {
    fontSize: 13,
    lineHeight: 18,
  },

  insightDescription: {
    fontSize: 12,
    lineHeight: 19,
    marginTop: 3,
  },

  tabsWrapper: {
    width: "100%",
    borderBottomWidth: 1,
    marginTop: 18,
  },

  tabsContent: {
    minWidth: "100%",
    gap: 4,
  },

  tabButton: {
    minHeight: 52,
    paddingHorizontal: 13,
    borderBottomWidth: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  tabButtonText: {
    fontSize: 12,
  },

  tabCount: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  tabCountText: {
    fontSize: 10,
  },

  tabContent: {
    width: "100%",
    paddingTop: 24,
    paddingBottom: 32,
  },

  sectionHeading: {
    width: "100%",
    marginBottom: 16,
  },

  sectionHeadingText: {
    flex: 1,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  sectionTitle: {
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  sectionCount: {
    minWidth: 28,
    height: 25,
    paddingHorizontal: 8,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionCountText: {
    fontSize: 11,
  },

  aboutLayout: {
    width: "100%",
    gap: 24,
  },

  aboutCard: {
    width: "100%",
    padding: 18,
    borderWidth: 1,
  },

  aboutIconContainer: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  aboutDescription: {
    fontSize: 14,
    lineHeight: 23,
    marginTop: 9,
  },

  aboutDivider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
  },

  aboutDetails: {
    width: "100%",
    gap: 13,
  },

  aboutDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  aboutDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  aboutDetailText: {
    flex: 1,
    minWidth: 0,
  },

  aboutDetailLabel: {
    fontSize: 10,
    lineHeight: 14,
    textTransform: "uppercase",
    letterSpacing: 0.55,
  },

  aboutDetailValue: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },

  statGrid: {
    width: "100%",
    gap: 10,
    marginTop: 15,
  },

  statCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 130,
    padding: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  statNumber: {
    fontSize: 22,
    lineHeight: 27,
  },

  statLabel: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
    textAlign: "center",
  },

  cardsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
  },

  jobCard: {
    minWidth: 0,
    minHeight: 220,
    padding: 17,
    borderWidth: 1,
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  cardArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    fontSize: 15,
    lineHeight: 21,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },

  smallChip: {
    maxWidth: "100%",
    minHeight: 29,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  smallChipText: {
    maxWidth: 150,
    fontSize: 10,
  },

  cardFooter: {
    flex: 1,
    minHeight: 55,
    marginTop: 17,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  salaryContainer: {
    flex: 1,
  },

  salaryLabel: {
    fontSize: 10,
    lineHeight: 14,
  },

  jobSalary: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },

  feedList: {
    width: "100%",
    gap: 13,
  },

  feedCard: {
    width: "100%",
    padding: 17,
    borderWidth: 1,
  },

  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  feedCompanyLogo: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  feedLogoImage: {
    width: "76%",
    height: "76%",
  },

  feedLogoFallback: {
    fontSize: 18,
  },

  feedHeading: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  feedCompanyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  feedCompanyName: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  feedSubtitle: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 1,
  },

  feedTitle: {
    fontSize: 16,
    lineHeight: 22,
  },

  feedBody: {
    fontSize: 13,
    lineHeight: 22,
    marginTop: 8,
  },

  feedActions: {
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  feedAction: {
    minHeight: 36,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  feedActionText: {
    fontSize: 11,
  },

  alumniCard: {
    minWidth: 0,
    minHeight: 96,
    padding: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  avatarBorder: {
    width: 58,
    height: 58,
    padding: 2,
    borderRadius: 29,
    borderWidth: 2,
    flexShrink: 0,
  },

  alumniAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 27,
  },

  alumniInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },

  alumniName: {
    fontSize: 14,
    lineHeight: 19,
  },

  alumniCourse: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  alumniBadge: {
    alignSelf: "flex-start",
    minHeight: 23,
    paddingHorizontal: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },

  alumniBadgeText: {
    fontSize: 9,
  },

  alumniAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  eventCard: {
    minWidth: 0,
    minHeight: 128,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  eventDateBlock: {
    width: 58,
    height: 66,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  eventDateDay: {
    fontSize: 21,
    lineHeight: 24,
  },

  eventDateMonth: {
    fontSize: 9,
    letterSpacing: 0.7,
    marginTop: 2,
  },

  eventContent: {
    flex: 1,
    minWidth: 0,
  },

  eventInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 7,
  },

  eventInfoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },

  emptyState: {
    width: "100%",
    minHeight: 270,
    paddingHorizontal: 24,
    paddingVertical: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyStateGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyStateIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyStateTitle: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 15,
    textAlign: "center",
  },

  emptyStateDescription: {
    maxWidth: 360,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
    textAlign: "center",
  },

  notFoundContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  notFoundIconOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  notFoundIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  notFoundTitle: {
    fontSize: 21,
    lineHeight: 27,
    marginTop: 18,
    textAlign: "center",
  },

  notFoundDescription: {
    maxWidth: 410,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 7,
    textAlign: "center",
  },

  notFoundButton: {
    minHeight: 46,
    marginTop: 22,
    paddingHorizontal: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  notFoundButtonText: {
    fontSize: 14,
  },
});