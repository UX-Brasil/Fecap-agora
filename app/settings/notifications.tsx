import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/ThemeContext";

type NotificationSettings = {
  pushEnabled: boolean;
  jobs: boolean;
  connections: boolean;
  messages: boolean;
  events: boolean;
  recommendations: boolean;
  email: boolean;
};

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [settings, setSettings] =
    useState<NotificationSettings>({
      pushEnabled: true,
      jobs: true,
      connections: true,
      messages: true,
      events: true,
      recommendations: false,
      email: false,
    });

  const updateSetting = (
    key: keyof NotificationSettings,
    value: boolean,
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const dependentDisabled = !settings.pushEnabled;

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: colors.surface,
        },
      ]}
      edges={["top"]}
    >
      <SettingsPageHeader
        title="Notificações"
        subtitle="Escolha quais alertas deseja receber"
        onBack={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <SettingsSwitchRow
          icon="notifications"
          title="Notificações push"
          description="Permitir alertas no seu dispositivo"
          value={settings.pushEnabled}
          onValueChange={(value) =>
            updateSetting("pushEnabled", value)
          }
          highlighted
        />

        <SectionTitle title="TIPOS DE NOTIFICAÇÃO" />

        <SettingsSwitchRow
          icon="briefcase-outline"
          title="Vagas recomendadas"
          description="Novas vagas compatíveis com seu perfil"
          value={settings.jobs}
          onValueChange={(value) =>
            updateSetting("jobs", value)
          }
          disabled={dependentDisabled}
        />

        <SettingsSwitchRow
          icon="people-outline"
          title="Conexões"
          description="Novos pedidos e conexões aceitas"
          value={settings.connections}
          onValueChange={(value) =>
            updateSetting("connections", value)
          }
          disabled={dependentDisabled}
        />

        <SettingsSwitchRow
          icon="chatbubble-outline"
          title="Mensagens"
          description="Novas mensagens e introduções"
          value={settings.messages}
          onValueChange={(value) =>
            updateSetting("messages", value)
          }
          disabled={dependentDisabled}
        />

        <SettingsSwitchRow
          icon="calendar-outline"
          title="Eventos"
          description="Lembretes de eventos e hackathons"
          value={settings.events}
          onValueChange={(value) =>
            updateSetting("events", value)
          }
          disabled={dependentDisabled}
        />

        <SettingsSwitchRow
          icon="sparkles-outline"
          title="Recomendações"
          description="Sugestões personalizadas do ASA"
          value={settings.recommendations}
          onValueChange={(value) =>
            updateSetting("recommendations", value)
          }
          disabled={dependentDisabled}
        />

        <SectionTitle title="OUTROS CANAIS" />

        <SettingsSwitchRow
          icon="mail-outline"
          title="Notificações por e-mail"
          description="Receber um resumo de novidades por e-mail"
          value={settings.email}
          onValueChange={(value) =>
            updateSetting("email", value)
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { colors, typography } = useTheme();

  return (
    <Text
      style={[
        styles.sectionTitle,
        {
          color: colors.onSurfaceTertiary,
          fontWeight: typography.weight.bold,
        },
      ]}
    >
      {title}
    </Text>
  );
}

type SettingsSwitchRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  highlighted?: boolean;
};

function SettingsSwitchRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  highlighted = false,
}: SettingsSwitchRowProps) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.switchRow,
        {
          backgroundColor: highlighted
            ? `${colors.brandPrimary}08`
            : colors.surfaceSecondary,
          borderColor: highlighted
            ? `${colors.brandPrimary}35`
            : colors.border,
          borderRadius: radius.lg,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: `${colors.brandPrimary}14`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={colors.brandPrimary}
        />
      </View>

      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowTitle,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.semibold,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.rowDescription,
            {
              color: colors.onSurfaceSecondary,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: colors.border,
          true: colors.brandPrimary,
        }}
        thumbColor={
          Platform.OS === "android"
            ? colors.surface
            : undefined
        }
      />
    </View>
  );
}

export function SettingsPageHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
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
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              styles.headerSubtitle,
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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  },

  headerSubtitle: {
    marginTop: 1,
    fontSize: 10,
  },

  content: {
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    padding: 14,
    paddingBottom: 50,
    gap: 8,
  },

  sectionTitle: {
    marginTop: 16,
    marginBottom: 1,
    marginLeft: 2,
    fontSize: 10,
    letterSpacing: 0.8,
  },

  switchRow: {
    minHeight: 78,
    padding: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  rowIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  rowContent: {
    flex: 1,
  },

  rowTitle: {
    fontSize: 13,
  },

  rowDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
  },
});