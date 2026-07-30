import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useTheme } from "@/src/theme/ThemeContext";

const WEB_NAVBAR_HEIGHT = 72;
const MOBILE_TABBAR_HEIGHT = 84;
const WEB_CONTENT_MAX_WIDTH = 1280;

type TabIconName =
  | "home"
  | "home-outline"
  | "flame"
  | "flame-outline"
  | "git-network"
  | "git-network-outline"
  | "sparkles"
  | "sparkles-outline"
  | "person"
  | "person-outline"
  | "game-controller"
  | "game-controller-outline";

const TAB_ICONS: Record<
  string,
  {
    focused: TabIconName;
    unfocused: TabIconName;
  }
> = {
  index: {
    focused: "home",
    unfocused: "home-outline",
  },

  match: {
    focused: "flame",
    unfocused: "flame-outline",
  },

  network: {
    focused: "git-network",
    unfocused: "git-network-outline",
  },

  assistant: {
    focused: "sparkles",
    unfocused: "sparkles-outline",
  },

  ranking: {
    focused: "game-controller",
    unfocused: "game-controller-outline",
  },

  profile: {
    focused: "person",
    unfocused: "person-outline",
  },
};

export default function TabsLayout() {
  const { colors, mode } = useTheme();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === "web";
  const isCompactWeb = isWeb && width < 900;

  return (
    <Tabs
      tabBar={
        isWeb
          ? (props) => <WebNavbar {...props} compact={isCompactWeb} />
          : undefined
      }
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,

        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.onSurfaceTertiary,

        sceneStyle: {
          backgroundColor: colors.surface,

          /*
           * Como a navbar web fica posicionada no topo,
           * reservamos espaço para ela não cobrir a tela.
           */
          paddingTop: isWeb ? WEB_NAVBAR_HEIGHT : 0,
        },

        tabBarStyle: isWeb
          ? {
              display: "none",
            }
          : {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,

              height: MOBILE_TABBAR_HEIGHT,
              paddingTop: 8,
              paddingBottom: 24,

              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,

              backgroundColor:
                Platform.OS === "android" ? colors.surface : "transparent",

              elevation: 0,

              shadowColor: "#000000",
              shadowOffset: {
                width: 0,
                height: -3,
              },
              shadowOpacity: mode === "dark" ? 0.2 : 0.06,
              shadowRadius: 10,
            },

        tabBarBackground: () => {
          if (isWeb) {
            return null;
          }

          if (Platform.OS === "ios") {
            return (
              <BlurView
                intensity={80}
                tint={mode === "dark" ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            );
          }

          return (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colors.surface,
                },
              ]}
            />
          );
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },

        tabBarItemStyle: {
          paddingTop: 2,
        },

        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),

          tabBarButtonTestID: "tab-home",
        }}
      />

      <Tabs.Screen
        name="match"
        options={{
          title: "Match",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "flame" : "flame-outline"}
              size={22}
              color={color}
            />
          ),

          tabBarButtonTestID: "tab-match",
        }}
      />

      <Tabs.Screen
        name="network"
        options={{
          title: "Rede",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "git-network" : "git-network-outline"}
              size={22}
              color={color}
            />
          ),

          tabBarButtonTestID: "tab-network",
        }}
      />

      <Tabs.Screen
        name="assistant"
        options={{
          title: "IA",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "sparkles" : "sparkles-outline"}
              size={22}
              color={color}
            />
          ),

          tabBarButtonTestID: "tab-assistant",
        }}
      />

      <Tabs.Screen
        name="ranking"
        options={{
          title: "Ranking",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "game-controller" : "game-controller-outline"}
              size={22}
              color={color}
            />
          ),

          tabBarButtonTestID: "tab-ranking",
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),

          tabBarButtonTestID: "tab-profile",
        }}
      />
    </Tabs>
  );
}

type WebNavbarProps = BottomTabBarProps & {
  compact: boolean;
};

function WebNavbar({
  state,
  descriptors,
  navigation,
  compact,
}: WebNavbarProps) {
  const { colors, mode, typography } = useTheme();

  return (
    <View
      style={[
        styles.webNavbar,
        {
          height: WEB_NAVBAR_HEIGHT,
          backgroundColor:
            mode === "dark" ? `${colors.surface}F5` : `${colors.surface}FA`,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.webNavbarContent,
          {
            maxWidth: WEB_CONTENT_MAX_WIDTH,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate("index")}
          style={({ pressed }) => [
            styles.brandContainer,
            {
              opacity: pressed ? 0.72 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ir para o início"
        >
          <View
            style={[
              styles.brandIcon,
              {
                backgroundColor: colors.brandPrimary,
              },
            ]}
          >
            <Ionicons name="people" size={21} color={colors.onBrandPrimary} />
          </View>

          {!compact ? (
            <View style={styles.brandTextContainer}>
              <Text
                numberOfLines={1}
                style={[
                  styles.brandTitle,
                  {
                    color: colors.onSurface,
                    fontWeight: typography.weight.heavy,
                  },
                ]}
              >
                Fecap Ágora
              </Text>

              <Text
                numberOfLines={1}
                style={[
                  styles.brandSubtitle,
                  {
                    color: colors.onSurfaceTertiary,
                  },
                ]}
              >
                Rede profissional FECAP
              </Text>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.webNavigation}>
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];

            const options = descriptor.options;

            const isFocused = state.index === index;

            const title =
              typeof options.title === "string" ? options.title : route.name;

            const icons = TAB_ICONS[route.name];

            const handlePress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const handleLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                onPress={handlePress}
                onLongPress={handleLongPress}
                accessibilityRole="link"
                accessibilityState={
                  isFocused
                    ? {
                        selected: true,
                      }
                    : {}
                }
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                style={({ hovered, pressed }) => [
                  styles.webNavItem,
                  compact && styles.webNavItemCompact,
                  {
                    backgroundColor: isFocused
                      ? `${colors.brandPrimary}12`
                      : hovered
                        ? colors.surfaceSecondary
                        : "transparent",

                    borderColor: isFocused
                      ? `${colors.brandPrimary}30`
                      : "transparent",

                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                {icons ? (
                  <Ionicons
                    name={isFocused ? icons.focused : icons.unfocused}
                    size={compact ? 19 : 20}
                    color={
                      isFocused ? colors.brandPrimary : colors.onSurfaceTertiary
                    }
                  />
                ) : null}

                {!compact ? (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.webNavLabel,
                      {
                        color: isFocused
                          ? colors.brandPrimary
                          : colors.onSurfaceSecondary,

                        fontWeight: isFocused
                          ? typography.weight.bold
                          : typography.weight.medium,
                      },
                    ]}
                  >
                    {title}
                  </Text>
                ) : null}

                {isFocused ? (
                  <View
                    style={[
                      styles.activeIndicator,
                      {
                        backgroundColor: colors.brandPrimary,
                      },
                    ]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {!compact ? (
          <View
            style={[
              styles.webStatus,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.webStatusDot,
                {
                  backgroundColor: colors.like,
                },
              ]}
            />

            <Text
              style={[
                styles.webStatusText,
                {
                  color: colors.onSurfaceSecondary,
                  fontWeight: typography.weight.semibold,
                },
              ]}
            >
              FECAP
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webNavbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,

    zIndex: 1000,

    borderBottomWidth: StyleSheet.hairlineWidth,

    ...Platform.select({
      web: {
        position: "fixed" as never,
        backdropFilter: "blur(18px)" as never,
      },
    }),

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },

  webNavbarContent: {
    width: "100%",
    height: "100%",

    alignSelf: "center",

    paddingHorizontal: 24,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    gap: 20,
  },

  brandContainer: {
    minWidth: 190,

    flexDirection: "row",
    alignItems: "center",

    gap: 11,
  },

  brandIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    flexShrink: 0,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  brandTextContainer: {
    minWidth: 0,
  },

  brandTitle: {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
  },

  brandSubtitle: {
    marginTop: 1,

    fontSize: 10,
    lineHeight: 14,
  },

  webNavigation: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 5,
  },

  webNavItem: {
    position: "relative",

    minWidth: 92,
    height: 44,

    paddingHorizontal: 14,

    borderRadius: 13,
    borderWidth: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,
  },

  webNavItemCompact: {
    minWidth: 48,
    width: 48,

    paddingHorizontal: 0,
  },

  webNavLabel: {
    fontSize: 12,
    lineHeight: 16,
  },

  activeIndicator: {
    position: "absolute",

    left: 13,
    right: 13,
    bottom: -14,

    height: 3,

    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  webStatus: {
    minWidth: 82,
    height: 36,

    paddingHorizontal: 12,

    borderRadius: 999,
    borderWidth: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,
  },

  webStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  webStatusText: {
    fontSize: 10,
  },
});
