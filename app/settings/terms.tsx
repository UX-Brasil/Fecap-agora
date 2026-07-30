import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SettingsPageHeader } from "./notifications";

import { useTheme } from "@/src/theme/ThemeContext";

type DocumentType = "terms" | "privacy";

export default function TermsScreen() {
  const { colors, typography, radius } = useTheme();
  const router = useRouter();

  const [activeDocument, setActiveDocument] =
    React.useState<DocumentType>("terms");

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
        title="Termos e política"
        subtitle="Informações legais do Fecap Ágora"
        onBack={() => router.back()}
      />

      <View
        style={[
          styles.tabsContainer,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
            borderRadius: radius.pill,
          },
        ]}
      >
        <DocumentTab
          title="Termos de uso"
          active={activeDocument === "terms"}
          onPress={() => setActiveDocument("terms")}
        />

        <DocumentTab
          title="Privacidade"
          active={activeDocument === "privacy"}
          onPress={() =>
            setActiveDocument("privacy")
          }
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {activeDocument === "terms" ? (
          <TermsContent />
        ) : (
          <PrivacyContent />
        )}

        <View
          style={[
            styles.updatedCard,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              borderRadius: radius.lg,
            },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={colors.brandPrimary}
          />

          <Text
            style={[
              styles.updatedText,
              {
                color: colors.onSurfaceSecondary,
                fontWeight: typography.weight.medium,
              },
            ]}
          >
            Última atualização: 30 de julho de 2026
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentTab({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors, typography } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.documentTab,
        {
          backgroundColor: active
            ? colors.brandPrimary
            : "transparent",
        },
      ]}
    >
      <Text
        style={[
          styles.documentTabText,
          {
            color: active
              ? colors.onBrandPrimary
              : colors.onSurfaceSecondary,
            fontWeight: active
              ? typography.weight.bold
              : typography.weight.medium,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function TermsContent() {
  return (
    <>
      <LegalSection
        title="1. Aceitação dos termos"
        text="Ao utilizar o Fecap Ágora, você concorda com estes termos de uso e com as regras aplicáveis à plataforma."
      />

      <LegalSection
        title="2. Uso da plataforma"
        text="O Fecap Ágora deve ser utilizado para networking, oportunidades acadêmicas, vagas, mentorias, eventos e atividades relacionadas à comunidade FECAP."
      />

      <LegalSection
        title="3. Responsabilidade do usuário"
        text="O usuário é responsável pelas informações publicadas em seu perfil e deve garantir que os dados sejam verdadeiros, atualizados e adequados."
      />

      <LegalSection
        title="4. Condutas proibidas"
        text="Não é permitido publicar conteúdo ofensivo, fraudulento, discriminatório, ilegal ou que viole os direitos de outros usuários."
      />

      <LegalSection
        title="5. Disponibilidade"
        text="A plataforma pode passar por atualizações, manutenções e períodos de indisponibilidade necessários para melhoria dos serviços."
      />

      <LegalSection
        title="6. Alterações nos termos"
        text="Estes termos podem ser atualizados. Alterações relevantes serão comunicadas aos usuários por meio da plataforma."
      />
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <LegalSection
        title="1. Dados coletados"
        text="Podemos coletar informações de cadastro, dados acadêmicos, experiências profissionais, habilidades, interações e preferências."
      />

      <LegalSection
        title="2. Uso dos dados"
        text="Os dados são utilizados para funcionamento da plataforma, personalização de recomendações, segurança, suporte e melhoria dos serviços."
      />

      <LegalSection
        title="3. Compartilhamento"
        text="As informações somente serão compartilhadas conforme as configurações de privacidade do usuário, necessidades operacionais ou obrigações legais."
      />

      <LegalSection
        title="4. Segurança"
        text="Adotamos medidas técnicas e administrativas para proteger dados contra acessos não autorizados, perda ou uso indevido."
      />

      <LegalSection
        title="5. Direitos do usuário"
        text="O usuário pode solicitar acesso, correção, exclusão ou revisão de seus dados, conforme as regras e legislações aplicáveis."
      />

      <LegalSection
        title="6. Contato"
        text="Dúvidas relacionadas à privacidade podem ser encaminhadas à equipe responsável pelo Fecap Ágora."
      />
    </>
  );
}

function LegalSection({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.legalSection}>
      <Text
        style={[
          styles.legalTitle,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.bold,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.legalText,
          {
            color: colors.onSurfaceSecondary,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

import React from "react";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  tabsContainer: {
    width: "auto",
    maxWidth: 792,
    alignSelf: "center",
    marginTop: 14,
    marginHorizontal: 14,
    padding: 3,
    borderWidth: 1,
    flexDirection: "row",
  },

  documentTab: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  documentTabText: {
    fontSize: 11,
  },

  content: {
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    padding: 18,
    paddingBottom: 50,
  },

  legalSection: {
    marginBottom: 20,
  },

  legalTitle: {
    fontSize: 15,
    lineHeight: 21,
  },

  legalText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 20,
  },

  updatedCard: {
    marginTop: 10,
    padding: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  updatedText: {
    flex: 1,
    fontSize: 10,
  },
});