// app/onboarding.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/ThemeContext";
import { storage } from "@/src/utils/storage";

const WEB_MAX_WIDTH = 1180;
const SLIDE_CONTENT_MAX_WIDTH = 520;
const FOOTER_MAX_WIDTH = 520;
const WEB_BREAKPOINT = 768;

type Slide = {
  id: string;
  icon:
    | "flash"
    | "flame"
    | "git-network";
  title: string;
  subtitle: string;
  color1: string;
  color2: string;
};

const SLIDES: Slide[] = [
  {
    id: "opportunities",
    icon: "flash",
    title: "Descubra oportunidades",
    subtitle:
      "Stories das principais empresas do país, atualizados em tempo real. Vagas, hackathons e eventos ao seu alcance.",
    color1: "#10B981",
    color2: "#059669",
  },
  {
    id: "match",
    icon: "flame",
    title: "Match inteligente",
    subtitle:
      "Deslize pelas vagas e encontre oportunidades alinhadas ao seu perfil. A plataforma aprende seus interesses e melhora as recomendações.",
    color1: "#F59E0B",
    color2: "#EF4444",
  },
  {
    id: "network",
    icon: "git-network",
    title: "Grafo de conexões",
    subtitle:
      "Veja quantas conexões separam você de profissionais e empresas. Solicite apresentações e fortaleça sua rede FECAP.",
    color1: "#3B82F6",
    color2: "#8B5CF6",
  },
];

export default function Onboarding() {
  const {
    colors,
    typography,
    spacing,
    radius,
  } = useTheme();

  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const listRef = useRef<FlatList<Slide>>(null);
  const finishingRef = useRef(false);

  const [index, setIndex] = useState(0);

  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width >= WEB_BREAKPOINT;

  /*
   * No mobile, cada slide ocupa a tela inteira.
   * Na web, o conteúdo fica limitado para não se esticar
   * excessivamente em monitores grandes.
   */
  const carouselWidth = isDesktop
    ? Math.min(width, WEB_MAX_WIDTH)
    : width;

  const isShortScreen = height < 700;

  const finish = useCallback(async () => {
    if (finishingRef.current) {
      return;
    }

    finishingRef.current = true;

    try {
      await storage.setItem(
        "asa_onboarded",
        "true",
      );

      router.replace("/(auth)/login");
    } catch (error) {
      console.error(
        "Não foi possível concluir o onboarding:",
        error,
      );

      finishingRef.current = false;
    }
  }, [router]);

  const scrollToSlide = useCallback(
    (newIndex: number) => {
      const safeIndex = Math.max(
        0,
        Math.min(newIndex, SLIDES.length - 1),
      );

      setIndex(safeIndex);

      listRef.current?.scrollToIndex({
        index: safeIndex,
        animated: true,
      });
    },
    [],
  );

  const next = useCallback(() => {
    if (index === SLIDES.length - 1) {
      void finish();
      return;
    }

    scrollToSlide(index + 1);
  }, [finish, index, scrollToSlide]);

  const previous = useCallback(() => {
    if (index <= 0) {
      return;
    }

    scrollToSlide(index - 1);
  }, [index, scrollToSlide]);

  /*
   * Permite navegar com as setas no navegador.
   */
  useEffect(() => {
    if (!isWeb || typeof window === "undefined") {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      }

      if (
        event.key === "Enter" &&
        index === SLIDES.length - 1
      ) {
        event.preventDefault();
        void finish();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    finish,
    index,
    isWeb,
    next,
    previous,
  ]);

  /*
   * Caso o tamanho da janela mude, reposiciona o
   * FlatList no slide atual.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: index * carouselWidth,
        animated: false,
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [carouselWidth, index]);

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const offsetX =
      event.nativeEvent.contentOffset.x;

    const currentIndex = Math.round(
      offsetX / carouselWidth,
    );

    setIndex(
      Math.max(
        0,
        Math.min(
          currentIndex,
          SLIDES.length - 1,
        ),
      ),
    );
  };

  const handleViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<ViewToken<Slide>>;
    }) => {
      const visibleIndex =
        viewableItems[0]?.index;

      if (typeof visibleIndex === "number") {
        setIndex(visibleIndex);
      }
    },
  ).current;

  const getItemLayout = (
    _: ArrayLike<Slide> | null | undefined,
    itemIndex: number,
  ) => ({
    length: carouselWidth,
    offset: carouselWidth * itemIndex,
    index: itemIndex,
  });

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.surface,
        },
      ]}
      edges={["top", "bottom"]}
      testID="onboarding-screen"
    >
      <View
        style={[
          styles.page,
          isDesktop && styles.pageDesktop,
          {
            maxWidth: isDesktop
              ? WEB_MAX_WIDTH
              : undefined,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: isDesktop
                ? spacing.xl
                : spacing.lg,
            },
          ]}
        >
          <View
            style={styles.brandContainer}
          >
            <View
              style={[
                styles.brandIcon,
                {
                  backgroundColor:
                    colors.brandPrimary,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Ionicons
                name="people"
                size={20}
                color={
                  colors.onBrandPrimary
                }
              />
            </View>

            <Text
              style={[
                styles.brandText,
                {
                  color: colors.onSurface,
                  fontWeight:
                    typography.weight.bold,
                },
              ]}
            >
              Fecap Ágora
            </Text>
          </View>

          <Pressable
            onPress={() => void finish()}
            testID="onboarding-skip"
            accessibilityRole="button"
            accessibilityLabel="Pular introdução"
            style={({ hovered, pressed }) => [
              styles.skip,
              {
                backgroundColor: hovered
                  ? colors.surfaceSecondary
                  : "transparent",
                borderRadius: radius.md,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.skipText,
                {
                  color:
                    colors.onSurfaceTertiary,
                  fontWeight:
                    typography.weight.medium,
                },
              ]}
            >
              Pular
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.carouselContainer,
            {
              width: carouselWidth,
            },
          ]}
        >
          <FlatList
            ref={listRef}
            data={SLIDES}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            bounces={!isWeb}
            overScrollMode="never"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={
              handleMomentumScrollEnd
            }
            onViewableItemsChanged={
              handleViewableItemsChanged
            }
            viewabilityConfig={{
              itemVisiblePercentThreshold: 60,
            }}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.slide,
                  {
                    width: carouselWidth,
                    paddingHorizontal: isDesktop
                      ? spacing.xl
                      : spacing.lg,
                  },
                ]}
              >
                <View
                  style={[
                    styles.slideContent,
                    {
                      maxWidth:
                        SLIDE_CONTENT_MAX_WIDTH,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      item.color1,
                      item.color2,
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
                      styles.iconWrap,
                      isShortScreen &&
                        styles.iconWrapCompact,
                      isDesktop &&
                        styles.iconWrapDesktop,
                      {
                        borderRadius:
                          isDesktop
                            ? radius.xl
                            : 40,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={
                        isDesktop
                          ? 76
                          : isShortScreen
                            ? 52
                            : 64
                      }
                      color="#FFFFFF"
                    />
                  </LinearGradient>

                  <Text
                    style={[
                      styles.title,
                      isDesktop &&
                        styles.titleDesktop,
                      isShortScreen &&
                        styles.titleCompact,
                      {
                        color:
                          colors.onSurface,
                        fontWeight:
                          typography.weight.heavy,
                      },
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={[
                      styles.subtitle,
                      isDesktop &&
                        styles.subtitleDesktop,
                      {
                        color:
                          colors.onSurfaceTertiary,
                      },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>

        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: isDesktop
                ? spacing.xl
                : spacing.lg,
            },
          ]}
        >
          <View
            style={[
              styles.footerContent,
              {
                maxWidth: FOOTER_MAX_WIDTH,
              },
            ]}
          >
            <View
              style={styles.dots}
              accessibilityRole="tablist"
            >
              {SLIDES.map((slide, dotIndex) => {
                const isActive =
                  dotIndex === index;

                return (
                  <Pressable
                    key={slide.id}
                    onPress={() =>
                      scrollToSlide(dotIndex)
                    }
                    accessibilityRole="tab"
                    accessibilityState={{
                      selected: isActive,
                    }}
                    accessibilityLabel={`Ir para a etapa ${
                      dotIndex + 1
                    } de ${SLIDES.length}`}
                    hitSlop={8}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.65 : 1,
                    })}
                  >
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            isActive
                              ? colors.brandPrimary
                              : colors.border,
                          width: isActive
                            ? 28
                            : 8,
                        },
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View
              style={styles.actions}
            >
              {isDesktop && index > 0 ? (
                <Pressable
                  onPress={previous}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar para etapa anterior"
                  style={({
                    hovered,
                    pressed,
                  }) => [
                    styles.secondaryButton,
                    {
                      borderColor:
                        colors.border,
                      backgroundColor: hovered
                        ? colors.surfaceSecondary
                        : colors.surface,
                      borderRadius: radius.lg,
                      opacity: pressed
                        ? 0.72
                        : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="arrow-back"
                    size={18}
                    color={colors.onSurface}
                  />

                  <Text
                    style={[
                      styles.secondaryButtonText,
                      {
                        color:
                          colors.onSurface,
                        fontWeight:
                          typography.weight.semibold,
                      },
                    ]}
                  >
                    Voltar
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={next}
                testID="onboarding-next"
                accessibilityRole="button"
                accessibilityLabel={
                  index === SLIDES.length - 1
                    ? "Começar a usar o aplicativo"
                    : "Continuar para a próxima etapa"
                }
                style={({ hovered, pressed }) => [
                  styles.cta,
                  {
                    flex:
                      isDesktop && index > 0
                        ? 1
                        : undefined,
                    width:
                      isDesktop && index > 0
                        ? undefined
                        : "100%",
                    backgroundColor:
                      hovered
                        ? `${colors.brandPrimary}E8`
                        : colors.brandPrimary,
                    borderRadius: radius.lg,
                    opacity: pressed
                      ? 0.78
                      : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.ctaText,
                    {
                      color:
                        colors.onBrandPrimary,
                      fontWeight:
                        typography.weight.bold,
                    },
                  ]}
                >
                  {index === SLIDES.length - 1
                    ? "Começar"
                    : "Continuar"}
                </Text>

                <Ionicons
                  name={
                    index === SLIDES.length - 1
                      ? "checkmark"
                      : "arrow-forward"
                  }
                  size={19}
                  color={
                    colors.onBrandPrimary
                  }
                />
              </Pressable>
            </View>

            {isWeb ? (
              <Text
                style={[
                  styles.keyboardHint,
                  {
                    color:
                      colors.onSurfaceTertiary,
                  },
                ]}
              >
                Use as setas do teclado para
                navegar
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },

  page: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },

  pageDesktop: {
    borderLeftWidth:
      StyleSheet.hairlineWidth,
    borderRightWidth:
      StyleSheet.hairlineWidth,
  },

  header: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingVertical: 10,

    zIndex: 2,
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  brandIcon: {
    width: 36,
    height: 36,

    alignItems: "center",
    justifyContent: "center",
  },

  brandText: {
    fontSize: 16,
    letterSpacing: -0.3,
  },

  skip: {
    minWidth: 64,
    minHeight: 42,

    paddingHorizontal: 14,
    paddingVertical: 10,

    alignItems: "center",
    justifyContent: "center",
  },

  skipText: {
    fontSize: 14,
  },

  carouselContainer: {
    flex: 1,
    alignSelf: "center",
  },

  slide: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingVertical: 20,
  },

  slideContent: {
    width: "100%",

    alignItems: "center",
    justifyContent: "center",
  },

  iconWrap: {
    width: 148,
    height: 148,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 40,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },

  iconWrapCompact: {
    width: 116,
    height: 116,
    marginBottom: 26,
  },

  iconWrapDesktop: {
    width: 180,
    height: 180,
    marginBottom: 46,
  },

  title: {
    maxWidth: 460,

    marginBottom: 14,

    fontSize: 29,
    lineHeight: 35,
    letterSpacing: -0.7,
    textAlign: "center",
  },

  titleCompact: {
    fontSize: 25,
    lineHeight: 31,
  },

  titleDesktop: {
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -1,
  },

  subtitle: {
    maxWidth: 390,

    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },

  subtitleDesktop: {
    maxWidth: 500,

    fontSize: 18,
    lineHeight: 28,
  },

  footer: {
    width: "100%",
    paddingTop: 12,
    paddingBottom: 8,
  },

  footerContent: {
    width: "100%",
    alignSelf: "center",
  },

  dots: {
    minHeight: 28,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    marginBottom: 18,
  },

  dot: {
    height: 8,
    borderRadius: 999,
  },

  actions: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    gap: 12,
  },

  secondaryButton: {
    minWidth: 118,
    height: 56,

    paddingHorizontal: 20,

    borderWidth: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,
  },

  secondaryButtonText: {
    fontSize: 15,
  },

  cta: {
    height: 56,

    paddingHorizontal: 24,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 10,

    ...Platform.select({
      web: {
        cursor: "pointer" as never,
      },
    }),

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },

  ctaText: {
    fontSize: 16,
  },

  keyboardHint: {
    marginTop: 10,

    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});