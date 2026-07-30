import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fecapPartnerCompanies } from "@/src/services/fecap-partners";
import {
  STORIES,
  companyById,
} from "@/src/services/mock-data";
import { useTheme } from "@/src/theme/ThemeContext";

import type { Company } from "@/src/types";

const STORY_DURATION = 5000;
const STORY_UPDATE_INTERVAL = 50;

/**
 * Converte IDs antigos usados no mock-data para os IDs atuais
 * presentes em fecapPartnerCompanies.
 *
 * Exemplos:
 * c_google -> google
 * c_itau -> itau
 * c_santander -> santander
 */
function normalizeCompanyId(
  companyId?: string | null,
) {
  if (!companyId) {
    return "";
  }

  return companyId
    .trim()
    .toLowerCase()
    .replace(/^c_/, "")
    .replace(/_/g, "-");
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

/**
 * Resolve a empresa usando primeiro a lista real de parceiros
 * da FECAP e, somente depois, o array antigo de empresas.
 */
function resolveStoryCompany(
  companyId?: string | null,
): Company | null {
  if (!companyId) {
    return null;
  }

  const normalizedId =
    normalizeCompanyId(companyId);

  const partnerById =
    fecapPartnerCompanies.find((company) => {
      return (
        normalizeCompanyId(company.id) ===
        normalizedId
      );
    });

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

  /**
   * Caso a empresa antiga tenha ID diferente, procuramos uma
   * parceira da FECAP pelo nome e retornamos os dados atualizados.
   */
  const partnerByName =
    fecapPartnerCompanies.find((company) => {
      return (
        normalizeCompanyName(company.name) ===
        normalizeCompanyName(oldCompany.name)
      );
    });

  if (partnerByName) {
    return partnerByName;
  }

  return oldCompany;
}

function isStoryFromCompany(
  storyCompanyId: string,
  requestedCompanyId: string,
  resolvedCompany: Company | null,
) {
  const normalizedStoryId =
    normalizeCompanyId(storyCompanyId);

  const normalizedRequestedId =
    normalizeCompanyId(requestedCompanyId);

  const normalizedResolvedId =
    normalizeCompanyId(resolvedCompany?.id);

  return (
    normalizedStoryId ===
      normalizedRequestedId ||
    normalizedStoryId ===
      normalizedResolvedId
  );
}

function getCompanyLogoUrl(
  company?: Company | null,
) {
  if (!company) {
    return "";
  }

  /**
   * fecapPartnerCompanies usa `logo`.
   * Algumas empresas antigas ainda podem usar `logoUrl`.
   */
  const compatibleCompany = company as Company & {
    logo?: string;
    logoUrl?: string;
  };

  return (
    compatibleCompany.logo ??
    compatibleCompany.logoUrl ??
    ""
  );
}

function getCompanyInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function CompanyLogo({
  company,
  size = 44,
}: {
  company: Company;
  size?: number;
}) {
  const [imageFailed, setImageFailed] =
    useState(false);

  const logoUrl = useMemo(
    () => getCompanyLogoUrl(company),
    [company],
  );

  const initials = useMemo(
    () => getCompanyInitials(company.name),
    [company.name],
  );

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const shouldShowLogo =
    Boolean(logoUrl) && !imageFailed;

  return (
    <View
      style={[
        styles.companyLogoContainer,
        {
          width: size,
          height: size,
          borderRadius: 12,
        },
      ]}
    >
      {shouldShowLogo ? (
        <Image
          source={{
            uri: logoUrl,
          }}
          style={[
            styles.companyLogoImage,
            {
              width: size - 8,
              height: size - 8,
            },
          ]}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={150}
          onError={() => {
            console.warn(
              `Não foi possível carregar a logo de ${company.name}: ${logoUrl}`,
            );

            setImageFailed(true);
          }}
        />
      ) : (
        <View
          style={[
            styles.companyLogoFallback,
            {
              backgroundColor:
                company.color ?? "#1D4ED8",
            },
          ]}
        >
          <Text
            style={[
              styles.companyLogoInitials,
              {
                fontSize: Math.max(
                  12,
                  size * 0.3,
                ),
              },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function StoryViewer() {
  const params =
    useLocalSearchParams<{
      companyId?: string | string[];
    }>();

  const { typography } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const requestedCompanyId = useMemo(() => {
    const value = params.companyId;

    if (Array.isArray(value)) {
      return value[0] ?? "";
    }

    return value ?? "";
  }, [params.companyId]);

  const company = useMemo(() => {
    return resolveStoryCompany(
      requestedCompanyId,
    );
  }, [requestedCompanyId]);

  const items = useMemo(() => {
    if (!requestedCompanyId) {
      return [];
    }

    return STORIES.filter((story) =>
      isStoryFromCompany(
        story.companyId,
        requestedCompanyId,
        company,
      ),
    );
  }, [company, requestedCompanyId]);

  const [index, setIndex] = useState(0);
  const [progress, setProgress] =
    useState(0);

  const timerRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  const clearStoryTimer =
    useCallback(() => {
      if (!timerRef.current) {
        return;
      }

      clearInterval(timerRef.current);
      timerRef.current = null;
    }, []);

  const closeStory = useCallback(() => {
    clearStoryTimer();
    router.back();
  }, [clearStoryTimer, router]);

  const goToPreviousStory =
    useCallback(() => {
      clearStoryTimer();

      setIndex((currentIndex) =>
        Math.max(0, currentIndex - 1),
      );
    }, [clearStoryTimer]);

  const goToNextStory = useCallback(() => {
    clearStoryTimer();

    if (index < items.length - 1) {
      setIndex((currentIndex) =>
        Math.min(
          currentIndex + 1,
          items.length - 1,
        ),
      );

      return;
    }

    closeStory();
  }, [
    clearStoryTimer,
    closeStory,
    index,
    items.length,
  ]);

  useEffect(() => {
    setIndex(0);
    setProgress(0);
  }, [requestedCompanyId]);

  useEffect(() => {
    if (company && items.length > 0) {
      return;
    }

    const redirectTimer = setTimeout(() => {
      router.back();
    }, 0);

    return () => {
      clearTimeout(redirectTimer);
    };
  }, [company, items.length, router]);

  useEffect(() => {
    if (!items.length || !items[index]) {
      return;
    }

    clearStoryTimer();
    setProgress(0);

    const startedAt = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed =
        Date.now() - startedAt;

      const nextProgress =
        elapsed / STORY_DURATION;

      if (nextProgress >= 1) {
        clearStoryTimer();

        if (index < items.length - 1) {
          setIndex(
            (currentIndex) =>
              currentIndex + 1,
          );
        } else {
          router.back();
        }

        return;
      }

      setProgress(nextProgress);
    }, STORY_UPDATE_INTERVAL);

    return clearStoryTimer;
  }, [
    clearStoryTimer,
    index,
    items,
    items.length,
    router,
  ]);

  if (!company || !items.length) {
    return (
      <View
        style={styles.container}
        testID="story-viewer-loading"
      />
    );
  }

  const item = items[index];

  if (!item) {
    return null;
  }

  const isPartner = Boolean(
    company.isFecapPartner,
  );

  return (
    <View
      style={styles.container}
      testID="story-viewer"
    >
      <Image
        source={{
          uri: item.mediaUrl,
        }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
      />

      <LinearGradient
        colors={[
          "rgba(0,0,0,0.72)",
          "rgba(0,0,0,0.03)",
          "rgba(0,0,0,0.92)",
        ]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
      >
        <View
          style={styles.progressContainer}
        >
          {items.map(
            (story, storyIndex) => {
              const storyProgress =
                storyIndex < index
                  ? 100
                  : storyIndex === index
                    ? progress * 100
                    : 0;

              return (
                <View
                  key={
                    story.id ??
                    `${story.companyId}-${storyIndex}`
                  }
                  style={styles.progressTrack}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${storyProgress}%`,
                      },
                    ]}
                  />
                </View>
              );
            },
          )}
        </View>

        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir empresa ${company.name}`}
            onPress={() =>
              router.push(
                `/company/${company.id}`,
              )
            }
          >
            <CompanyLogo
              company={company}
              size={44}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir empresa ${company.name}`}
            onPress={() =>
              router.push(
                `/company/${company.id}`,
              )
            }
            style={
              styles.companyInformation
            }
          >
            <View
              style={styles.companyNameRow}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.companyName,
                  {
                    fontWeight:
                      typography.weight.bold,
                  },
                ]}
              >
                {company.name}
              </Text>

              {isPartner && (
                <View
                  style={styles.partnerBadge}
                >
                  <Ionicons
                    name="school-outline"
                    size={10}
                    color="#FFFFFF"
                  />

                  <Text
                    style={[
                      styles.partnerBadgeText,
                      {
                        fontWeight:
                          typography.weight.bold,
                      },
                    ]}
                  >
                    Parceira FECAP
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.storyTime}>
              {timeAgo(item.createdAt)}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar story"
            onPress={closeStory}
            testID="story-close-button"
            hitSlop={10}
            style={({ pressed }) => [
              styles.closeButton,

              pressed &&
                styles.pressedButton,
            ]}
          >
            <Ionicons
              name="close"
              size={26}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <View
          pointerEvents="box-none"
          style={styles.tapZonesContainer}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Story anterior"
            disabled={index === 0}
            onPress={goToPreviousStory}
            style={[
              styles.previousTapZone,
              {
                width: width / 3,
              },
            ]}
            testID="story-prev-zone"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              index < items.length - 1
                ? "Próximo story"
                : "Fechar story"
            }
            onPress={goToNextStory}
            style={[
              styles.nextTapZone,
              {
                width: width / 3,
              },
            ]}
            testID="story-next-zone"
          />
        </View>

        <View
          pointerEvents="box-none"
          style={styles.bottomContent}
        >
          <View style={styles.bottomCard}>
            <View
              style={styles.storyTypeBadge}
            >
              <Text
                style={[
                  styles.storyTypeText,
                  {
                    fontWeight:
                      typography.weight.heavy,
                  },
                ]}
              >
                {formatStoryType(item.type)}
              </Text>
            </View>

            <Text
              style={[
                styles.storyTitle,
                {
                  fontWeight:
                    typography.weight.heavy,
                },
              ]}
            >
              {item.title}
            </Text>

            {item.subtitle && (
              <Text
                style={styles.storySubtitle}
              >
                {item.subtitle}
              </Text>
            )}

            {item.ctaLabel && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.ctaLabel} em ${company.name}`}
                onPress={() =>
                  router.push(
                    `/company/${company.id}`,
                  )
                }
                style={({ pressed }) => [
                  styles.ctaButton,

                  pressed &&
                    styles.ctaButtonPressed,
                ]}
                testID="story-cta-button"
              >
                <Text
                  style={[
                    styles.ctaButtonText,
                    {
                      fontWeight:
                        typography.weight.heavy,
                    },
                  ]}
                >
                  {item.ctaLabel}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color="#111111"
                />
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function formatStoryType(type: string) {
  switch (type.toLowerCase()) {
    case "job":
    case "vaga":
      return "Vaga";

    case "event":
    case "evento":
      return "Evento";

    case "news":
    case "notícia":
    case "noticia":
      return "Notícia";

    case "internship":
    case "estágio":
    case "estagio":
      return "Estágio";

    default:
      return type;
  }
}

function timeAgo(iso: string) {
  const timestamp = new Date(iso).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const difference = Math.max(
    0,
    Date.now() - timestamp,
  );

  const minutes = Math.floor(
    difference / 60000,
  );

  const hours = Math.floor(
    difference / 3600000,
  );

  const days = Math.floor(
    difference / 86400000,
  );

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  safeArea: {
    flex: 1,
  },

  progressContainer: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 4,
  },

  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor:
      "rgba(255,255,255,0.3)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },

  header: {
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  companyLogoContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",

    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.22,
        shadowRadius: 5,
      },

      android: {
        elevation: 5,
      },

      web: {
        boxShadow:
          "0 3px 8px rgba(0,0,0,0.22)",
      },
    }),
  },

  companyLogoImage: {
    alignSelf: "center",
  },

  companyLogoFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  companyLogoInitials: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  companyInformation: {
    flex: 1,
    minWidth: 0,
  },

  companyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  companyName: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },

  partnerBadge: {
    flexShrink: 0,
    minHeight: 20,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.25)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  partnerBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
  },

  storyTime: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    marginTop: 3,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor:
      "rgba(0,0,0,0.24)",
    alignItems: "center",
    justifyContent: "center",
  },

  pressedButton: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  tapZonesContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },

  previousTapZone: {
    position: "absolute",
    left: 0,
    top: 82,
    bottom: 120,
  },

  nextTapZone: {
    position: "absolute",
    right: 0,
    top: 82,
    bottom: 120,
  },

  bottomContent: {
    zIndex: 10,
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
  },

  bottomCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor:
      "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.25)",

    ...Platform.select({
      web: {
        backdropFilter: "blur(16px)",
      },
    }),
  },

  storyTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },

  storyTypeText: {
    color: "#FFFFFF",
    fontSize: 10,
    textTransform: "uppercase",
  },

  storyTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    marginTop: 10,
    letterSpacing: -0.3,
  },

  storySubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },

  ctaButton: {
    minHeight: 46,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  ctaButtonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  ctaButtonText: {
    color: "#111111",
    fontSize: 14,
  },
});