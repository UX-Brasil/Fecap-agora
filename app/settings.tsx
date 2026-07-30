import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/ThemeContext";

type SettingsRoute =
  | "/settings/notifications"
  | "/settings/privacy"
  | "/settings/support"
  | "/settings/terms";

type SettingsItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  route: SettingsRoute;
};

const SETTINGS_ITEMS: SettingsItem[] = [
  {
    icon: "notifications-outline",
    label: "Notificações push",
    description: "Controle alertas, novidades e recomendações",
    route: "/settings/notifications",
  },
  {
    icon: "lock-closed-outline",
    label: "Privacidade",
    description: "Defina quem pode visualizar suas informações",
    route: "/settings/privacy",
  },
  {
    icon: "help-circle-outline",
    label: "Ajuda e suporte",
    description: "Encontre respostas ou fale com o suporte",
    route: "/settings/support",
  },
  {
    icon: "document-text-outline",
    label: "Termos e política",
    description: "Leia os termos de uso e a política de privacidade",
    route: "/settings/terms",
  },
];

const WEB_MAX_WIDTH = 820;
const WEB_BREAKPOINT = 768;

export default function Settings() {
  const {
    colors,
    typography,
    radius,
    mode,
    setMode,
  } = useTheme();

  const router = useRouter();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width >= WEB_BREAKPOINT;
  const isDark = mode === "dark";

  const navigateTo = (route: SettingsRoute) => {
    router.push(route as never);
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
      testID="settings-screen"
    >
      <View
        style={[
          styles.page,
          {
            maxWidth: isDesktop
              ? WEB_MAX_WIDTH
              : undefined,
          },
        ]}
      >
        <SettingsHeader onBack={() => router.back()} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: isDesktop ? 24 : 14,
            },
          ]}
        >
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: colors.onSurfaceTertiary,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              APARÊNCIA
            </Text>

            <View
              style={[
                styles.appearanceCard,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: `${colors.brandPrimary}14`,
                  },
                ]}
              >
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={21}
                  color={colors.brandPrimary}
                />
              </View>

              <View style={styles.itemContent}>
                <Text
                  style={[
                    styles.itemTitle,
                    {
                      color: colors.onSurface,
                      fontWeight:
                        typography.weight.semibold,
                    },
                  ]}
                >
                  Modo escuro
                </Text>

                <Text
                  style={[
                    styles.itemDescription,
                    {
                      color:
                        colors.onSurfaceSecondary,
                    },
                  ]}
                >
                  {isDark
                    ? "O tema escuro está ativado"
                    : "O tema claro está ativado"}
                </Text>
              </View>

              <Switch
                value={isDark}
                onValueChange={(value) =>
                  setMode(value ? "dark" : "light")
                }
                trackColor={{
                  false: colors.border,
                  true: colors.brandPrimary,
                }}
                thumbColor={
                  Platform.OS === "android"
                    ? colors.surface
                    : undefined
                }
                testID="settings-dark-toggle"
                accessibilityLabel="Alternar modo escuro"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: colors.onSurfaceTertiary,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              PREFERÊNCIAS E SEGURANÇA
            </Text>

            <View style={styles.rowsContainer}>
              {SETTINGS_ITEMS.map((item) => (
                <SettingsRow
                  key={item.route}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  onPress={() => navigateTo(item.route)}
                />
              ))}
            </View>
          </View>

          <View
            style={[
              styles.appCard,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                borderRadius: radius.lg,
              },
            ]}
          >
            <View
              style={[
                styles.appIcon,
                {
                  backgroundColor: colors.brandPrimary,
                },
              ]}
            >
              <Ionicons
                name="people"
                size={22}
                color={colors.onBrandPrimary}
              />
            </View>

            <View style={styles.appInfo}>
              <Text
                style={[
                  styles.appName,
                  {
                    color: colors.onSurface,
                    fontWeight: typography.weight.bold,
                  },
                ]}
              >
                ASA Connect
              </Text>

              <Text
                style={[
                  styles.appVersion,
                  {
                    color: colors.onSurfaceTertiary,
                  },
                ]}
              >
                Versão 1.0.0
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.footerText,
              {
                color: colors.onSurfaceTertiary,
              },
            ]}
          >
            Desenvolvido para a comunidade FECAP
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SettingsHeader({
  onBack,
}: {
  onBack: () => void;
}) {
  const { colors, typography } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Pressable
        onPress={onBack}
        hitSlop={8}
        style={({ pressed }) => [
          styles.backButton,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        testID="settings-back-button"
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <Ionicons
          name="chevron-back"
          size={21}
          color={colors.onSurface}
        />
      </Pressable>

      <View style={styles.headerText}>
        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.heavy,
            },
          ]}
        >
          Configurações
        </Text>

        <Text
          style={[
            styles.headerSubtitle,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
        >
          Personalize sua experiência no ASA Connect
        </Text>
      </View>
    </View>
  );
}

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
};

function SettingsRow({
  icon,
  label,
  description,
  onPress,
}: SettingsRowProps) {
  const { colors, typography, radius } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg,
          opacity: pressed ? 0.75 : 1,
          transform: [
            {
              scale: pressed ? 0.995 : 1,
            },
          ],
        },
      ]}
      testID={`settings-row-${label}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={description}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${colors.brandPrimary}14`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={colors.brandPrimary}
        />
      </View>

      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemTitle,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.semibold,
            },
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.itemDescription,
            {
              color: colors.onSurfaceSecondary,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.onSurfaceTertiary}
      />
    </Pressable>
  );
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
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 14,
  },

  content: {
    paddingTop: 18,
    paddingBottom: 50,
  },

  section: {
    marginBottom: 22,
  },

  sectionLabel: {
    marginBottom: 9,
    marginLeft: 2,
    fontSize: 10,
    letterSpacing: 0.8,
  },

  appearanceCard: {
    minHeight: 76,
    padding: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  rowsContainer: {
    gap: 8,
  },

  row: {
    minHeight: 78,
    padding: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  itemContent: {
    flex: 1,
    minWidth: 0,
  },

  itemTitle: {
    fontSize: 14,
    lineHeight: 19,
  },

  itemDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
  },

  appCard: {
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  appIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  appInfo: {
    flex: 1,
  },

  appName: {
    fontSize: 14,
  },

  appVersion: {
    marginTop: 2,
    fontSize: 10,
  },

  footerText: {
    marginTop: 22,
    fontSize: 10,
    textAlign: "center",
  },
});