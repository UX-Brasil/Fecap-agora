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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/ThemeContext";

const WEB_NAVBAR_HEIGHT = 72;
const MOBILE_TABBAR_HEIGHT = 76;
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
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === "web";
  const isCompactWeb = isWeb && width < 1080;
  const usesBottomAppBar = !isWeb || isCompactWeb;

  return (
    <Tabs
      tabBar={(props) =>
        usesBottomAppBar ? (
          <MobileAppTabBar {...props} />
        ) : (
          <WebNavbar {...props} />
        )
      }
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,

        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.onSurfaceTertiary,

        sceneStyle: {
          backgroundColor: colors.surface,

          paddingTop: isWeb && !usesBottomAppBar ? WEB_NAVBAR_HEIGHT : 0,
          paddingBottom: usesBottomAppBar ? MOBILE_TABBAR_HEIGHT + 24 : 0,
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

function MobileAppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, mode, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.mobileTabBarWrap,
        {
          paddingBottom: bottomInset,
        },
      ]}
    >
      <View
        style={[
          styles.mobileTabBar,
          {
            backgroundColor:
              Platform.OS === "ios" || Platform.OS === "web"
                ? mode === "dark"
                  ? `${colors.surfaceSecondary}D9`
                  : `${colors.surfaceSecondary}F0`
                : colors.surfaceSecondary,
            borderColor: colors.border,
            shadowOpacity: mode === "dark" ? 0.28 : 0.1,
          },
        ]}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={70}
            tint={mode === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : null}

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
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? title}
              testID={options.tabBarButtonTestID}
              style={({ pressed }) => [
                styles.mobileTabItem,
                isFocused && styles.mobileTabItemActive,
                {
                  backgroundColor: isFocused
                    ? `${colors.brandPrimary}18`
                    : "transparent",
                  opacity: pressed ? 0.68 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.mobileIconBubble,
                  {
                    backgroundColor: isFocused
                      ? colors.brandPrimary
                      : colors.surfaceTertiary,
                  },
                ]}
              >
                {icons ? (
                  <Ionicons
                    name={isFocused ? icons.focused : icons.unfocused}
                    size={20}
                    color={
                      isFocused ? colors.onBrandPrimary : colors.onSurfaceTertiary
                    }
                  />
                ) : null}
              </View>

              {isFocused ? (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.mobileTabLabel,
                    {
                      color: colors.brandPrimary,
                      fontWeight: typography.weight.bold,
                    },
                  ]}
                >
                  {title}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WebNavbar({ state, descriptors, navigation }: BottomTabBarProps) {
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
                  {
                    backgroundColor: isFocused
                      ? `${colors.brandPrimary}16`
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
                  <View
                    style={[
                      styles.webIconBubble,
                      {
                        backgroundColor: isFocused
                          ? colors.brandPrimary
                          : colors.surfaceTertiary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isFocused ? icons.focused : icons.unfocused}
                      size={18}
                      color={
                        isFocused
                          ? colors.onBrandPrimary
                          : colors.onSurfaceTertiary
                      }
                    />
                  </View>
                ) : null}

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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileTabBarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    zIndex: 1000,

    paddingHorizontal: 14,
    paddingTop: 10,

    ...Platform.select({
      web: {
        position: "fixed" as never,
      },
    }),
  },

  mobileTabBar: {
    width: "100%",
    maxWidth: 520,
    height: MOBILE_TABBAR_HEIGHT,

    alignSelf: "center",
    overflow: "hidden",

    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,

    paddingHorizontal: 8,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 24,
    elevation: 10,

    ...Platform.select({
      web: {
        backdropFilter: "blur(18px)" as never,
      },
    }),
  },

  mobileTabItem: {
    height: 54,
    minWidth: 48,

    borderRadius: 22,

    paddingHorizontal: 8,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,
  },

  mobileTabItemActive: {
    flexGrow: 1,
    maxWidth: 118,
  },

  mobileIconBubble: {
    width: 36,
    height: 36,

    borderRadius: 18,

    alignItems: "center",
    justifyContent: "center",
  },

  mobileTabLabel: {
    maxWidth: 62,

    fontSize: 11,
    lineHeight: 14,
  },

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

    gap: 8,
  },

  webNavItem: {
    position: "relative",

    minWidth: 102,
    height: 50,

    paddingHorizontal: 10,

    borderRadius: 20,
    borderWidth: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,
  },

  webNavLabel: {
    fontSize: 12,
    lineHeight: 16,
  },

  webIconBubble: {
    width: 32,
    height: 32,

    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",
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
