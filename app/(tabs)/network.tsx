import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Line,
  Pattern,
  Rect,
} from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  COMPANIES,
  companyById,
  userById,
} from "@/src/services/mock-data";

import {
  companyPathSummary,
  computeGraphLayout,
  directConnections,
  formatPathNames,
  pathToCompany,
} from "@/src/services/graph";

import { useTheme } from "@/src/theme/ThemeContext";

type GraphFilter = "all" | "direct" | "path";

type GraphUser = NonNullable<
  ReturnType<typeof userById>
>;

type GraphCompany = NonNullable<
  ReturnType<typeof companyById>
>;

type GraphCompanyWithMetadata = GraphCompany & {
  logo?: string;
  isFecapPartner?: boolean;
};

type GraphNode = {
  id: string;
  x: number;
  y: number;
};

type GraphEdge = {
  from: string;
  to: string;
};

const WORLD_SIZE = 820;
const WORLD_CENTER = WORLD_SIZE / 2;

const MIN_SCALE = 0.55;
const MAX_SCALE = 2.4;
const DEFAULT_SCALE = 0.9;

function clamp(
  value: number,
  min: number,
  max: number,
) {
  "worklet";

  return Math.min(Math.max(value, min), max);
}

function getRoleLabel(role?: string) {
  switch (role) {
    case "alumni":
      return "Alumni";

    case "professor":
      return "Professor";

    case "student":
      return "Aluno";

    default:
      return "Membro";
  }
}

function getRoleIcon(
  role?: string,
): keyof typeof Ionicons.glyphMap {
  switch (role) {
    case "alumni":
      return "briefcase-outline";

    case "professor":
      return "school-outline";

    case "student":
      return "book-outline";

    default:
      return "person-outline";
  }
}

function getCompanyLogoUrl(
  company?: GraphCompany | null,
) {
  if (!company) {
    return "";
  }

  const companyWithMetadata =
    company as GraphCompanyWithMetadata;

  return (
    company.logoUrl ??
    companyWithMetadata.logo ??
    ""
  );
}

function isFecapPartner(
  company?: GraphCompany | null,
) {
  if (!company) {
    return false;
  }

  return Boolean(
    (company as GraphCompanyWithMetadata)
      .isFecapPartner,
  );
}

function UserAvatar({
  user,
  size,
  borderColor,
  backgroundColor,
}: {
  user: GraphUser;
  size: number;
  borderColor: string;
  backgroundColor: string;
}) {
  const [imageFailed, setImageFailed] =
    useState(false);

  const initials = useMemo(() => {
    return user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }, [user.name]);

  useEffect(() => {
    setImageFailed(false);
  }, [user.avatarUrl]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {!imageFailed && user.avatarUrl ? (
        <Image
          source={{
            uri: user.avatarUrl,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: Math.max(10, size * 0.3),
            fontWeight: "800",
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

function CompanyLogo({
  company,
  size = 24,
  borderRadius = 7,
  backgroundColor = "#FFFFFF",
  borderColor,
  padding = 3,
}: {
  company: GraphCompany;
  size?: number;
  borderRadius?: number;
  backgroundColor?: string;
  borderColor?: string;
  padding?: number;
}) {
  const [imageFailed, setImageFailed] =
    useState(false);

  const logoUrl = useMemo(
    () => getCompanyLogoUrl(company),
    [company],
  );

  const initials = useMemo(() => {
    return company.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }, [company.name]);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const showImage =
    Boolean(logoUrl) && !imageFailed;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor,
        borderWidth: borderColor ? 1 : 0,
        borderColor,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {showImage ? (
        <Image
          source={{
            uri: logoUrl,
          }}
          style={{
            width: size - padding * 2,
            height: size - padding * 2,
          }}
          contentFit="contain"
          transition={150}
          cachePolicy="memory-disk"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              company.color || "#2563EB",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: Math.max(8, size * 0.3),
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

function GraphLegend({
  colors,
}: {
  colors: ReturnType<
    typeof useTheme
  >["colors"];
}) {
  const items = [
    {
      label: "Você",
      color: colors.brandPrimary,
    },
    {
      label: "No caminho",
      color: colors.brand,
    },
    {
      label: "Conexão",
      color: colors.surfaceTertiary,
    },
  ];

  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View
          key={item.label}
          style={styles.legendItem}
        >
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: item.color,
                borderColor: colors.borderStrong,
              },
            ]}
          />

          <Text
            style={{
              color: colors.onSurfaceTertiary,
              fontSize: 10,
              fontWeight: "600",
            }}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function GraphControls({
  colors,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  colors: ReturnType<
    typeof useTheme
  >["colors"];
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}) {
  const buttons = [
    {
      icon: "add" as const,
      label: "Aumentar zoom",
      action: onZoomIn,
    },
    {
      icon: "remove" as const,
      label: "Diminuir zoom",
      action: onZoomOut,
    },
    {
      icon: "locate-outline" as const,
      label: "Centralizar mapa",
      action: onReset,
    },
  ];

  return (
    <View
      style={[
        styles.graphControls,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {buttons.map((button, index) => (
        <Pressable
          key={button.label}
          accessibilityRole="button"
          accessibilityLabel={button.label}
          onPress={button.action}
          style={({ pressed }) => [
            styles.graphControlButton,

            index < buttons.length - 1 && {
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            },

            pressed && {
              opacity: 0.65,
            },
          ]}
        >
          <Ionicons
            name={button.icon}
            size={18}
            color={colors.onSurface}
          />
        </Pressable>
      ))}
    </View>
  );
}

function UserDetailsCard({
  user,
  isDirectConnection,
  onClose,
  onOpenProfile,
}: {
  user: GraphUser;
  isDirectConnection: boolean;
  onClose?: () => void;
  onOpenProfile: () => void;
}) {
  const { colors, radius, typography } =
    useTheme();

  const company = user.companyCurrent
    ? companyById(user.companyCurrent)
    : null;

  return (
    <View
      style={[
        styles.userDetailsCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={styles.detailsHeader}>
        <Text
          style={{
            flex: 1,
            color: colors.onSurface,
            fontSize: 16,
            fontWeight: typography.weight.bold,
          }}
        >
          Perfil da conexão
        </Text>

        {onClose && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar detalhes"
            onPress={onClose}
            style={[
              styles.smallIconButton,
              {
                backgroundColor:
                  colors.surfaceSecondary,
              },
            ]}
          >
            <Ionicons
              name="close"
              size={18}
              color={colors.onSurface}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.detailsIdentity}>
        <UserAvatar
          user={user}
          size={72}
          borderColor={colors.brandPrimary}
          backgroundColor={colors.brandPrimary}
        />

        <View style={styles.detailsIdentityText}>
          <Text
            style={{
              color: colors.onSurface,
              fontSize: 18,
              fontWeight: typography.weight.heavy,
            }}
          >
            {user.name}
          </Text>

          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor:
                  colors.brandSecondary,
              },
            ]}
          >
            <Ionicons
              name={getRoleIcon(user.role)}
              size={13}
              color={colors.onBrandSecondary}
            />

            <Text
              style={{
                color: colors.onBrandSecondary,
                fontSize: 11,
                fontWeight:
                  typography.weight.bold,
              }}
            >
              {getRoleLabel(user.role)}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.connectionStatus,
          {
            backgroundColor: isDirectConnection
              ? colors.brandSecondary
              : colors.surfaceSecondary,
          },
        ]}
      >
        <Ionicons
          name={
            isDirectConnection
              ? "people"
              : "git-network-outline"
          }
          size={16}
          color={
            isDirectConnection
              ? colors.onBrandSecondary
              : colors.onSurfaceTertiary
          }
        />

        <Text
          style={{
            flex: 1,
            color: isDirectConnection
              ? colors.onBrandSecondary
              : colors.onSurfaceTertiary,
            fontSize: 12,
            fontWeight: "600",
          }}
        >
          {isDirectConnection
            ? "Conexão direta com você"
            : "Conexão indireta da sua rede"}
        </Text>
      </View>

      <View style={styles.detailsInformation}>
        <View style={styles.informationRow}>
          {company ? (
            <CompanyLogo
              company={company}
              size={38}
              borderRadius={11}
              backgroundColor="#FFFFFF"
              borderColor={colors.border}
              padding={4}
            />
          ) : (
            <View
              style={[
                styles.informationIcon,
                {
                  backgroundColor:
                    colors.surfaceSecondary,
                },
              ]}
            >
              <Ionicons
                name="business-outline"
                size={17}
                color={colors.brandPrimary}
              />
            </View>
          )}

          <View style={styles.informationText}>
            <Text
              style={{
                color: colors.onSurfaceTertiary,
                fontSize: 10,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              Empresa
            </Text>

            <Text
              style={{
                color: colors.onSurface,
                fontSize: 13,
                fontWeight:
                  typography.weight.semibold,
                marginTop: 2,
              }}
            >
              {company?.name ??
                "Empresa não informada"}
            </Text>

            {company &&
              isFecapPartner(company) && (
                <View
                  style={
                    styles.detailsPartnerRow
                  }
                >
                  <Ionicons
                    name="school-outline"
                    size={11}
                    color={colors.brandPrimary}
                  />

                  <Text
                    style={{
                      color: colors.brandPrimary,
                      fontSize: 10,
                      fontWeight:
                        typography.weight.semibold,
                    }}
                  >
                    Empresa parceira da FECAP
                  </Text>
                </View>
              )}
          </View>
        </View>

        <View style={styles.informationRow}>
          <View
            style={[
              styles.informationIcon,
              {
                backgroundColor:
                  colors.surfaceSecondary,
              },
            ]}
          >
            <Ionicons
              name="school-outline"
              size={17}
              color={colors.brandPrimary}
            />
          </View>

          <View style={styles.informationText}>
            <Text
              style={{
                color: colors.onSurfaceTertiary,
                fontSize: 10,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              Curso
            </Text>

            <Text
              style={{
                color: colors.onSurface,
                fontSize: 13,
                fontWeight:
                  typography.weight.semibold,
                marginTop: 2,
              }}
            >
              {user.course ||
                "Curso não informado"}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Visualizar perfil completo de ${user.name}`}
        onPress={onOpenProfile}
        style={({ pressed }) => [
          styles.primaryDetailsButton,
          {
            backgroundColor:
              colors.brandPrimary,
          },

          pressed && {
            opacity: 0.82,
          },
        ]}
      >
        <Ionicons
          name="person-outline"
          size={17}
          color={colors.onBrandPrimary}
        />

        <Text
          style={{
            color: colors.onBrandPrimary,
            fontSize: 13,
            fontWeight: typography.weight.bold,
          }}
        >
          Visualizar perfil completo
        </Text>
      </Pressable>

      <View style={styles.detailsActionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Enviar mensagem para ${user.name}`}
          style={({ pressed }) => [
            styles.secondaryDetailsButton,
            {
              backgroundColor:
                colors.surfaceSecondary,
              borderColor: colors.border,
            },

            pressed && {
              opacity: 0.75,
            },
          ]}
        >
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={colors.brandPrimary}
          />

          <Text
            style={{
              color: colors.brandPrimary,
              fontSize: 12,
              fontWeight: typography.weight.bold,
            }}
          >
            Mensagem
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pedir apresentação para ${user.name}`}
          style={({ pressed }) => [
            styles.secondaryDetailsButton,
            {
              backgroundColor:
                colors.surfaceSecondary,
              borderColor: colors.border,
            },

            pressed && {
              opacity: 0.75,
            },
          ]}
        >
          <Ionicons
            name="people-outline"
            size={17}
            color={colors.brandPrimary}
          />

          <Text
            style={{
              color: colors.brandPrimary,
              fontSize: 12,
              fontWeight: typography.weight.bold,
            }}
          >
            Apresentação
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function InteractiveGraph({
  nodes,
  edges,
  directUserIds,
  activePathSet,
  selectedUserId,
  viewportHeight,
  onSelectUser,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directUserIds: Set<string>;
  activePathSet: Set<string>;
  selectedUserId: string | null;
  viewportHeight: number;
  onSelectUser: (userId: string) => void;
}) {
  const { colors, radius, typography } =
    useTheme();

  const { width } = useWindowDimensions();

  const viewportWidth = Math.max(
    280,
    Math.min(width - 32, 860),
  );

  const translateX = useSharedValue(
    viewportWidth / 2 -
      WORLD_CENTER * DEFAULT_SCALE,
  );

  const translateY = useSharedValue(
    viewportHeight / 2 -
      WORLD_CENTER * DEFAULT_SCALE,
  );

  const scale = useSharedValue(DEFAULT_SCALE);

  const savedTranslateX = useSharedValue(
    translateX.value,
  );

  const savedTranslateY = useSharedValue(
    translateY.value,
  );

  const savedScale =
    useSharedValue(DEFAULT_SCALE);

  const resetGraph = useCallback(() => {
    translateX.value = withTiming(
      viewportWidth / 2 -
        WORLD_CENTER * DEFAULT_SCALE,
      {
        duration: 250,
      },
    );

    translateY.value = withTiming(
      viewportHeight / 2 -
        WORLD_CENTER * DEFAULT_SCALE,
      {
        duration: 250,
      },
    );

    scale.value = withTiming(DEFAULT_SCALE, {
      duration: 250,
    });
  }, [
    scale,
    translateX,
    translateY,
    viewportHeight,
    viewportWidth,
  ]);

  useEffect(() => {
    resetGraph();
  }, [resetGraph]);

  const zoomIn = useCallback(() => {
    scale.value = withTiming(
      clamp(
        scale.value + 0.2,
        MIN_SCALE,
        MAX_SCALE,
      ),
      {
        duration: 180,
      },
    );
  }, [scale]);

  const zoomOut = useCallback(() => {
    scale.value = withTiming(
      clamp(
        scale.value - 0.2,
        MIN_SCALE,
        MAX_SCALE,
      ),
      {
        duration: 180,
      },
    );
  }, [scale]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(8)
        .onStart(() => {
          savedTranslateX.value =
            translateX.value;

          savedTranslateY.value =
            translateY.value;
        })
        .onUpdate((event) => {
          translateX.value =
            savedTranslateX.value +
            event.translationX;

          translateY.value =
            savedTranslateY.value +
            event.translationY;
        }),
    [
      savedTranslateX,
      savedTranslateY,
      translateX,
      translateY,
    ],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          savedScale.value = scale.value;

          savedTranslateX.value =
            translateX.value;

          savedTranslateY.value =
            translateY.value;
        })
        .onUpdate((event) => {
          const nextScale = clamp(
            savedScale.value * event.scale,
            MIN_SCALE,
            MAX_SCALE,
          );

          const scaleRatio =
            nextScale / savedScale.value;

          translateX.value =
            savedTranslateX.value +
            (1 - scaleRatio) *
              (event.focalX -
                savedTranslateX.value);

          translateY.value =
            savedTranslateY.value +
            (1 - scaleRatio) *
              (event.focalY -
                savedTranslateY.value);

          scale.value = nextScale;
        }),
    [
      savedScale,
      savedTranslateX,
      savedTranslateY,
      scale,
      translateX,
      translateY,
    ],
  );

  const graphGesture = useMemo(
    () =>
      Gesture.Simultaneous(
        panGesture,
        pinchGesture,
      ),
    [panGesture, pinchGesture],
  );

  const worldAnimatedStyle =
    useAnimatedStyle(() => ({
      transform: [
        {
          translateX: translateX.value,
        },
        {
          translateY: translateY.value,
        },
        {
          scale: scale.value,
        },
      ],
    }));

  const nodesById = useMemo(() => {
    return new Map(
      nodes.map((node) => [node.id, node]),
    );
  }, [nodes]);

  return (
    <View
      style={[
        styles.graphViewport,
        {
          width: "100%",
          height: viewportHeight,
          backgroundColor:
            colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
      testID="graph-canvas"
    >
      <GestureDetector gesture={graphGesture}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.graphWorld,
              {
                width: WORLD_SIZE,
                height: WORLD_SIZE,
              },
              worldAnimatedStyle,
            ]}
          >
            <Svg
              width={WORLD_SIZE}
              height={WORLD_SIZE}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <Defs>
                <Pattern
                  id="graph-grid"
                  width="28"
                  height="28"
                  patternUnits="userSpaceOnUse"
                >
                  <Circle
                    cx="2"
                    cy="2"
                    r="1.2"
                    fill={colors.border}
                    opacity={0.55}
                  />
                </Pattern>
              </Defs>

              <Rect
                width={WORLD_SIZE}
                height={WORLD_SIZE}
                fill="url(#graph-grid)"
              />

              {edges.map((edge, index) => {
                const from = nodesById.get(
                  edge.from,
                );

                const to = nodesById.get(edge.to);

                if (!from || !to) {
                  return null;
                }

                const isHighlighted =
                  activePathSet.has(edge.from) &&
                  activePathSet.has(edge.to);

                return (
                  <Line
                    key={`${edge.from}-${edge.to}-${index}`}
                    x1={WORLD_CENTER + from.x}
                    y1={WORLD_CENTER + from.y}
                    x2={WORLD_CENTER + to.x}
                    y2={WORLD_CENTER + to.y}
                    stroke={
                      isHighlighted
                        ? colors.brandPrimary
                        : colors.borderStrong
                    }
                    strokeWidth={
                      isHighlighted ? 4 : 1.5
                    }
                    strokeOpacity={
                      isHighlighted ? 1 : 0.55
                    }
                    strokeLinecap="round"
                  />
                );
              })}
            </Svg>

            {nodes.map((node) => {
              const user = userById(node.id);

              if (!user) {
                return null;
              }

              const isMe = node.id === "u_me";

              const isInPath =
                activePathSet.has(node.id);

              const isSelected =
                selectedUserId === node.id;

              const isDirect =
                directUserIds.has(node.id);

              const nodeSize = isMe
                ? 66
                : isSelected
                  ? 58
                  : isInPath
                    ? 52
                    : 46;

              const nodeBackground = isMe
                ? colors.brandPrimary
                : isInPath
                  ? colors.brand
                  : colors.surfaceTertiary;

              const borderColor = isSelected
                ? colors.brandPrimary
                : isInPath
                  ? colors.brandPrimary
                  : colors.borderStrong;

              return (
                <Pressable
                  key={node.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Visualizar ${user.name}`}
                  testID={`graph-node-${node.id}`}
                  onPress={() =>
                    onSelectUser(node.id)
                  }
                  style={({ pressed }) => [
                    styles.graphNodeWrapper,
                    {
                      left:
                        WORLD_CENTER +
                        node.x -
                        nodeSize / 2,
                      top:
                        WORLD_CENTER +
                        node.y -
                        nodeSize / 2,
                      width: nodeSize,
                    },

                    pressed && {
                      transform: [
                        {
                          scale: 0.92,
                        },
                      ],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.graphNodeShadow,
                      {
                        width: nodeSize,
                        height: nodeSize,
                        borderRadius:
                          nodeSize / 2,
                        shadowColor:
                          colors.onSurface,
                      },
                    ]}
                  >
                    <UserAvatar
                      user={user}
                      size={nodeSize}
                      borderColor={borderColor}
                      backgroundColor={
                        nodeBackground
                      }
                    />

                    {isDirect && !isMe && (
                      <View
                        style={[
                          styles.directIndicator,
                          {
                            backgroundColor:
                              colors.brandPrimary,
                            borderColor:
                              colors.surfaceSecondary,
                          },
                        ]}
                      >
                        <Ionicons
                          name="link"
                          size={10}
                          color={
                            colors.onBrandPrimary
                          }
                        />
                      </View>
                    )}

                    {isSelected && (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.selectedNodeRing,
                          {
                            width: nodeSize + 10,
                            height: nodeSize + 10,
                            borderRadius:
                              (nodeSize + 10) / 2,
                            borderColor:
                              colors.brandPrimary,
                          },
                        ]}
                      />
                    )}
                  </View>

                  <View
                    style={[
                      styles.graphNodeLabel,
                      {
                        backgroundColor:
                          colors.surface,
                        borderColor:
                          colors.border,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        color: colors.onSurface,
                        fontSize: 11,
                        fontWeight:
                          typography.weight.bold,
                      }}
                    >
                      {isMe
                        ? "Você"
                        : user.name.split(" ")[0]}
                    </Text>

                    {!isMe && (
                      <Text
                        numberOfLines={1}
                        style={{
                          color:
                            colors.onSurfaceTertiary,
                          fontSize: 8,
                          fontWeight: "600",
                          marginTop: 1,
                        }}
                      >
                        {getRoleLabel(user.role)}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
      </GestureDetector>

      <View
        pointerEvents="none"
        style={[
          styles.graphInstruction,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name={
            Platform.OS === "web"
              ? "hand-left-outline"
              : "scan-outline"
          }
          size={14}
          color={colors.onSurfaceTertiary}
        />

        <Text
          style={{
            color: colors.onSurfaceTertiary,
            fontSize: 10,
            fontWeight: "600",
          }}
        >
          {Platform.OS === "web"
            ? "Arraste para mover • use os botões para zoom"
            : "Arraste para mover • use dois dedos para zoom"}
        </Text>
      </View>

      <GraphLegend colors={colors} />

      <GraphControls
        colors={colors}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetGraph}
      />
    </View>
  );
}

export default function Network() {
  const { colors, radius, typography } =
    useTheme();

  const { width } = useWindowDimensions();
  const router = useRouter();

  const isDesktop = width >= 900;

  const [selectedCompany, setSelectedCompany] =
    useState<string | null>("c_nubank");

  const [selectedUserId, setSelectedUserId] =
    useState<string | null>(null);

  const [graphFilter, setGraphFilter] =
    useState<GraphFilter>("all");

  const layout = useMemo(
    () => computeGraphLayout("u_me", 255),
    [],
  );

  const direct = useMemo(
    () => directConnections("u_me"),
    [],
  );

  const directUserIds = useMemo(
    () =>
      new Set(direct.map((user) => user.id)),
    [direct],
  );

  const activeCompany = useMemo(() => {
    if (!selectedCompany) {
      return null;
    }

    return companyById(selectedCompany) ?? null;
  }, [selectedCompany]);

  const activePath = useMemo(() => {
    if (!selectedCompany) {
      return null;
    }

    return pathToCompany(
      "u_me",
      selectedCompany,
    );
  }, [selectedCompany]);

  const activePathSet = useMemo(
    () =>
      new Set<string>(activePath?.path ?? []),
    [activePath],
  );

  const selectedUser = useMemo(() => {
    if (!selectedUserId) {
      return null;
    }

    return userById(selectedUserId) ?? null;
  }, [selectedUserId]);

  const visibleNodes = useMemo(() => {
    switch (graphFilter) {
      case "direct":
        return layout.nodes.filter(
          (node) =>
            node.id === "u_me" ||
            directUserIds.has(node.id),
        );

      case "path":
        if (activePathSet.size === 0) {
          return layout.nodes;
        }

        return layout.nodes.filter((node) =>
          activePathSet.has(node.id),
        );

      default:
        return layout.nodes;
    }
  }, [
    activePathSet,
    directUserIds,
    graphFilter,
    layout.nodes,
  ]);

  const visibleNodeIds = useMemo(
    () =>
      new Set(
        visibleNodes.map((node) => node.id),
      ),
    [visibleNodes],
  );

  const visibleEdges = useMemo(
    () =>
      layout.edges.filter(
        (edge) =>
          visibleNodeIds.has(edge.from) &&
          visibleNodeIds.has(edge.to),
      ),
    [layout.edges, visibleNodeIds],
  );

  const openUserProfile = useCallback(
    (userId: string) => {
      router.push(`/user/${userId}`);
    },
    [router],
  );

  const selectUser = useCallback(
    (userId: string) => {
      setSelectedUserId(userId);
    },
    [],
  );

  const graphFilters: Array<{
    id: GraphFilter;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      id: "all",
      label: "Todos",
      icon: "git-network-outline",
    },
    {
      id: "direct",
      label: "Diretas",
      icon: "people-outline",
    },
    {
      id: "path",
      label: "Caminho",
      icon: "git-branch-outline",
    },
  ];

  const mainContent = (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.companyChipsContent
        }
        testID="network-company-chips"
      >
        {COMPANIES.slice(0, 12).map(
          (company) => {
            const isActive =
              selectedCompany === company.id;

            return (
              <Pressable
                key={company.id}
                accessibilityRole="button"
                accessibilityLabel={`Selecionar empresa ${company.name}`}
                onPress={() =>
                  setSelectedCompany(company.id)
                }
                testID={`company-chip-${company.id}`}
                style={({ pressed }) => [
                  styles.companyChip,
                  {
                    backgroundColor: isActive
                      ? colors.brandPrimary
                      : colors.surfaceSecondary,
                    borderColor: isActive
                      ? colors.brandPrimary
                      : colors.border,
                  },

                  pressed && {
                    opacity: 0.78,
                  },
                ]}
              >
                <CompanyLogo
                  company={company}
                  size={26}
                  borderRadius={8}
                  backgroundColor="#FFFFFF"
                  borderColor={
                    isActive
                      ? "rgba(255, 255, 255, 0.45)"
                      : colors.border
                  }
                  padding={3}
                />

                <Text
                  numberOfLines={1}
                  style={{
                    color: isActive
                      ? colors.onBrandPrimary
                      : colors.onSurface,
                    fontSize: 12,
                    fontWeight:
                      typography.weight.semibold,
                  }}
                >
                  {company.name}
                </Text>

                {isFecapPartner(company) && (
                  <View
                    style={[
                      styles.partnerIndicator,
                      {
                        backgroundColor: isActive
                          ? "rgba(255, 255, 255, 0.2)"
                          : colors.brandSecondary,
                      },
                    ]}
                  >
                    <Ionicons
                      name="school-outline"
                      size={10}
                      color={
                        isActive
                          ? colors.onBrandPrimary
                          : colors.onBrandSecondary
                      }
                    />
                  </View>
                )}

                {isActive && (
                  <Ionicons
                    name="checkmark-circle"
                    size={15}
                    color={
                      colors.onBrandPrimary
                    }
                  />
                )}
              </Pressable>
            );
          },
        )}
      </ScrollView>

      <View style={styles.contentPadding}>
        {activePath &&
          selectedCompany &&
          activeCompany && (
            <View
              style={[
                styles.pathCard,
                {
                  backgroundColor:
                    colors.brandSecondary,
                  borderRadius: radius.lg,
                },
              ]}
              testID="network-path-card"
            >
              <View style={styles.pathCardTop}>
                <CompanyLogo
                  company={activeCompany}
                  size={44}
                  borderRadius={13}
                  backgroundColor="#FFFFFF"
                  borderColor="rgba(255, 255, 255, 0.5)"
                  padding={5}
                />

                <View style={styles.pathCardText}>
                  <View
                    style={
                      styles.pathCompanyTitleRow
                    }
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        color:
                          colors.onBrandSecondary,
                        fontWeight:
                          typography.weight.bold,
                        fontSize: 15,
                      }}
                    >
                      {companyPathSummary(
                        "u_me",
                        selectedCompany,
                      )}
                    </Text>

                    {isFecapPartner(
                      activeCompany,
                    ) && (
                      <View
                        style={[
                          styles.pathPartnerBadge,
                          {
                            backgroundColor:
                              colors.surface,
                          },
                        ]}
                      >
                        <Ionicons
                          name="school-outline"
                          size={10}
                          color={
                            colors.brandPrimary
                          }
                        />

                        <Text
                          style={{
                            color:
                              colors.brandPrimary,
                            fontSize: 9,
                            fontWeight:
                              typography.weight
                                .bold,
                          }}
                        >
                          Parceira
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={{
                      color:
                        colors.onBrandSecondary,
                      fontSize: 12,
                      marginTop: 4,
                      opacity: 0.82,
                      lineHeight: 17,
                    }}
                  >
                    {formatPathNames(
                      activePath.path,
                    )}
                  </Text>
                </View>

                <View
                  style={[
                    styles.degreeBadge,
                    {
                      backgroundColor:
                        colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        colors.brandPrimary,
                      fontSize: 11,
                      fontWeight:
                        typography.weight.bold,
                    }}
                  >
                    {Math.max(
                      activePath.path.length - 1,
                      0,
                    )}
                    º
                  </Text>
                </View>
              </View>
            </View>
          )}

        <View style={styles.graphSectionHeader}>
          <View>
            <Text
              style={{
                color: colors.onSurface,
                fontSize: 17,
                fontWeight:
                  typography.weight.bold,
              }}
            >
              Mapa da sua rede
            </Text>

            <Text
              style={{
                color:
                  colors.onSurfaceTertiary,
                fontSize: 11,
                marginTop: 3,
              }}
            >
              {visibleNodes.length} pessoas
              exibidas
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.graphFilterContent
            }
          >
            {graphFilters.map((filter) => {
              const isActive =
                graphFilter === filter.id;

              return (
                <Pressable
                  key={filter.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrar mapa por ${filter.label}`}
                  onPress={() =>
                    setGraphFilter(filter.id)
                  }
                  style={({ pressed }) => [
                    styles.graphFilterButton,
                    {
                      backgroundColor: isActive
                        ? colors.brandPrimary
                        : colors.surfaceSecondary,
                      borderColor: isActive
                        ? colors.brandPrimary
                        : colors.border,
                    },

                    pressed && {
                      opacity: 0.78,
                    },
                  ]}
                >
                  <Ionicons
                    name={filter.icon}
                    size={14}
                    color={
                      isActive
                        ? colors.onBrandPrimary
                        : colors.onSurfaceTertiary
                    }
                  />

                  <Text
                    style={{
                      color: isActive
                        ? colors.onBrandPrimary
                        : colors.onSurface,
                      fontSize: 11,
                      fontWeight:
                        typography.weight.bold,
                    }}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <InteractiveGraph
          nodes={visibleNodes}
          edges={visibleEdges}
          directUserIds={directUserIds}
          activePathSet={activePathSet}
          selectedUserId={selectedUserId}
          viewportHeight={
            isDesktop ? 560 : 440
          }
          onSelectUser={selectUser}
        />

        <View style={styles.directSection}>
          <View style={styles.sectionTitleRow}>
            <View>
              <Text
                style={{
                  color: colors.onSurface,
                  fontSize: 17,
                  fontWeight:
                    typography.weight.bold,
                }}
              >
                Conexões diretas
              </Text>

              <Text
                style={{
                  color:
                    colors.onSurfaceTertiary,
                  fontSize: 11,
                  marginTop: 3,
                }}
              >
                Pessoas conectadas diretamente
                com você
              </Text>
            </View>

            <View
              style={[
                styles.connectionCount,
                {
                  backgroundColor:
                    colors.brandSecondary,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    colors.onBrandSecondary,
                  fontSize: 12,
                  fontWeight:
                    typography.weight.bold,
                }}
              >
                {direct.length}
              </Text>
            </View>
          </View>

          <View
            style={
              isDesktop
                ? styles.directConnectionsGrid
                : undefined
            }
          >
            {direct.map((user) => {
              const company = user.companyCurrent
                ? companyById(
                    user.companyCurrent,
                  )
                : null;

              const isSelected =
                selectedUserId === user.id;

              return (
                <Pressable
                  key={user.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Visualizar conexão ${user.name}`}
                  onPress={() =>
                    selectUser(user.id)
                  }
                  onLongPress={() =>
                    openUserProfile(user.id)
                  }
                  testID={`connection-${user.id}`}
                  style={({ pressed }) => [
                    styles.connectionCard,

                    isDesktop && {
                      width: "49%",
                    },

                    {
                      backgroundColor:
                        colors.surfaceSecondary,
                      borderColor: isSelected
                        ? colors.brandPrimary
                        : colors.border,
                      borderRadius: radius.md,
                    },

                    isSelected && {
                      borderWidth: 2,
                    },

                    pressed && {
                      opacity: 0.78,
                    },
                  ]}
                >
                  <View
                    style={
                      styles.connectionAvatarContainer
                    }
                  >
                    <UserAvatar
                      user={user}
                      size={48}
                      borderColor={
                        isSelected
                          ? colors.brandPrimary
                          : colors.borderStrong
                      }
                      backgroundColor={
                        colors.brandPrimary
                      }
                    />

                    {company && (
                      <View
                        style={[
                          styles.connectionCompanyLogo,
                          {
                            backgroundColor:
                              colors.surface,
                            borderColor:
                              colors.surfaceSecondary,
                          },
                        ]}
                      >
                        <CompanyLogo
                          company={company}
                          size={22}
                          borderRadius={6}
                          backgroundColor="#FFFFFF"
                          padding={3}
                        />
                      </View>
                    )}
                  </View>

                  <View
                    style={styles.connectionInfo}
                  >
                    <View
                      style={
                        styles.connectionNameRow
                      }
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          flex: 1,
                          color:
                            colors.onSurface,
                          fontWeight:
                            typography.weight
                              .bold,
                          fontSize: 14,
                        }}
                      >
                        {user.name}
                      </Text>

                      {company &&
                        isFecapPartner(
                          company,
                        ) && (
                          <View
                            style={[
                              styles.miniPartnerBadge,
                              {
                                backgroundColor:
                                  colors.brandSecondary,
                              },
                            ]}
                          >
                            <Ionicons
                              name="school-outline"
                              size={9}
                              color={
                                colors.onBrandSecondary
                              }
                            />
                          </View>
                        )}
                    </View>

                    <Text
                      numberOfLines={1}
                      style={{
                        color:
                          colors.onSurfaceTertiary,
                        fontSize: 11,
                        marginTop: 3,
                      }}
                    >
                      {company
                        ? `${company.name} • ${user.course}`
                        : user.course}
                    </Text>

                    <View
                      style={
                        styles.connectionMetadata
                      }
                    >
                      <Ionicons
                        name={getRoleIcon(
                          user.role,
                        )}
                        size={12}
                        color={
                          colors.brandPrimary
                        }
                      />

                      <Text
                        style={{
                          color:
                            colors.brandPrimary,
                          fontSize: 10,
                          fontWeight:
                            typography.weight
                              .bold,
                        }}
                      >
                        {getRoleLabel(user.role)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.connectionArrow,
                      {
                        backgroundColor:
                          colors.surface,
                      },
                    ]}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color={
                        colors.onSurfaceTertiary
                      }
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </>
  );

  return (
    <GestureHandlerRootView
      style={styles.container}
    >
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
          },
        ]}
        edges={["top"]}
        testID="network-screen"
      >
        <View
          style={[
            styles.header,
            {
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.headerTitle}>
            <Text
              style={{
                color: colors.onSurface,
                fontSize: 24,
                fontWeight:
                  typography.weight.heavy,
                letterSpacing: -0.5,
              }}
            >
              Rede
            </Text>

            <Text
              style={{
                color:
                  colors.onSurfaceTertiary,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {direct.length} diretas • mapa
              interativo
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir notificações da rede"
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor:
                    colors.surfaceSecondary,
                  borderColor: colors.border,
                },

                pressed && {
                  opacity: 0.75,
                },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={19}
                color={colors.onSurface}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pesquisar pessoas"
              onPress={() =>
                router.push("/search")
              }
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor:
                    colors.surfaceSecondary,
                  borderColor: colors.border,
                },

                pressed && {
                  opacity: 0.75,
                },
              ]}
              testID="network-search-button"
            >
              <Ionicons
                name="search"
                size={19}
                color={colors.onSurface}
              />
            </Pressable>
          </View>
        </View>

        {isDesktop ? (
          <View style={styles.desktopLayout}>
            <ScrollView
              style={styles.desktopMainColumn}
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.desktopScrollContent
              }
            >
              {mainContent}
            </ScrollView>

            <View
              style={[
                styles.desktopSideColumn,
                {
                  borderLeftColor:
                    colors.border,
                  backgroundColor:
                    colors.surfaceSecondary,
                },
              ]}
            >
              {selectedUser ? (
                <UserDetailsCard
                  user={selectedUser}
                  isDirectConnection={directUserIds.has(
                    selectedUser.id,
                  )}
                  onClose={() =>
                    setSelectedUserId(null)
                  }
                  onOpenProfile={() =>
                    openUserProfile(
                      selectedUser.id,
                    )
                  }
                />
              ) : (
                <View
                  style={styles.emptyDetails}
                >
                  <View
                    style={[
                      styles.emptyDetailsIcon,
                      {
                        backgroundColor:
                          colors.brandSecondary,
                      },
                    ]}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={32}
                      color={
                        colors.onBrandSecondary
                      }
                    />
                  </View>

                  <Text
                    style={{
                      color: colors.onSurface,
                      fontSize: 16,
                      fontWeight:
                        typography.weight.bold,
                      textAlign: "center",
                    }}
                  >
                    Selecione uma pessoa
                  </Text>

                  <Text
                    style={{
                      color:
                        colors.onSurfaceTertiary,
                      fontSize: 12,
                      lineHeight: 18,
                      textAlign: "center",
                      marginTop: 6,
                    }}
                  >
                    Clique em um usuário no mapa
                    para visualizar suas informações
                    e acessar o perfil.
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.mobileScrollContent
            }
          >
            {mainContent}
          </ScrollView>
        )}

        {!isDesktop && (
          <Modal
            visible={Boolean(selectedUser)}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={() =>
              setSelectedUserId(null)
            }
          >
            <View style={styles.modalContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar detalhes"
                style={styles.modalBackdrop}
                onPress={() =>
                  setSelectedUserId(null)
                }
              />

              <SafeAreaView
                edges={["bottom"]}
                style={[
                  styles.mobileDetailsSheet,
                  {
                    backgroundColor:
                      colors.surface,
                    borderTopColor:
                      colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.sheetHandle,
                    {
                      backgroundColor:
                        colors.borderStrong,
                    },
                  ]}
                />

                {selectedUser && (
                  <UserDetailsCard
                    user={selectedUser}
                    isDirectConnection={directUserIds.has(
                      selectedUser.id,
                    )}
                    onClose={() =>
                      setSelectedUserId(null)
                    }
                    onOpenProfile={() =>
                      openUserProfile(
                        selectedUser.id,
                      )
                    }
                  />
                )}
              </SafeAreaView>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    minHeight: 66,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    flex: 1,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  smallIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  companyChipsContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },

  companyChip: {
    minHeight: 42,
    maxWidth: 230,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
  },

  partnerIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  contentPadding: {
    paddingHorizontal: 16,
  },

  pathCard: {
    padding: 16,
    marginTop: 6,
  },

  pathCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  pathCardText: {
    flex: 1,
  },

  pathCompanyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  pathPartnerBadge: {
    minHeight: 22,
    paddingHorizontal: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  degreeBadge: {
    minWidth: 38,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  pathActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  pathPrimaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 12,
  },

  pathSecondaryButton: {
    minHeight: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 15,
  },

  graphSectionHeader: {
    marginTop: 22,
    marginBottom: 12,
    gap: 10,
  },

  graphFilterContent: {
    gap: 7,
  },

  graphFilterButton: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  graphViewport: {
    position: "relative",
    borderWidth: 1,
    overflow: "hidden",
  },

  graphWorld: {
    position: "absolute",
    left: 0,
    top: 0,
  },

  graphNodeWrapper: {
    position: "absolute",
    alignItems: "center",
    zIndex: 10,
  },

  graphNodeShadow: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",

    ...Platform.select({
      ios: {
        shadowOffset: {
          width: 0,
          height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },

      android: {
        elevation: 6,
      },

      web: {
        boxShadow:
          "0 5px 12px rgba(0,0,0,0.14)",
      },
    }),
  },

  directIndicator: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedNodeRing: {
    position: "absolute",
    borderWidth: 2,
  },

  graphNodeLabel: {
    minWidth: 64,
    maxWidth: 100,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },

  graphInstruction: {
    position: "absolute",
    left: 10,
    top: 10,
    minHeight: 30,
    maxWidth: "72%",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  graphControls: {
    position: "absolute",
    right: 10,
    top: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",

    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },

      android: {
        elevation: 5,
      },

      web: {
        boxShadow:
          "0 3px 8px rgba(0,0,0,0.12)",
      },
    }),
  },

  graphControlButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  legend: {
    position: "absolute",
    left: 10,
    bottom: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },

  directSection: {
    marginTop: 24,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  connectionCount: {
    minWidth: 34,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  directConnectionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  connectionCard: {
    minHeight: 76,
    padding: 12,
    borderWidth: 1,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  connectionAvatarContainer: {
    position: "relative",
    width: 54,
    height: 54,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },

  connectionCompanyLogo: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  connectionInfo: {
    flex: 1,
    marginLeft: 11,
  },

  connectionNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  miniPartnerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  connectionMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },

  connectionArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  desktopLayout: {
    flex: 1,
    flexDirection: "row",
  },

  desktopMainColumn: {
    flex: 1,
  },

  desktopScrollContent: {
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    paddingBottom: 80,
  },

  desktopSideColumn: {
    width: 340,
    borderLeftWidth: 1,
    padding: 16,
  },

  mobileScrollContent: {
    paddingBottom: 120,
  },

  emptyDetails: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyDetailsIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  userDetailsCard: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
  },

  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  detailsIdentity: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailsIdentityText: {
    flex: 1,
    marginLeft: 14,
  },

  roleBadge: {
    alignSelf: "flex-start",
    marginTop: 7,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  connectionStatus: {
    marginTop: 16,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  detailsInformation: {
    marginTop: 16,
    gap: 13,
  },

  informationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  informationIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  informationText: {
    flex: 1,
    marginLeft: 11,
  },

  detailsPartnerRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  primaryDetailsButton: {
    minHeight: 46,
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  detailsActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 9,
  },

  secondaryDetailsButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      "rgba(0, 0, 0, 0.42)",
  },

  mobileDetailsSheet: {
    maxHeight: "88%",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
});