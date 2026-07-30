import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SettingsPageHeader } from "./notifications";

import { useTheme } from "@/src/theme/ThemeContext";

type ProfileVisibility =
  | "public"
  | "connections"
  | "private";

export default function PrivacySettingsScreen() {
  const { colors, typography, radius } = useTheme();
  const router = useRouter();

  const [visibility, setVisibility] =
    useState<ProfileVisibility>("connections");

  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [allowMessages, setAllowMessages] =
    useState(true);
  const [showActivity, setShowActivity] =
    useState(true);
  const [allowRecommendations, setAllowRecommendations] =
    useState(true);

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
        title="Privacidade"
        subtitle="Controle seus dados e sua visibilidade"
        onBack={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.onSurfaceTertiary,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          VISIBILIDADE DO PERFIL
        </Text>

        <View
          style={[
            styles.optionsCard,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              borderRadius: radius.lg,
            },
          ]}
        >
          <PrivacyOption
            icon="globe-outline"
            title="Público"
            description="Qualquer usuário pode visualizar seu perfil"
            selected={visibility === "public"}
            onPress={() => setVisibility("public")}
          />

          <Divider />

          <PrivacyOption
            icon="people-outline"
            title="Apenas conexões"
            description="Somente suas conexões visualizam o perfil"
            selected={visibility === "connections"}
            onPress={() =>
              setVisibility("connections")
            }
          />

          <Divider />

          <PrivacyOption
            icon="lock-closed-outline"
            title="Privado"
            description="Somente você pode visualizar o perfil completo"
            selected={visibility === "private"}
            onPress={() => setVisibility("private")}
          />
        </View>

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.onSurfaceTertiary,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          INFORMAÇÕES PESSOAIS
        </Text>

        <PrivacySwitch
          icon="mail-outline"
          title="Mostrar e-mail"
          description="Exibir seu endereço de e-mail no perfil"
          value={showEmail}
          onValueChange={setShowEmail}
        />

        <PrivacySwitch
          icon="call-outline"
          title="Mostrar telefone"
          description="Exibir seu telefone para conexões"
          value={showPhone}
          onValueChange={setShowPhone}
        />

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.onSurfaceTertiary,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          INTERAÇÕES
        </Text>

        <PrivacySwitch
          icon="chatbubble-outline"
          title="Permitir mensagens"
          description="Permitir que usuários enviem mensagens"
          value={allowMessages}
          onValueChange={setAllowMessages}
        />

        <PrivacySwitch
          icon="pulse-outline"
          title="Mostrar atividade"
          description="Exibir suas interações e atividades recentes"
          value={showActivity}
          onValueChange={setShowActivity}
        />

        <PrivacySwitch
          icon="sparkles-outline"
          title="Recomendações personalizadas"
          description="Usar suas atividades para melhorar sugestões"
          value={allowRecommendations}
          onValueChange={setAllowRecommendations}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacyOption({
  icon,
  title,
  description,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, typography } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.icon,
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

      <View style={styles.optionContent}>
        <Text
          style={[
            styles.optionTitle,
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
            styles.optionDescription,
            {
              color: colors.onSurfaceSecondary,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      <Ionicons
        name={
          selected
            ? "radio-button-on"
            : "radio-button-off"
        }
        size={21}
        color={
          selected
            ? colors.brandPrimary
            : colors.onSurfaceTertiary
        }
      />
    </Pressable>
  );
}

function PrivacySwitch({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.switchRow,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View
        style={[
          styles.icon,
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

      <View style={styles.optionContent}>
        <Text
          style={[
            styles.optionTitle,
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
            styles.optionDescription,
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
        trackColor={{
          false: colors.border,
          true: colors.brandPrimary,
        }}
      />
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: colors.border,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    marginTop: 14,
    marginBottom: 1,
    marginLeft: 2,
    fontSize: 10,
    letterSpacing: 0.8,
  },

  optionsCard: {
    borderWidth: 1,
    overflow: "hidden",
  },

  option: {
    minHeight: 76,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  switchRow: {
    minHeight: 78,
    padding: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  icon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 13,
  },

  optionDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 67,
  },
});