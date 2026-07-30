import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  JOBS,
  companyById,
} from "@/src/services/mock-data";
import { useTheme } from "@/src/theme/ThemeContext";

type Job = (typeof JOBS)[number];

type Decision = "like" | "pass" | "super";

type DecisionHistoryItem = {
  jobId: string;
  decision: Decision;
};

type IconName = keyof typeof Ionicons.glyphMap;

const MOBILE_BREAKPOINT = 640;
const DESKTOP_BREAKPOINT = 980;
const CONTENT_MAX_WIDTH = 1180;

const SWIPE_THRESHOLD_X = 110;
const SWIPE_THRESHOLD_Y = 105;
const SWIPE_VELOCITY = 650;

const SPRING_CONFIG = {
  damping: 17,
  stiffness: 180,
  mass: 0.9,
};

export default function Match() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { colors, typography, radius } = useTheme();

  const [index, setIndex] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [passedCount, setPassedCount] = useState(0);
  const [superCount, setSuperCount] = useState(0);

  const [history, setHistory] = useState<
    DecisionHistoryItem[]
  >([]);

  const [savedJobs, setSavedJobs] = useState<string[]>(
    [],
  );

  const [isAnimating, setIsAnimating] = useState(false);

  const [showInstructions, setShowInstructions] =
    useState(true);

  const animationLock = useRef(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const gestureActive = useSharedValue(0);

  const isMobile = width < MOBILE_BREAKPOINT;
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const horizontalPadding = isMobile ? 14 : 24;

  const currentJob = JOBS[index];
  const nextJob = JOBS[index + 1];

  const totalJobs = JOBS.length;
  const reviewedCount = Math.min(index, totalJobs);
  const remainingCount = Math.max(totalJobs - index, 0);

  const progress =
    totalJobs > 0
      ? Math.min(reviewedCount / totalJobs, 1)
      : 0;

  const cardHeight = useMemo(() => {
    if (isDesktop) {
      return Math.min(Math.max(height - 270, 600), 730);
    }

    if (isMobile) {
      return Math.min(Math.max(height - 330, 540), 680);
    }

    return Math.min(Math.max(height - 300, 570), 700);
  }, [height, isDesktop, isMobile]);

  const currentCompany = currentJob
    ? companyById(currentJob.companyId)
    : null;

  const currentIsSaved = currentJob
    ? savedJobs.includes(currentJob.id)
    : false;

  const triggerHaptic = useCallback(
    async (decision: Decision) => {
      try {
        await Haptics.impactAsync(
          decision === "super"
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Medium,
        );
      } catch {
        // Haptics pode não estar disponível na web.
      }
    },
    [],
  );

  const triggerSelectionHaptic = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      // Haptics pode não estar disponível na web.
    });
  }, []);

  const resetAnimatedPosition = useCallback(() => {
    translateX.value = 0;
    translateY.value = 0;
    gestureActive.value = 0;
  }, [gestureActive, translateX, translateY]);

  const registerDecision = useCallback(
    (decision: Decision) => {
      const job = JOBS[index];

      if (!job) {
        resetAnimatedPosition();
        animationLock.current = false;
        setIsAnimating(false);
        return;
      }

      setHistory((current) => [
        ...current,
        {
          jobId: job.id,
          decision,
        },
      ]);

      if (decision === "like") {
        setLikedCount((current) => current + 1);
      }

      if (decision === "pass") {
        setPassedCount((current) => current + 1);
      }

      if (decision === "super") {
        setSuperCount((current) => current + 1);
      }

      setIndex((current) => current + 1);

      resetAnimatedPosition();

      animationLock.current = false;
      setIsAnimating(false);
    },
    [index, resetAnimatedPosition],
  );

  const completeSwipe = useCallback(
    (decision: Decision) => {
      registerDecision(decision);
    },
    [registerDecision],
  );

  const swipe = useCallback(
    (decision: Decision) => {
      if (
        animationLock.current ||
        isAnimating ||
        !currentJob
      ) {
        return;
      }

      animationLock.current = true;
      setIsAnimating(true);

      void triggerHaptic(decision);

      const horizontalExit = width * 1.35;
      const verticalExit =
        Math.max(height, width) * 1.05;

      if (decision === "like") {
        translateX.value = withTiming(
          horizontalExit,
          {
            duration: 260,
          },
          (finished) => {
            if (finished) {
              runOnJS(completeSwipe)("like");
            }
          },
        );

        return;
      }

      if (decision === "pass") {
        translateX.value = withTiming(
          -horizontalExit,
          {
            duration: 260,
          },
          (finished) => {
            if (finished) {
              runOnJS(completeSwipe)("pass");
            }
          },
        );

        return;
      }

      translateY.value = withTiming(
        -verticalExit,
        {
          duration: 280,
        },
        (finished) => {
          if (finished) {
            runOnJS(completeSwipe)("super");
          }
        },
      );
    },
    [
      completeSwipe,
      currentJob,
      height,
      isAnimating,
      translateX,
      translateY,
      triggerHaptic,
      width,
    ],
  );

  const undoLastDecision = useCallback(() => {
    if (
      animationLock.current ||
      isAnimating ||
      history.length === 0 ||
      index === 0
    ) {
      return;
    }

    const previous = history[history.length - 1];

    setHistory((current) => current.slice(0, -1));
    setIndex((current) => Math.max(current - 1, 0));

    if (previous.decision === "like") {
      setLikedCount((current) =>
        Math.max(current - 1, 0),
      );
    }

    if (previous.decision === "pass") {
      setPassedCount((current) =>
        Math.max(current - 1, 0),
      );
    }

    if (previous.decision === "super") {
      setSuperCount((current) =>
        Math.max(current - 1, 0),
      );
    }

    resetAnimatedPosition();
    triggerSelectionHaptic();
  }, [
    history,
    index,
    isAnimating,
    resetAnimatedPosition,
    triggerSelectionHaptic,
  ]);

  const toggleSavedJob = useCallback(() => {
    if (!currentJob) {
      return;
    }

    setSavedJobs((current) =>
      current.includes(currentJob.id)
        ? current.filter((id) => id !== currentJob.id)
        : [...current, currentJob.id],
    );

    triggerSelectionHaptic();
  }, [currentJob, triggerSelectionHaptic]);

  const resetDeck = useCallback(() => {
    setIndex(0);
    setLikedCount(0);
    setPassedCount(0);
    setSuperCount(0);
    setHistory([]);
    setIsAnimating(false);

    animationLock.current = false;

    resetAnimatedPosition();
  }, [resetAnimatedPosition]);

  const closeInstructions = useCallback(() => {
    setShowInstructions(false);
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(Boolean(currentJob) && !isAnimating)
        .activeOffsetX([-8, 8])
        .activeOffsetY([-8, 8])
        .onBegin(() => {
          gestureActive.value = 1;
        })
        .onUpdate((event) => {
          translateX.value = event.translationX;
          translateY.value = event.translationY;
        })
        .onEnd((event) => {
          const shouldSuper =
            event.translationY < -SWIPE_THRESHOLD_Y ||
            event.velocityY < -SWIPE_VELOCITY;

          const shouldLike =
            event.translationX > SWIPE_THRESHOLD_X ||
            event.velocityX > SWIPE_VELOCITY;

          const shouldPass =
            event.translationX < -SWIPE_THRESHOLD_X ||
            event.velocityX < -SWIPE_VELOCITY;

          if (shouldSuper) {
            translateY.value = withTiming(
              -Math.max(height, width),
              {
                duration: 250,
              },
              (finished) => {
                if (finished) {
                  runOnJS(triggerHaptic)("super");
                  runOnJS(completeSwipe)("super");
                }
              },
            );

            return;
          }

          if (shouldLike) {
            translateX.value = withTiming(
              width * 1.35,
              {
                duration: 240,
              },
              (finished) => {
                if (finished) {
                  runOnJS(triggerHaptic)("like");
                  runOnJS(completeSwipe)("like");
                }
              },
            );

            return;
          }

          if (shouldPass) {
            translateX.value = withTiming(
              -width * 1.35,
              {
                duration: 240,
              },
              (finished) => {
                if (finished) {
                  runOnJS(triggerHaptic)("pass");
                  runOnJS(completeSwipe)("pass");
                }
              },
            );

            return;
          }

          translateX.value = withSpring(
            0,
            SPRING_CONFIG,
          );

          translateY.value = withSpring(
            0,
            SPRING_CONFIG,
          );

          gestureActive.value = 0;
        })
        .onFinalize(() => {
          gestureActive.value = 0;
        }),
    [
      completeSwipe,
      currentJob,
      gestureActive,
      height,
      isAnimating,
      translateX,
      translateY,
      triggerHaptic,
      width,
    ],
  );

  const frontCardStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-width, 0, width],
      [-14, 0, 14],
      Extrapolation.CLAMP,
    );

    const movement =
      Math.abs(translateX.value) +
      Math.abs(translateY.value);

    const scale = interpolate(
      movement,
      [0, 250],
      [1, 0.985],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        {
          translateX: translateX.value,
        },
        {
          translateY: translateY.value,
        },
        {
          rotate: `${rotation}deg`,
        },
        {
          scale,
        },
      ],
    };
  });

  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [20, SWIPE_THRESHOLD_X],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [20, SWIPE_THRESHOLD_X],
          [0.8, 1],
          Extrapolation.CLAMP,
        ),
      },
      {
        rotate: "-10deg",
      },
    ],
  }));

  const passStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD_X, -20],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [-SWIPE_THRESHOLD_X, -20],
          [1, 0.8],
          Extrapolation.CLAMP,
        ),
      },
      {
        rotate: "10deg",
      },
    ],
  }));

  const superStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [-SWIPE_THRESHOLD_Y, -20],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          translateY.value,
          [-SWIPE_THRESHOLD_Y, -20],
          [1, 0.82],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const backCardStyle = useAnimatedStyle(() => {
    const movement =
      Math.abs(translateX.value) +
      Math.abs(translateY.value);

    return {
      opacity: interpolate(
        movement,
        [0, 220],
        [0.58, 1],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            movement,
            [0, 220],
            [0.94, 1],
            Extrapolation.CLAMP,
          ),
        },
        {
          translateY: interpolate(
            movement,
            [0, 220],
            [13, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: colors.surface,
        },
      ]}
      edges={["top"]}
      testID="match-screen"
    >
      <View
        style={[
          styles.page,
          {
            maxWidth: CONTENT_MAX_WIDTH,
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >
        <MatchHeader
          likedCount={likedCount}
          passedCount={passedCount}
          superCount={superCount}
          savedCount={savedJobs.length}
          remainingCount={remainingCount}
          progress={progress}
          reviewedCount={reviewedCount}
          totalJobs={totalJobs}
          canUndo={history.length > 0}
          onUndo={undoLastDecision}
          isMobile={isMobile}
        />

        <View
          style={[
            styles.mainLayout,
            {
              flexDirection: isDesktop
                ? "row"
                : "column",
            },
          ]}
        >
          <View style={styles.deckColumn}>
            <View
              style={[
                styles.deck,
                {
                  height: cardHeight,
                },
              ]}
            >
              {!currentJob ? (
                <EmptyState
                  likedCount={likedCount}
                  passedCount={passedCount}
                  superCount={superCount}
                  savedCount={savedJobs.length}
                  onReset={resetDeck}
                />
              ) : (
                <>
                  {nextJob ? (
                    <Animated.View
                      style={[
                        styles.card,
                        styles.backCard,
                        backCardStyle,
                        {
                          borderRadius: radius.xl ?? 26,
                        },
                      ]}
                      pointerEvents="none"
                    >
                      <JobCardBody
                        job={nextJob}
                        preview
                      />
                    </Animated.View>
                  ) : (
                    <View
                      style={[
                        styles.lastCardBackground,
                        {
                          borderRadius: radius.xl ?? 26,
                          backgroundColor:
                            colors.surfaceSecondary,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-done-outline"
                        size={36}
                        color={colors.onSurfaceTertiary}
                      />

                      <Text
                        style={[
                          styles.lastCardText,
                          {
                            color:
                              colors.onSurfaceTertiary,
                            fontWeight:
                              typography.weight.semibold,
                          },
                        ]}
                      >
                        Última oportunidade
                      </Text>
                    </View>
                  )}

                  <GestureDetector gesture={panGesture}>
                    <Animated.View
                      style={[
                        styles.card,
                        frontCardStyle,
                        {
                          borderRadius: radius.xl ?? 26,
                        },
                      ]}
                      testID="swipe-card"
                    >
                      <JobCardBody
                        job={currentJob}
                        saved={currentIsSaved}
                        onToggleSave={toggleSavedJob}
                        onOpenCompany={() => {
                          router.push(
                            `/company/${currentJob.companyId}`,
                          );
                        }}
                        onOpenDetails={() => {
                          router.push(
                            `/job/${currentJob.id}`,
                          );
                        }}
                      />

                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.stamp,
                          styles.likeStamp,
                          likeStampStyle,
                        ]}
                      >
                        <Ionicons
                          name="heart"
                          size={20}
                          color="#FFFFFF"
                        />

                        <Text style={styles.stampText}>
                          MATCH
                        </Text>
                      </Animated.View>

                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.stamp,
                          styles.passStamp,
                          passStampStyle,
                        ]}
                      >
                        <Ionicons
                          name="close"
                          size={22}
                          color="#FFFFFF"
                        />

                        <Text style={styles.stampText}>
                          PASS
                        </Text>
                      </Animated.View>

                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.stamp,
                          styles.superStamp,
                          superStampStyle,
                        ]}
                      >
                        <Ionicons
                          name="flash"
                          size={20}
                          color="#FFFFFF"
                        />

                        <Text style={styles.stampText}>
                          SUPER
                        </Text>
                      </Animated.View>
                    </Animated.View>
                  </GestureDetector>
                </>
              )}
            </View>

            {currentJob ? (
              <MatchActions
                onPass={() => swipe("pass")}
                onSuper={() => swipe("super")}
                onLike={() => swipe("like")}
                onUndo={undoLastDecision}
                canUndo={history.length > 0}
                disabled={isAnimating}
                compact={isMobile}
              />
            ) : null}
          </View>

          {isDesktop ? (
            <View style={styles.previewColumn}>
              {currentJob && currentCompany ? (
                <>
                  <JobPreviewPanel
                    job={currentJob}
                    onOpenDetails={() => {
                      router.push(
                        `/job/${currentJob.id}`,
                      );
                    }}
                  />

                  {nextJob ? (
                    <NextJobPreview job={nextJob} />
                  ) : null}

                  <MatchGuide />
                </>
              ) : (
                <MatchSummary
                  likedCount={likedCount}
                  passedCount={passedCount}
                  superCount={superCount}
                  savedCount={savedJobs.length}
                />
              )}
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function MatchHeader({
  likedCount,
  passedCount,
  superCount,
  savedCount,
  remainingCount,
  progress,
  reviewedCount,
  totalJobs,
  canUndo,
  onUndo,
  isMobile,
}: {
  likedCount: number;
  passedCount: number;
  superCount: number;
  savedCount: number;
  remainingCount: number;
  progress: number;
  reviewedCount: number;
  totalJobs: number;
  canUndo: boolean;
  onUndo: () => void;
  isMobile: boolean;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerTitleRow}>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: colors.onSurface,
                  fontSize: isMobile ? 25 : 30,
                  fontWeight: typography.weight.heavy,
                },
              ]}
            >
              Match
            </Text>

            <View
              style={[
                styles.aiBadge,
                {
                  backgroundColor:
                    colors.brandSecondary,
                },
              ]}
            >
              <Ionicons
                name="sparkles"
                size={13}
                color={colors.onBrandSecondary}
              />

              <Text
                style={[
                  styles.aiBadgeText,
                  {
                    color: colors.onBrandSecondary,
                    fontWeight: typography.weight.bold,
                  },
                ]}
              >
                IA aprendendo
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.headerDescription,
              {
                color: colors.onSurfaceTertiary,
              },
            ]}
          >
            Descubra oportunidades alinhadas ao seu perfil.
          </Text>
        </View>

        <Pressable
          onPress={onUndo}
          disabled={!canUndo}
          hitSlop={10}
          style={({ pressed }) => [
            styles.undoButton,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              borderRadius: radius.md,
              opacity: !canUndo
                ? 0.38
                : pressed
                  ? 0.68
                  : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Desfazer última decisão"
          accessibilityState={{
            disabled: !canUndo,
          }}
          testID="match-undo-button"
        >
          <Ionicons
            name="arrow-undo-outline"
            size={19}
            color={colors.onSurface}
          />

          {!isMobile ? (
            <Text
              style={[
                styles.undoButtonText,
                {
                  color: colors.onSurface,
                  fontWeight:
                    typography.weight.semibold,
                },
              ]}
            >
              Desfazer
            </Text>
          ) : null}
        </Pressable>
      </View>


      <View style={styles.progressHeader}>
        <View style={styles.progressLabels}>
          <Text
            style={[
              styles.progressText,
              {
                color: colors.onSurfaceSecondary,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            {reviewedCount} de {totalJobs} analisadas
          </Text>

          <Text
            style={[
              styles.progressText,
              {
                color: colors.onSurfaceTertiary,
              },
            ]}
          >
            {remainingCount} restantes
          </Text>
        </View>

        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: colors.surfaceSecondary,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: colors.brandPrimary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function Metric({
  icon,
  value,
  label,
  tint,
}: {
  icon: IconName;
  value: number;
  label: string;
  tint: string;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.metric,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.md,
        },
      ]}
    >
      <View
        style={[
          styles.metricIcon,
          {
            backgroundColor: `${tint}18`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={15}
          color={tint}
        />
      </View>

      <View style={styles.metricText}>
        <Text
          style={[
            styles.metricValue,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          {value}
        </Text>

        <Text
          style={[
            styles.metricLabel,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function JobCardBody({
  job,
  preview = false,
  saved = false,
  onToggleSave,
  onOpenCompany,
  onOpenDetails,
}: {
  job: Job;
  preview?: boolean;
  saved?: boolean;
  onToggleSave?: () => void;
  onOpenCompany?: () => void;
  onOpenDetails?: () => void;
}) {
  const company = companyById(job.companyId);
  const { colors, typography, radius } = useTheme();

  const [logoError, setLogoError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const showLogo =
    Boolean(company?.logoUrl) && !logoError;

  const showCover =
    Boolean(company?.coverUrl) && !coverError;

  const companyColor =
    company?.color || colors.brandPrimary;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.jobCardBody,
        {
          borderRadius: radius.xl ?? 26,
          backgroundColor: companyColor,
        },
      ]}
    >
      {showCover ? (
        <Image
          source={{
            uri: company?.coverUrl,
          }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
          onError={() => setCoverError(true)}
          accessibilityLabel={`Imagem da empresa ${
            company?.name ?? ""
          }`}
        />
      ) : (
        <LinearGradient
          colors={[
            companyColor,
            colors.brandPrimary,
            "#111827",
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      <LinearGradient
        colors={[
          "rgba(3,7,18,0.20)",
          "rgba(3,7,18,0.08)",
          "rgba(3,7,18,0.95)",
        ]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.cardTopRow}>
        <Pressable
          onPress={onOpenCompany}
          disabled={preview || !onOpenCompany}
          hitSlop={4}
          style={({ pressed }) => [
            styles.companyIdentity,
            {
              opacity: pressed ? 0.72 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Abrir perfil da empresa ${
            company?.name ?? "Empresa"
          }`}
          accessibilityState={{
            disabled: preview || !onOpenCompany,
          }}
        >
          <View
            style={[
              styles.logoWrap,
              {
                backgroundColor: showLogo
                  ? "#FFFFFF"
                  : companyColor,
              },
            ]}
          >
            {showLogo ? (
              <Image
                source={{
                  uri: company?.logoUrl,
                }}
                style={styles.logoImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                onError={() => setLogoError(true)}
                accessibilityLabel={`Logo da empresa ${
                  company?.name ?? ""
                }`}
              />
            ) : (
              <Text
                style={[
                  styles.logoFallback,
                  {
                    color: "#FFFFFF",
                    fontWeight: typography.weight.heavy,
                  },
                ]}
              >
                {company?.name
                  ?.charAt(0)
                  .toUpperCase() ?? "E"}
              </Text>
            )}
          </View>

          {!preview ? (
            <View style={styles.companyTopText}>
              <Text
                style={[
                  styles.companyTopName,
                  {
                    fontWeight: typography.weight.bold,
                  },
                ]}
                numberOfLines={1}
              >
                {company?.name ?? "Empresa"}
              </Text>

              <View style={styles.companyTopActionRow}>
                <Text
                  style={styles.companyTopLabel}
                  numberOfLines={1}
                >
                  Ver perfil da empresa
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={11}
                  color="rgba(255,255,255,0.72)"
                />
              </View>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.cardTopActions}>
          <View
            style={[
              styles.matchBadge,
              {
                backgroundColor: getMatchColor(
                  job.matchScore,
                ),
              },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={13}
              color="#FFFFFF"
            />

            <Text
              style={[
                styles.matchBadgeText,
                {
                  fontWeight: typography.weight.heavy,
                },
              ]}
            >
              {job.matchScore}% match
            </Text>
          </View>

          {!preview && onToggleSave ? (
            <Pressable
              onPress={onToggleSave}
              hitSlop={10}
              style={({ pressed }) => [
                styles.saveButton,
                saved ? styles.saveButtonActive : null,
                {
                  opacity: pressed ? 0.68 : 1,
                  transform: [
                    {
                      scale: pressed ? 0.92 : 1,
                    },
                  ],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                saved
                  ? "Remover vaga dos itens salvos"
                  : "Salvar vaga"
              }
              accessibilityState={{
                selected: saved,
              }}
            >
              <Ionicons
                name={
                  saved
                    ? "bookmark"
                    : "bookmark-outline"
                }
                size={21}
                color="#FFFFFF"
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.cardBottomInfo}>
        {company?.isFecapPartner ? (
          <View style={styles.partnerBadge}>
            <Ionicons
              name="school"
              size={12}
              color="#FFFFFF"
            />

            <Text
              style={[
                styles.partnerBadgeText,
                {
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              Parceiro FECAP
            </Text>
          </View>
        ) : null}

        <Text
          style={[
            styles.jobTitle,
            {
              fontSize: preview ? 20 : 25,
              lineHeight: preview ? 25 : 31,
              fontWeight: typography.weight.heavy,
            },
          ]}
          numberOfLines={preview ? 2 : 3}
        >
          {job.title}
        </Text>

        <View style={styles.jobCompanyLine}>
          <Ionicons
            name="business-outline"
            size={15}
            color="rgba(255,255,255,0.82)"
          />

          <Text
            style={styles.jobCompanyText}
            numberOfLines={1}
          >
            {company?.name ?? "Empresa"}
          </Text>
        </View>

        <View style={styles.jobLocationLine}>
          <Ionicons
            name="location-outline"
            size={15}
            color="rgba(255,255,255,0.82)"
          />

          <Text
            style={styles.jobLocationText}
            numberOfLines={1}
          >
            {job.location ||
              "Localização não informada"}
          </Text>
        </View>

        {!preview ? (
          <>
            <View style={styles.primaryChips}>
              <CardChip
                icon="cash-outline"
                label={
                  job.salary ||
                  "Salário não informado"
                }
                variant="highlight"
              />

              <CardChip
                icon="desktop-outline"
                label={job.workModel}
              />

              <CardChip
                icon="ribbon-outline"
                label={job.seniority}
              />
            </View>

            {job.skills?.length > 0 ? (
              <View style={styles.skillsContainer}>
                <Text
                  style={[
                    styles.skillsTitle,
                    {
                      fontWeight:
                        typography.weight.semibold,
                    },
                  ]}
                >
                  Competências relacionadas
                </Text>

                <View style={styles.skillsRow}>
                  {job.skills
                    .slice(0, 4)
                    .map((skill: string) => (
                      <View
                        key={skill}
                        style={styles.skillChip}
                      >
                        <Text
                          style={[
                            styles.skillChipText,
                            {
                              fontWeight:
                                typography.weight
                                  .semibold,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {skill}
                        </Text>
                      </View>
                    ))}

                  {job.skills.length > 4 ? (
                    <View style={styles.skillChip}>
                      <Text
                        style={[
                          styles.skillChipText,
                          {
                            fontWeight:
                              typography.weight.bold,
                          },
                        ]}
                      >
                        +{job.skills.length - 4}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {onOpenDetails ? (
              <Pressable
                onPress={onOpenDetails}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.cardDetailsButton,
                  {
                    opacity: pressed ? 0.78 : 1,
                    transform: [
                      {
                        scale: pressed ? 0.985 : 1,
                      },
                    ],
                  },
                ]}
                testID="match-card-details-button"
                accessibilityRole="button"
                accessibilityLabel={`Ver detalhes da vaga ${job.title}`}
              >
                <View style={styles.cardDetailsIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#FFFFFF"
                  />
                </View>

                <View style={styles.cardDetailsContent}>
                  <Text
                    style={[
                      styles.cardDetailsTitle,
                      {
                        fontWeight:
                          typography.weight.bold,
                      },
                    ]}
                  >
                    Ver detalhes da vaga
                  </Text>

                  <Text
                    style={styles.cardDetailsSubtitle}
                    numberOfLines={1}
                  >
                    Descrição, requisitos e benefícios
                  </Text>
                </View>

                <View
                  style={styles.cardDetailsArrow}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color="#FFFFFF"
                  />
                </View>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </View>

      {preview ? (
        <View style={styles.previewOverlay}>
          <Ionicons
            name="layers-outline"
            size={15}
            color="#FFFFFF"
          />

          <Text
            style={[
              styles.previewOverlayText,
              {
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            Próxima vaga
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function CardChip({
  icon,
  label,
  variant = "default",
}: {
  icon: IconName;
  label?: string;
  variant?: "default" | "highlight";
}) {
  if (!label) {
    return null;
  }

  return (
    <View
      style={[
        styles.cardChip,
        variant === "highlight"
          ? styles.cardChipHighlight
          : styles.cardChipDefault,
      ]}
    >
      <Ionicons
        name={icon}
        size={13}
        color={
          variant === "highlight"
            ? "#D1FAE5"
            : "#FFFFFF"
        }
      />

      <Text
        style={[
          styles.cardChipText,
          variant === "highlight"
            ? styles.cardChipHighlightText
            : null,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function MatchActions({
  onPass,
  onSuper,
  onLike,
  onUndo,
  canUndo,
  disabled,
  compact,
}: {
  onPass: () => void;
  onSuper: () => void;
  onLike: () => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled: boolean;
  compact: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.actions}>
      <ActionButton
        icon="arrow-undo"
        tint={colors.onSurfaceTertiary}
        size={compact ? 42 : 46}
        onPress={onUndo}
        disabled={!canUndo || disabled}
        testID="match-action-undo"
        label="Desfazer"
      />

      <ActionButton
        icon="close"
        tint={colors.pass}
        size={compact ? 56 : 62}
        onPress={onPass}
        disabled={disabled}
        testID="match-pass-button"
        label="Passar"
      />

      <ActionButton
        icon="flash"
        tint={colors.superMatch}
        size={compact ? 66 : 74}
        onPress={onSuper}
        disabled={disabled}
        testID="match-super-button"
        label="Super match"
        featured
      />

      <ActionButton
        icon="heart"
        tint={colors.like}
        size={compact ? 56 : 62}
        onPress={onLike}
        disabled={disabled}
        testID="match-like-button"
        label="Curtir"
      />
    </View>
  );
}

function ActionButton({
  icon,
  tint,
  size,
  onPress,
  disabled,
  testID,
  label,
  featured = false,
}: {
  icon: IconName;
  tint: string;
  size: number;
  onPress: () => void;
  disabled: boolean;
  testID: string;
  label: string;
  featured?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled,
      }}
      style={({ pressed }) => [
        styles.actionButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: featured
            ? `${tint}14`
            : colors.surfaceSecondary,
          borderColor: tint,
          opacity: disabled
            ? 0.35
            : pressed
              ? 0.72
              : 1,
          transform: [
            {
              scale:
                pressed && !disabled ? 0.91 : 1,
            },
          ],
          shadowColor: tint,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={size * 0.41}
        color={tint}
      />
    </Pressable>
  );
}

function JobPreviewPanel({
  job,
  onOpenDetails,
}: {
  job: Job;
  onOpenDetails: () => void;
}) {
  const company = companyById(job.companyId);
  const { colors, typography, radius } = useTheme();

  const matchReasons = getMatchReasons(job);

  return (
    <View
      style={[
        styles.previewPanel,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg ?? 18,
        },
      ]}
    >
      <View style={styles.previewPanelHeader}>
        <View
          style={[
            styles.previewPanelIcon,
            {
              backgroundColor: `${colors.brandPrimary}14`,
            },
          ]}
        >
          <Ionicons
            name="analytics-outline"
            size={20}
            color={colors.brandPrimary}
          />
        </View>

        <View style={styles.previewPanelHeading}>
          <Text
            style={[
              styles.previewPanelTitle,
              {
                color: colors.onSurface,
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            Análise da oportunidade
          </Text>

          <Text
            style={[
              styles.previewPanelSubtitle,
              {
                color: colors.onSurfaceTertiary,
              },
            ]}
          >
            Compatibilidade calculada pelo seu perfil.
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.matchScoreCard,
          {
            backgroundColor: `${getMatchColor(
              job.matchScore,
            )}12`,
            borderColor: `${getMatchColor(
              job.matchScore,
            )}35`,
          },
        ]}
      >
        <View>
          <Text
            style={[
              styles.matchScoreLabel,
              {
                color: colors.onSurfaceTertiary,
              },
            ]}
          >
            Compatibilidade
          </Text>

          <Text
            style={[
              styles.matchScoreValue,
              {
                color: getMatchColor(job.matchScore),
                fontWeight: typography.weight.heavy,
              },
            ]}
          >
            {job.matchScore}%
          </Text>
        </View>

        <View
          style={[
            styles.matchScoreIcon,
            {
              backgroundColor: `${getMatchColor(
                job.matchScore,
              )}18`,
            },
          ]}
        >
          <Ionicons
            name="sparkles"
            size={24}
            color={getMatchColor(job.matchScore)}
          />
        </View>
      </View>

      <Text
        style={[
          styles.previewSectionTitle,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.bold,
          },
        ]}
      >
        Por que combina com você
      </Text>

      <View style={styles.matchReasons}>
        {matchReasons.map((reason) => (
          <View
            key={reason}
            style={styles.matchReason}
          >
            <View
              style={[
                styles.matchReasonCheck,
                {
                  backgroundColor: `${colors.like}16`,
                },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={14}
                color={colors.like}
              />
            </View>

            <Text
              style={[
                styles.matchReasonText,
                {
                  color: colors.onSurfaceSecondary,
                },
              ]}
            >
              {reason}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.companyPreviewRow,
          {
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.companyPreviewInfo}>
          <Text
            style={[
              styles.companyPreviewLabel,
              {
                color: colors.onSurfaceTertiary,
              },
            ]}
          >
            Empresa
          </Text>

          <Text
            style={[
              styles.companyPreviewName,
              {
                color: colors.onSurface,
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            {company?.name ?? "Empresa"}
          </Text>
        </View>

        {company?.isFecapPartner ? (
          <View
            style={[
              styles.fecapPreviewBadge,
              {
                backgroundColor: `${colors.brandPrimary}12`,
              },
            ]}
          >
            <Ionicons
              name="school-outline"
              size={13}
              color={colors.brandPrimary}
            />

            <Text
              style={[
                styles.fecapPreviewText,
                {
                  color: colors.brandPrimary,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              Parceiro
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={onOpenDetails}
        style={({ pressed }) => [
          styles.previewDetailsButton,
          {
            backgroundColor: colors.brandPrimary,
            borderRadius: radius.md,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Abrir detalhes da vaga ${job.title}`}
      >
        <Text
          style={[
            styles.previewDetailsButtonText,
            {
              color: colors.onBrandPrimary,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          Abrir detalhes da vaga
        </Text>

        <Ionicons
          name="arrow-forward"
          size={18}
          color={colors.onBrandPrimary}
        />
      </Pressable>
    </View>
  );
}

function NextJobPreview({
  job,
}: {
  job: Job;
}) {
  const company = companyById(job.companyId);
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.nextPreview,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg ?? 18,
        },
      ]}
    >
      <View style={styles.nextPreviewHeader}>
        <View style={styles.nextPreviewHeading}>
          <Text
            style={[
              styles.nextPreviewEyebrow,
              {
                color: colors.onSurfaceTertiary,
              },
            ]}
          >
            A seguir
          </Text>

          <Text
            style={[
              styles.nextPreviewTitle,
              {
                color: colors.onSurface,
                fontWeight: typography.weight.bold,
              },
            ]}
            numberOfLines={2}
          >
            {job.title}
          </Text>
        </View>

        <View
          style={[
            styles.nextMatchBadge,
            {
              backgroundColor: `${getMatchColor(
                job.matchScore,
              )}14`,
            },
          ]}
        >
          <Text
            style={[
              styles.nextMatchText,
              {
                color: getMatchColor(job.matchScore),
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            {job.matchScore}%
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.nextPreviewCompany,
          {
            color: colors.onSurfaceTertiary,
          },
        ]}
        numberOfLines={1}
      >
        {company?.name ?? "Empresa"} • {job.workModel}
      </Text>
    </View>
  );
}

function MatchGuide() {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.guideCard,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg ?? 18,
        },
      ]}
    >
      <Text
        style={[
          styles.guideTitle,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.bold,
          },
        ]}
      >
        Atalhos do Match
      </Text>

      <GuideItem
        icon="arrow-back"
        label="Arraste para esquerda"
        action="Passar"
      />

      <GuideItem
        icon="arrow-up"
        label="Arraste para cima"
        action="Super match"
      />

      <GuideItem
        icon="arrow-forward"
        label="Arraste para direita"
        action="Curtir"
      />
    </View>
  );
}

function GuideItem({
  icon,
  label,
  action,
}: {
  icon: IconName;
  label: string;
  action: string;
}) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.guideItem}>
      <View
        style={[
          styles.guideIcon,
          {
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={colors.brandPrimary}
        />
      </View>

      <View style={styles.guideText}>
        <Text
          style={[
            styles.guideLabel,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.guideAction,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.semibold,
            },
          ]}
        >
          {action}
        </Text>
      </View>
    </View>
  );
}

function MatchSummary({
  likedCount,
  passedCount,
  superCount,
  savedCount,
}: {
  likedCount: number;
  passedCount: number;
  superCount: number;
  savedCount: number;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.summaryPanel,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg ?? 18,
        },
      ]}
    >
      <Text
        style={[
          styles.summaryPanelTitle,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.heavy,
          },
        ]}
      >
        Resumo da sessão
      </Text>

      <SummaryRow
        icon="heart"
        label="Vagas curtidas"
        value={likedCount}
        tint={colors.like}
      />

      <SummaryRow
        icon="flash"
        label="Super matches"
        value={superCount}
        tint={colors.superMatch}
      />

      <SummaryRow
        icon="close"
        label="Vagas ignoradas"
        value={passedCount}
        tint={colors.pass}
      />

      <SummaryRow
        icon="bookmark"
        label="Vagas salvas"
        value={savedCount}
        tint={colors.brandPrimary}
      />
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  tint,
}: {
  icon: IconName;
  label: string;
  value: number;
  tint: string;
}) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.summaryRow}>
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor: `${tint}16`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={tint}
        />
      </View>

      <Text
        style={[
          styles.summaryLabel,
          {
            color: colors.onSurfaceSecondary,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.summaryValue,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.bold,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function EmptyState({
  likedCount,
  passedCount,
  superCount,
  savedCount,
  onReset,
}: {
  likedCount: number;
  passedCount: number;
  superCount: number;
  savedCount: number;
  onReset: () => void;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.emptyScrollContent}
      showsVerticalScrollIndicator={false}
      testID="match-empty"
    >
      <View
        style={[
          styles.emptyState,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
            borderRadius: radius.xl ?? 26,
          },
        ]}
      >
        <View
          style={[
            styles.emptyIconGlow,
            {
              backgroundColor: `${colors.like}10`,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor: `${colors.like}18`,
              },
            ]}
          >
            <Ionicons
              name="checkmark-done"
              size={43}
              color={colors.like}
            />
          </View>
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
          Você analisou todas as vagas
        </Text>

        <Text
          style={[
            styles.emptyDescription,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
        >
          Suas decisões ajudam a IA a entender melhor os
          seus interesses e recomendar oportunidades mais
          relevantes.
        </Text>

        <View style={styles.emptyMetrics}>
          <EmptyMetric
            icon="heart"
            value={likedCount}
            label="Curtidas"
            tint={colors.like}
          />

          <EmptyMetric
            icon="flash"
            value={superCount}
            label="Super"
            tint={colors.superMatch}
          />

          <EmptyMetric
            icon="bookmark"
            value={savedCount}
            label="Salvas"
            tint={colors.brandPrimary}
          />

          <EmptyMetric
            icon="close"
            value={passedCount}
            label="Passes"
            tint={colors.pass}
          />
        </View>

        <View
          style={[
            styles.processingCard,
            {
              backgroundColor: `${colors.brandPrimary}0D`,
              borderColor: `${colors.brandPrimary}25`,
            },
          ]}
        >
          <Ionicons
            name="sparkles-outline"
            size={21}
            color={colors.brandPrimary}
          />

          <View style={styles.processingText}>
            <Text
              style={[
                styles.processingTitle,
                {
                  color: colors.onSurface,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              IA processando preferências
            </Text>

            <Text
              style={[
                styles.processingDescription,
                {
                  color: colors.onSurfaceTertiary,
                },
              ]}
            >
              Novas recomendações poderão aparecer conforme
              outras oportunidades forem adicionadas.
            </Text>
          </View>
        </View>

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
          testID="match-reset-button"
          accessibilityRole="button"
          accessibilityLabel="Rever oportunidades"
        >
          <Ionicons
            name="refresh"
            size={18}
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
            Rever oportunidades
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function EmptyMetric({
  icon,
  value,
  label,
  tint,
}: {
  icon: IconName;
  value: number;
  label: string;
  tint: string;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.emptyMetric,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={17}
        color={tint}
      />

      <Text
        style={[
          styles.emptyMetricValue,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.bold,
          },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.emptyMetricLabel,
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

function getMatchColor(score?: number) {
  const safeScore = score ?? 0;

  if (safeScore >= 85) {
    return "#10B981";
  }

  if (safeScore >= 70) {
    return "#22C55E";
  }

  if (safeScore >= 55) {
    return "#F59E0B";
  }

  return "#64748B";
}

function getMatchReasons(job: Job): string[] {
  const reasons: string[] = [];

  if (job.skills?.length) {
    reasons.push(
      `${Math.min(
        job.skills.length,
        4,
      )} competências relacionadas ao seu perfil`,
    );
  }

  if (job.workModel) {
    reasons.push(
      `Modelo de trabalho ${job.workModel.toLowerCase()}`,
    );
  }

  if (job.seniority) {
    reasons.push(
      `Nível de senioridade: ${job.seniority}`,
    );
  }

  if (job.location) {
    reasons.push(
      `Oportunidade disponível em ${job.location}`,
    );
  }

  return reasons.slice(0, 4);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  page: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    paddingTop: 8,
  },

  header: {
    width: "100%",
    paddingBottom: 12,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  headerTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 9,
  },

  headerTitle: {
    letterSpacing: -0.7,
    lineHeight: 36,
  },

  headerDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },

  aiBadge: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  aiBadgeText: {
    fontSize: 10,
  },

  undoButton: {
    minHeight: 42,
    minWidth: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  undoButtonText: {
    fontSize: 12,
  },

  metricsRow: {
    width: "100%",
    flexDirection: "row",
    gap: 7,
    marginTop: 13,
  },

  metric: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 7,
    paddingVertical: 7,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  metricIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  metricText: {
    flex: 1,
    minWidth: 0,
  },

  metricValue: {
    fontSize: 13,
    lineHeight: 16,
  },

  metricLabel: {
    fontSize: 8,
    lineHeight: 11,
    marginTop: 1,
  },

  progressHeader: {
    width: "100%",
    marginTop: 11,
  },

  progressLabels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },

  progressText: {
    fontSize: 10,
    lineHeight: 14,
  },

  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  instructions: {
    width: "100%",
    minHeight: 58,
    padding: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  instructionMainIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  instructionContent: {
    flex: 1,
    minWidth: 0,
  },

  instructionTitle: {
    fontSize: 11,
    lineHeight: 15,
  },

  instructionDescription: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 1,
  },

  instructionClose: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
  },

  mainLayout: {
    flex: 1,
    width: "100%",
    gap: 20,
    minHeight: 0,
  },

  deckColumn: {
    flex: 1,
    minWidth: 0,
  },

  deck: {
    width: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 9,
  },

  backCard: {
    top: 10,
    bottom: -10,
    left: 8,
    right: 8,
  },

  lastCardBackground: {
    ...StyleSheet.absoluteFillObject,
    top: 10,
    bottom: -10,
    left: 8,
    right: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  lastCardText: {
    fontSize: 12,
  },

  jobCardBody: {
    overflow: "hidden",
  },

  cardTopRow: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    zIndex: 3,
  },

  companyIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  logoWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },

  logoImage: {
    width: "78%",
    height: "78%",
  },

  logoFallback: {
    fontSize: 22,
  },

  companyTopText: {
    flex: 1,
    minWidth: 0,
  },

  companyTopName: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 16,
  },

  companyTopActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    marginTop: 1,
  },

  companyTopLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 9,
    lineHeight: 13,
  },

  cardTopActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  matchBadge: {
    minHeight: 31,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  matchBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
  },

  saveButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.42)",
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonActive: {
    backgroundColor: "rgba(59,130,246,0.72)",
    borderColor: "rgba(255,255,255,0.70)",
  },

  cardBottomInfo: {
    position: "absolute",
    left: 17,
    right: 17,
    bottom: 18,
    zIndex: 3,
  },

  partnerBadge: {
    alignSelf: "flex-start",
    minHeight: 27,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.43)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.34)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 9,
  },

  partnerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
  },

  jobTitle: {
    color: "#FFFFFF",
    letterSpacing: -0.55,
  },

  jobCompanyLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  jobCompanyText: {
    flex: 1,
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    lineHeight: 18,
  },

  jobLocationLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  jobLocationText: {
    flex: 1,
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    lineHeight: 16,
  },

  primaryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },

  cardChip: {
    maxWidth: "100%",
    minHeight: 29,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  cardChipDefault: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.29)",
  },

  cardChipHighlight: {
    backgroundColor: "rgba(16,185,129,0.32)",
    borderColor: "rgba(52,211,153,0.65)",
  },

  cardChipText: {
    maxWidth: 190,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  cardChipHighlightText: {
    color: "#D1FAE5",
  },

  skillsContainer: {
    marginTop: 11,
  },

  skillsTitle: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.55,
    marginBottom: 6,
  },

  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  skillChip: {
    maxWidth: 145,
    minHeight: 27,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(3,7,18,0.34)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  skillChipText: {
    color: "#FFFFFF",
    fontSize: 9,
  },

  cardDetailsButton: {
    width: "100%",
    minHeight: 56,
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.42)",
    backgroundColor: "rgba(3,7,18,0.58)",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  cardDetailsIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  cardDetailsContent: {
    flex: 1,
    minWidth: 0,
  },

  cardDetailsTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 15,
  },

  cardDetailsSubtitle: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 8,
    lineHeight: 12,
    marginTop: 1,
  },

  cardDetailsArrow: {
    width: 31,
    height: 31,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  previewOverlay: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.42)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  previewOverlayText: {
    color: "#FFFFFF",
    fontSize: 10,
  },

  stamp: {
    position: "absolute",
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 11,
    borderWidth: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    zIndex: 10,
  },

  likeStamp: {
    top: 102,
    right: 24,
    backgroundColor: "rgba(34,197,94,0.88)",
    borderColor: "#86EFAC",
  },

  passStamp: {
    top: 102,
    left: 24,
    backgroundColor: "rgba(239,68,68,0.88)",
    borderColor: "#FCA5A5",
  },

  superStamp: {
    top: "42%",
    alignSelf: "center",
    backgroundColor: "rgba(59,130,246,0.90)",
    borderColor: "#93C5FD",
  },

  stampText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },

  actions: {
    width: "100%",
    minHeight: 92,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
  },

  actionButton: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.25,
    shadowRadius: 13,
    elevation: 6,
  },

  previewColumn: {
    width: 350,
    flexShrink: 0,
    gap: 12,
  },

  previewPanel: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
  },

  previewPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  previewPanelIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  previewPanelHeading: {
    flex: 1,
    minWidth: 0,
  },

  previewPanelTitle: {
    fontSize: 14,
    lineHeight: 19,
  },

  previewPanelSubtitle: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 1,
  },

  matchScoreCard: {
    minHeight: 86,
    padding: 13,
    marginTop: 15,
    borderWidth: 1,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  matchScoreLabel: {
    fontSize: 10,
    lineHeight: 14,
  },

  matchScoreValue: {
    fontSize: 30,
    lineHeight: 35,
    marginTop: 1,
  },

  matchScoreIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  previewSectionTitle: {
    fontSize: 12,
    marginTop: 17,
    marginBottom: 10,
  },

  matchReasons: {
    gap: 9,
  },

  matchReason: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  matchReasonCheck: {
    width: 23,
    height: 23,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  matchReasonText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 16,
  },

  companyPreviewRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  companyPreviewInfo: {
    flex: 1,
    minWidth: 0,
  },

  companyPreviewLabel: {
    fontSize: 9,
    lineHeight: 13,
  },

  companyPreviewName: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },

  fecapPreviewBadge: {
    minHeight: 27,
    paddingHorizontal: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  fecapPreviewText: {
    fontSize: 9,
  },

  previewDetailsButton: {
    minHeight: 44,
    paddingHorizontal: 13,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  previewDetailsButtonText: {
    fontSize: 11,
  },

  nextPreview: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
  },

  nextPreviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  nextPreviewHeading: {
    flex: 1,
    minWidth: 0,
  },

  nextPreviewEyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  nextPreviewTitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  nextMatchBadge: {
    minWidth: 48,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  nextMatchText: {
    fontSize: 10,
  },

  nextPreviewCompany: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
  },

  guideCard: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
  },

  guideTitle: {
    fontSize: 12,
    marginBottom: 11,
  },

  guideItem: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  guideIcon: {
    width: 33,
    height: 33,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  guideText: {
    flex: 1,
    minWidth: 0,
  },

  guideLabel: {
    fontSize: 9,
    lineHeight: 13,
  },

  guideAction: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },

  summaryPanel: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
  },

  summaryPanelTitle: {
    fontSize: 16,
    marginBottom: 13,
  },

  summaryRow: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryLabel: {
    flex: 1,
    fontSize: 11,
  },

  summaryValue: {
    fontSize: 14,
  },

  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  emptyState: {
    width: "100%",
    minHeight: 480,
    padding: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIconGlow: {
    width: 103,
    height: 103,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 21,
    lineHeight: 27,
    marginTop: 18,
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 440,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    textAlign: "center",
  },

  emptyMetrics: {
    width: "100%",
    maxWidth: 470,
    flexDirection: "row",
    gap: 7,
    marginTop: 18,
  },

  emptyMetric: {
    flex: 1,
    minWidth: 0,
    minHeight: 76,
    padding: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyMetricValue: {
    fontSize: 16,
    marginTop: 4,
  },

  emptyMetricLabel: {
    fontSize: 8,
    marginTop: 1,
  },

  processingCard: {
    width: "100%",
    maxWidth: 470,
    padding: 13,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 15,
  },

  processingText: {
    flex: 1,
    minWidth: 0,
  },

  processingTitle: {
    fontSize: 11,
    lineHeight: 15,
  },

  processingDescription: {
    fontSize: 9,
    lineHeight: 15,
    marginTop: 2,
  },

  resetButton: {
    minHeight: 46,
    paddingHorizontal: 19,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  resetButtonText: {
    fontSize: 12,
  },
});