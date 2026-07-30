import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Keyboard,
  ListRenderItemInfo,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  COMPANIES,
  JOBS,
  USERS,
  companyById,
} from "@/src/services/mock-data";
import { sortCompaniesForFecap } from "@/src/services/recommendation";
import { useTheme } from "@/src/theme/ThemeContext";

type SearchFilter =
  | "all"
  | "fecap"
  | "tech"
  | "finance"
  | "consulting";

type ResultTypeFilter =
  | "all"
  | "company"
  | "user"
  | "job";

type ItemKind = Exclude<ResultTypeFilter, "all">;

type SearchItem = {
  kind: ItemKind;
  id: string;
  title: string;
  sub: string;
  description?: string;
  avatar?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isFecapPartner?: boolean;
  metadata?: string;
  color?: string;
  searchText: string;
};

type SearchFilterOption = {
  key: SearchFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type ResultTypeOption = {
  key: ResultTypeFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const SEARCH_FILTERS: SearchFilterOption[] = [
  {
    key: "all",
    label: "Todos os setores",
    icon: "apps-outline",
  },
  {
    key: "fecap",
    label: "Parceiros FECAP",
    icon: "school-outline",
  },
  {
    key: "tech",
    label: "Tecnologia",
    icon: "hardware-chip-outline",
  },
  {
    key: "finance",
    label: "Finanças",
    icon: "wallet-outline",
  },
  {
    key: "consulting",
    label: "Consultoria",
    icon: "briefcase-outline",
  },
];

const RESULT_TYPE_FILTERS: ResultTypeOption[] = [
  {
    key: "all",
    label: "Tudo",
    icon: "search-outline",
  },
  {
    key: "company",
    label: "Empresas",
    icon: "business-outline",
  },
  {
    key: "user",
    label: "Pessoas",
    icon: "people-outline",
  },
  {
    key: "job",
    label: "Vagas",
    icon: "briefcase-outline",
  },
];

const INITIAL_RECENT_SEARCHES = [
  "Desenvolvedor Front-end",
  "IBM",
  "Estágio em tecnologia",
];

const MAX_RESULTS_WITHOUT_QUERY = 30;
const MAX_RESULTS_WITH_QUERY = 100;
const MAX_CONTENT_WIDTH = 960;
const DESKTOP_BREAKPOINT = 820;

export default function Search() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const { width } = useWindowDimensions();

  const {
    colors,
    typography,
    radius,
  } = useTheme();

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<SearchFilter>("all");
  const [resultType, setResultType] =
    useState<ResultTypeFilter>("all");
  const [recentSearches, setRecentSearches] = useState(
    INITIAL_RECENT_SEARCHES,
  );
  const [failedImages, setFailedImages] = useState<
    Record<string, boolean>
  >({});

  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const normalizedQuery = useMemo(
    () => normalizeText(query.trim()),
    [query],
  );

  const filteredCompanies = useMemo(() => {
    const companies = COMPANIES.filter((company) => {
      const companySearchText = normalizeText(
        [
          company.name,
          company.industry,
          company.description,
          company.tags?.join(" "),
        ]
          .filter(Boolean)
          .join(" "),
      );

      const matchesSector = companyMatchesFilter(
        company,
        activeFilter,
      );

      const matchesQuery =
        !normalizedQuery ||
        companySearchText.includes(normalizedQuery);

      return matchesSector && matchesQuery;
    });

    return sortCompaniesForFecap(companies);
  }, [activeFilter, normalizedQuery]);

  const companyItems = useMemo<SearchItem[]>(() => {
    return filteredCompanies.map((company) => ({
      kind: "company",
      id: company.id,
      title: company.name,
      sub: company.industry,
      description: company.description,
      avatar: company.logoUrl ?? company.logo,
      color: company.color,
      isFecapPartner: company.isFecapPartner,
      metadata: company.employeesCount
        ? `${formatCompactNumber(
            company.employeesCount,
          )} funcionários`
        : undefined,
      searchText: normalizeText(
        [
          company.name,
          company.industry,
          company.description,
          company.tags?.join(" "),
        ]
          .filter(Boolean)
          .join(" "),
      ),
    }));
  }, [filteredCompanies]);

  const userItems = useMemo<SearchItem[]>(() => {
    return USERS.map((user) => {
      const currentCompany = user.companyCurrent
        ? companyById(user.companyCurrent)
        : undefined;

      return {
        kind: "user",
        id: user.id,
        title: user.name,
        sub: user.course || "Aluno FECAP",
        description: currentCompany
          ? `Atualmente na ${currentCompany.name}`
          : undefined,
        avatar: user.avatarUrl,
        metadata: currentCompany?.name,
        searchText: normalizeText(
          [
            user.name,
            user.course,
            currentCompany?.name,
          ]
            .filter(Boolean)
            .join(" "),
        ),
      };
    });
  }, []);

  const jobItems = useMemo<SearchItem[]>(() => {
    return JOBS.map((job) => {
      const company = companyById(job.companyId);

      const jobMetadata = [
        job.seniority,
        job.workModel,
        job.salary,
      ]
        .filter(Boolean)
        .join(" • ");

      return {
        kind: "job",
        id: job.id,
        title: job.title,
        sub: company?.name ?? "Empresa não informada",
        description: jobMetadata,
        avatar: company?.logoUrl ?? company?.logo,
        color: company?.color,
        icon: "briefcase-outline",
        isFecapPartner: company?.isFecapPartner,
        metadata: jobMetadata,
        searchText: normalizeText(
          [
            job.title,
            company?.name,
            company?.industry,
            job.seniority,
            job.workModel,
            job.salary,
          ]
            .filter(Boolean)
            .join(" "),
        ),
      };
    });
  }, []);

  const results = useMemo<SearchItem[]>(() => {
    const baseItems: SearchItem[] = [];

    if (resultType === "all" || resultType === "company") {
      baseItems.push(...companyItems);
    }

    if (resultType === "all" || resultType === "user") {
      baseItems.push(...userItems);
    }

    if (resultType === "all" || resultType === "job") {
      baseItems.push(...jobItems);
    }

    const queryFilteredItems = normalizedQuery
      ? baseItems.filter((item) =>
          item.searchText.includes(normalizedQuery),
        )
      : baseItems;

    const sortedItems = [...queryFilteredItems].sort((a, b) => {
      if (normalizedQuery) {
        const aStarts = normalizeText(a.title).startsWith(
          normalizedQuery,
        );
        const bStarts = normalizeText(b.title).startsWith(
          normalizedQuery,
        );

        if (aStarts !== bStarts) {
          return aStarts ? -1 : 1;
        }

        const aExact =
          normalizeText(a.title) === normalizedQuery;
        const bExact =
          normalizeText(b.title) === normalizedQuery;

        if (aExact !== bExact) {
          return aExact ? -1 : 1;
        }
      }

      if (
        a.kind === "company" &&
        b.kind === "company" &&
        a.isFecapPartner !== b.isFecapPartner
      ) {
        return a.isFecapPartner ? -1 : 1;
      }

      return a.title.localeCompare(b.title, "pt-BR");
    });

    const limit = normalizedQuery
      ? MAX_RESULTS_WITH_QUERY
      : MAX_RESULTS_WITHOUT_QUERY;

    return sortedItems.slice(0, limit);
  }, [
    companyItems,
    jobItems,
    normalizedQuery,
    resultType,
    userItems,
  ]);

  const resultCounts = useMemo(() => {
    return results.reduce(
      (accumulator, item) => {
        accumulator[item.kind] += 1;
        accumulator.all += 1;

        return accumulator;
      },
      {
        all: 0,
        company: 0,
        user: 0,
        job: 0,
      },
    );
  }, [results]);

  const handleOpenResult = useCallback(
    (item: SearchItem) => {
      Keyboard.dismiss();

      const trimmedQuery = query.trim();

      if (trimmedQuery) {
        setRecentSearches((current) => {
          const withoutDuplicate = current.filter(
            (search) =>
              normalizeText(search) !==
              normalizeText(trimmedQuery),
          );

          return [
            trimmedQuery,
            ...withoutDuplicate,
          ].slice(0, 5);
        });
      }

      if (item.kind === "company") {
        router.push(`/company/${item.id}`);
        return;
      }

      if (item.kind === "job") {
        router.push(`/job/${item.id}`);
        return;
      }

      router.push(`/user/${item.id}`);
    },
    [query, router],
  );

  const handleClearQuery = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  const handleSelectRecentSearch = useCallback(
    (search: string) => {
      setQuery(search);
      inputRef.current?.focus();
    },
    [],
  );

  const handleRemoveRecentSearch = useCallback(
    (search: string) => {
      setRecentSearches((current) =>
        current.filter((item) => item !== search),
      );
    },
    [],
  );

  const handleClearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const handleImageError = useCallback(
    (item: SearchItem) => {
      const key = `${item.kind}-${item.id}`;

      setFailedImages((current) => ({
        ...current,
        [key]: true,
      }));
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SearchItem>) => {
      const imageKey = `${item.kind}-${item.id}`;
      const imageFailed = failedImages[imageKey];

      return (
        <SearchResultCard
          item={item}
          imageFailed={imageFailed}
          isDesktop={isDesktop}
          onPress={() => handleOpenResult(item)}
          onImageError={() => handleImageError(item)}
        />
      );
    },
    [
      failedImages,
      handleImageError,
      handleOpenResult,
      isDesktop,
    ],
  );

  const listHeader = useMemo(() => {
    return (
      <View style={styles.resultsHeader}>
        <View style={styles.resultsHeadingRow}>
          <View style={styles.resultsHeadingContent}>
            <Text
              style={[
                styles.resultsTitle,
                {
                  color: colors.onSurface,
                  fontWeight: typography.weight.heavy,
                },
              ]}
            >
              {normalizedQuery
                ? "Resultados da pesquisa"
                : "Descubra oportunidades"}
            </Text>

            <Text
              style={[
                styles.resultsDescription,
                {
                  color: colors.onSurfaceTertiary,
                },
              ]}
            >
              {results.length === 1
                ? "1 resultado encontrado"
                : `${results.length} resultados encontrados`}
            </Text>
          </View>

          {Boolean(normalizedQuery) && (
            <View
              style={[
                styles.queryBadge,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                  borderRadius: radius.full ?? 999,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={13}
                color={colors.brandPrimary}
              />

              <Text
                numberOfLines={1}
                style={[
                  styles.queryBadgeText,
                  {
                    color: colors.onSurfaceSecondary,
                    fontWeight: typography.weight.semibold,
                  },
                ]}
              >
                {query.trim()}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [
    colors,
    normalizedQuery,
    query,
    radius,
    results.length,
    typography,
  ]);

  const emptyComponent = useMemo(() => {
    return (
      <EmptyResults
        query={query}
        hasSectorFilter={activeFilter !== "all"}
        hasTypeFilter={resultType !== "all"}
        onReset={() => {
          setQuery("");
          setActiveFilter("all");
          setResultType("all");
          inputRef.current?.focus();
        }}
      />
    );
  }, [activeFilter, query, resultType]);

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: colors.surface,
        },
      ]}
      edges={["top"]}
      testID="search-screen"
    >
      <View
        style={[
          styles.page,
          {
            maxWidth: MAX_CONTENT_WIDTH,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            testID="search-back-button"
          >
            <Ionicons
              name="chevron-back"
              size={23}
              color={colors.onSurface}
            />
          </Pressable>

          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: query
                  ? colors.brandPrimary
                  : colors.border,
                borderRadius: radius.full ?? 999,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={19}
              color={
                query
                  ? colors.brandPrimary
                  : colors.onSurfaceTertiary
              }
            />

            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Pessoas, empresas, vagas..."
              placeholderTextColor={colors.onSurfaceTertiary}
              style={[
                styles.searchInput,
                {
                  color: colors.onSurface,
                },
              ]}
              selectionColor={colors.brandPrimary}
              autoFocus={!isDesktop}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="never"
              onSubmitEditing={() => Keyboard.dismiss()}
              accessibilityLabel="Campo de pesquisa"
              testID="search-input"
            />

            {query.length > 0 && (
              <Pressable
                onPress={handleClearQuery}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.clearButton,
                  {
                    backgroundColor: colors.surfaceTertiary,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Limpar pesquisa"
                testID="search-clear-button"
              >
                <Ionicons
                  name="close"
                  size={15}
                  color={colors.onSurfaceSecondary}
                />
              </Pressable>
            )}
          </View>
        </View>

        <View
          style={[
            styles.filtersSection,
            {
              borderBottomColor: colors.border,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeFiltersContent}
            keyboardShouldPersistTaps="handled"
          >
            {RESULT_TYPE_FILTERS.map((filter) => {
              const active = resultType === filter.key;
              const count = resultCounts[filter.key];

              return (
                <Pressable
                  key={filter.key}
                  onPress={() => setResultType(filter.key)}
                  style={({ pressed }) => [
                    styles.typeFilterButton,
                    {
                      backgroundColor: active
                        ? colors.brandPrimary
                        : colors.surfaceSecondary,
                      borderColor: active
                        ? colors.brandPrimary
                        : colors.border,
                      borderRadius: radius.full ?? 999,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  testID={`search-type-filter-${filter.key}`}
                >
                  <Ionicons
                    name={filter.icon}
                    size={15}
                    color={
                      active
                        ? colors.onBrandPrimary
                        : colors.onSurfaceSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.typeFilterLabel,
                      {
                        color: active
                          ? colors.onBrandPrimary
                          : colors.onSurface,
                        fontWeight: typography.weight.semibold,
                      },
                    ]}
                  >
                    {filter.label}
                  </Text>

                  <View
                    style={[
                      styles.filterCount,
                      {
                        backgroundColor: active
                          ? `${colors.onBrandPrimary}26`
                          : colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        {
                          color: active
                            ? colors.onBrandPrimary
                            : colors.onSurfaceTertiary,
                          fontWeight: typography.weight.bold,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectorFiltersContent}
            keyboardShouldPersistTaps="handled"
          >
            {SEARCH_FILTERS.map((filter) => {
              const active = activeFilter === filter.key;

              return (
                <Pressable
                  key={filter.key}
                  onPress={() => setActiveFilter(filter.key)}
                  style={({ pressed }) => [
                    styles.sectorFilterButton,
                    {
                      backgroundColor: active
                        ? `${colors.brandPrimary}14`
                        : "transparent",
                      borderColor: active
                        ? colors.brandPrimary
                        : colors.border,
                      borderRadius: radius.full ?? 999,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  testID={`search-sector-filter-${filter.key}`}
                >
                  <Ionicons
                    name={filter.icon}
                    size={14}
                    color={
                      active
                        ? colors.brandPrimary
                        : colors.onSurfaceTertiary
                    }
                  />

                  <Text
                    style={[
                      styles.sectorFilterText,
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
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {!query.trim() && recentSearches.length > 0 && (
          <RecentSearches
            searches={recentSearches}
            onSelect={handleSelectRecentSearch}
            onRemove={handleRemoveRecentSearch}
            onClear={handleClearRecentSearches}
          />
        )}

        <FlatList
          data={results}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyComponent}
          ItemSeparatorComponent={() => (
            <View style={styles.itemSeparator} />
          )}
          contentContainerStyle={[
            styles.listContent,
            results.length === 0 &&
              styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
          removeClippedSubviews={
            Platform.OS !== "web"
          }
          testID="search-results-list"
        />
      </View>
    </SafeAreaView>
  );
}

function SearchResultCard({
  item,
  imageFailed,
  isDesktop,
  onPress,
  onImageError,
}: {
  item: SearchItem;
  imageFailed: boolean;
  isDesktop: boolean;
  onPress: () => void;
  onImageError: () => void;
}) {
  const {
    colors,
    typography,
    radius,
  } = useTheme();

  const showImage = Boolean(item.avatar) && !imageFailed;
  const isUser = item.kind === "user";

  const label =
    item.kind === "company"
      ? "Empresa"
      : item.kind === "user"
        ? "Pessoa"
        : "Vaga";

  const typeIcon: keyof typeof Ionicons.glyphMap =
    item.kind === "company"
      ? "business-outline"
      : item.kind === "user"
        ? "person-outline"
        : "briefcase-outline";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.resultCard,
        {
          backgroundColor:
            hovered && Platform.OS === "web"
              ? colors.surfaceTertiary
              : colors.surfaceSecondary,
          borderColor: hovered
            ? colors.brandPrimary
            : colors.border,
          borderRadius: radius.md,
          padding: isDesktop ? 15 : 12,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${item.title}`}
      testID={`search-result-${item.kind}-${item.id}`}
    >
      <ResultAvatar
        item={item}
        showImage={showImage}
        isUser={isUser}
        onImageError={onImageError}
      />

      <View style={styles.resultMainContent}>
        <View style={styles.resultTitleRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.resultTitle,
              {
                color: colors.onSurface,
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            {item.title}
          </Text>

          {item.isFecapPartner && (
            <View
              style={[
                styles.fecapBadge,
                {
                  backgroundColor: colors.brandSecondary,
                  borderRadius: radius.full ?? 999,
                },
              ]}
            >
              <Ionicons
                name="school"
                size={10}
                color={colors.onBrandSecondary}
              />

              <Text
                style={[
                  styles.fecapBadgeText,
                  {
                    color: colors.onBrandSecondary,
                    fontWeight: typography.weight.bold,
                  },
                ]}
              >
                FECAP
              </Text>
            </View>
          )}
        </View>

        <Text
          numberOfLines={1}
          style={[
            styles.resultSubtitle,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
        >
          {item.sub}
        </Text>

        {item.description ? (
          <Text
            numberOfLines={1}
            style={[
              styles.resultDescription,
              {
                color: colors.onSurfaceSecondary,
              },
            ]}
          >
            {item.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.resultRightContent}>
        <View
          style={[
            styles.resultTypeBadge,
            {
              backgroundColor: colors.surfaceTertiary,
              borderRadius: radius.sm,
            },
          ]}
        >
          <Ionicons
            name={typeIcon}
            size={11}
            color={colors.onSurfaceTertiary}
          />

          {isDesktop && (
            <Text
              style={[
                styles.resultTypeText,
                {
                  color: colors.onSurfaceTertiary,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              {label}
            </Text>
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.onSurfaceTertiary}
        />
      </View>
    </Pressable>
  );
}

function ResultAvatar({
  item,
  showImage,
  isUser,
  onImageError,
}: {
  item: SearchItem;
  showImage: boolean;
  isUser: boolean;
  onImageError: () => void;
}) {
  const {
    colors,
    typography,
  } = useTheme();

  const initials = getInitials(item.title);

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          borderRadius: isUser ? 26 : 13,
          backgroundColor: showImage
            ? "#FFFFFF"
            : item.color ||
              colors.brandSecondary,
          borderColor: colors.border,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: item.avatar }}
          style={
            isUser
              ? styles.userAvatarImage
              : styles.companyAvatarImage
          }
          contentFit={isUser ? "cover" : "contain"}
          transition={180}
          cachePolicy="memory-disk"
          onError={onImageError}
          accessibilityLabel={`Imagem de ${item.title}`}
        />
      ) : item.kind === "job" && !item.avatar ? (
        <Ionicons
          name={item.icon ?? "briefcase-outline"}
          size={21}
          color={colors.onBrandSecondary}
        />
      ) : (
        <Text
          style={[
            styles.avatarInitials,
            {
              color: "#FFFFFF",
              fontWeight: typography.weight.heavy,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

function RecentSearches({
  searches,
  onSelect,
  onRemove,
  onClear,
}: {
  searches: string[];
  onSelect: (search: string) => void;
  onRemove: (search: string) => void;
  onClear: () => void;
}) {
  const {
    colors,
    typography,
  } = useTheme();

  return (
    <View
      style={[
        styles.recentSection,
        {
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.recentHeader}>
        <View style={styles.recentTitleContainer}>
          <Ionicons
            name="time-outline"
            size={17}
            color={colors.onSurfaceTertiary}
          />

          <Text
            style={[
              styles.recentTitle,
              {
                color: colors.onSurface,
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            Pesquisas recentes
          </Text>
        </View>

        <Pressable
          onPress={onClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Limpar pesquisas recentes"
        >
          <Text
            style={[
              styles.clearRecentText,
              {
                color: colors.brandPrimary,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            Limpar
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentItemsContent}
        keyboardShouldPersistTaps="handled"
      >
        {searches.map((search) => (
          <View
            key={search}
            style={[
              styles.recentItem,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Pressable
              onPress={() => onSelect(search)}
              style={({ pressed }) => [
                styles.recentSearchButton,
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={13}
                color={colors.onSurfaceTertiary}
              />

              <Text
                numberOfLines={1}
                style={[
                  styles.recentSearchText,
                  {
                    color: colors.onSurfaceSecondary,
                  },
                ]}
              >
                {search}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onRemove(search)}
              hitSlop={8}
              style={styles.removeRecentButton}
              accessibilityRole="button"
              accessibilityLabel={`Remover pesquisa ${search}`}
            >
              <Ionicons
                name="close"
                size={13}
                color={colors.onSurfaceTertiary}
              />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function EmptyResults({
  query,
  hasSectorFilter,
  hasTypeFilter,
  onReset,
}: {
  query: string;
  hasSectorFilter: boolean;
  hasTypeFilter: boolean;
  onReset: () => void;
}) {
  const {
    colors,
    typography,
    radius,
  } = useTheme();

  const hasFilters =
    hasSectorFilter || hasTypeFilter;

  return (
    <View
      style={[
        styles.emptyState,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg ?? radius.md,
        },
      ]}
    >
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: `${colors.brandPrimary}14`,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={32}
          color={colors.brandPrimary}
        />
      </View>

      <Text
        style={[
          styles.emptyTitle,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.heavy,
          },
        ]}
      >
        Nenhum resultado encontrado
      </Text>

      <Text
        style={[
          styles.emptyDescription,
          {
            color: colors.onSurfaceTertiary,
          },
        ]}
      >
        {query.trim()
          ? `Não encontramos resultados para “${query.trim()}”. Tente pesquisar por outro termo.`
          : "Não existem resultados disponíveis para os filtros selecionados."}
      </Text>

      {hasFilters || query.trim() ? (
        <Pressable
          onPress={onReset}
          style={({ pressed }) => [
            styles.resetButton,
            {
              backgroundColor: colors.brandPrimary,
              borderRadius: radius.md,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Limpar pesquisa e filtros"
          testID="search-reset-button"
        >
          <Ionicons
            name="refresh-outline"
            size={17}
            color={colors.onBrandPrimary}
          />

          <Text
            style={[
              styles.resetButtonText,
              {
                color: colors.onBrandPrimary,
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            Limpar pesquisa e filtros
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function companyMatchesFilter(
  company: (typeof COMPANIES)[number],
  filter: SearchFilter,
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "fecap") {
    return Boolean(company.isFecapPartner);
  }

  const searchText = normalizeText(
    [
      company.name,
      company.industry,
      company.description,
      company.tags?.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (filter === "tech") {
    return /(tecnologia|software|tech|digital|dados|cloud|ia|inteligencia artificial|computacao|sistemas|internet|cyber|ciber)/i.test(
      searchText,
    );
  }

  if (filter === "finance") {
    return /(finan|banco|bank|fintech|invest|credito|pagamento|seguro|capital|asset|wealth)/i.test(
      searchText,
    );
  }

  if (filter === "consulting") {
    return /(consult|auditor|advisory|estrateg|risco|compliance|big four|servicos profissionais)/i.test(
      searchText,
    );
  }

  return true;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getInitials(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${
    words[words.length - 1][0]
  }`.toUpperCase();
}

function formatCompactNumber(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)} mi`;
    }

    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)} mil`;
    }

    return String(value);
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  page: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  searchContainer: {
    flex: 1,
    height: 46,
    marginLeft: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingHorizontal: 9,
    paddingVertical: 0,
    fontSize: 14,
  },

  clearButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  filtersSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  typeFiltersContent: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  typeFilterButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  typeFilterLabel: {
    fontSize: 12,
  },

  filterCount: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  filterCountText: {
    fontSize: 10,
  },

  sectorFiltersContent: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
  },

  sectorFilterButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  sectorFilterText: {
    fontSize: 11,
  },

  recentSection: {
    paddingTop: 13,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  recentHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  recentTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  recentTitle: {
    fontSize: 13,
  },

  clearRecentText: {
    fontSize: 12,
  },

  recentItemsContent: {
    gap: 8,
    paddingHorizontal: 16,
  },

  recentItem: {
    height: 34,
    maxWidth: 230,
    borderWidth: 1,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  recentSearchButton: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingLeft: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  recentSearchText: {
    flexShrink: 1,
    fontSize: 11,
  },

  removeRecentButton: {
    width: 31,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  resultsHeader: {
    paddingTop: 18,
    paddingBottom: 13,
  },

  resultsHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  resultsHeadingContent: {
    flex: 1,
  },

  resultsTitle: {
    fontSize: 18,
    letterSpacing: -0.25,
  },

  resultsDescription: {
    marginTop: 3,
    fontSize: 12,
  },

  queryBadge: {
    maxWidth: "45%",
    minHeight: 30,
    paddingHorizontal: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  queryBadgeText: {
    flexShrink: 1,
    fontSize: 11,
  },

  itemSeparator: {
    height: 9,
  },

  resultCard: {
    width: "100%",
    minHeight: 76,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatarContainer: {
    width: 52,
    height: 52,
    borderWidth: 1,
    flexShrink: 0,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  userAvatarImage: {
    width: "100%",
    height: "100%",
  },

  companyAvatarImage: {
    width: "78%",
    height: "78%",
  },

  avatarInitials: {
    fontSize: 16,
    letterSpacing: -0.4,
  },

  resultMainContent: {
    flex: 1,
    minWidth: 0,
  },

  resultTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  resultTitle: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 19,
  },

  fecapBadge: {
    height: 20,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 0,
  },

  fecapBadgeText: {
    fontSize: 8,
    letterSpacing: 0.2,
  },

  resultSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
  },

  resultDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
  },

  resultRightContent: {
    alignSelf: "stretch",
    marginLeft: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  resultTypeBadge: {
    minHeight: 25,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  resultTypeText: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },

  emptyState: {
    minHeight: 310,
    marginTop: 10,
    paddingHorizontal: 28,
    paddingVertical: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 17,
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 420,
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  resetButton: {
    minHeight: 44,
    marginTop: 20,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  resetButtonText: {
    fontSize: 13,
  },
});