import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SettingsPageHeader } from "./notifications";

import { useTheme } from "@/src/theme/ThemeContext";

const FAQ_ITEMS = [
  {
    id: "faq-1",
    question: "Como editar meu perfil?",
    answer:
      "Acesse a aba Perfil e toque em Editar perfil. Depois, atualize seus dados e salve as alterações.",
  },
  {
    id: "faq-2",
    question: "Como funcionam os matches de vagas?",
    answer:
      "O ASA compara suas habilidades, experiências e interesses com os requisitos das vagas disponíveis.",
  },
  {
    id: "faq-3",
    question: "Como adicionar uma conexão?",
    answer:
      "Acesse o perfil da pessoa e toque em Conectar. Ela receberá uma solicitação para aceitar.",
  },
  {
    id: "faq-4",
    question: "Como participar de eventos?",
    answer:
      "Abra a área de eventos, selecione o evento desejado e toque no botão de inscrição.",
  },
];

export default function SupportScreen() {
  const { colors, typography, radius } = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] =
    useState<string | null>(null);

  const filteredFaq = FAQ_ITEMS.filter((item) =>
    item.question
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const openEmailSupport = async () => {
    const subject = encodeURIComponent(
      "Suporte ASA Connect",
    );

    const body = encodeURIComponent(
      "Olá, preciso de ajuda com o ASA Connect.\n\nDescrição do problema:\n",
    );

    await Linking.openURL(
      `mailto:suporte@asaconnect.com.br?subject=${subject}&body=${body}`,
    );
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
    >
      <SettingsPageHeader
        title="Ajuda e suporte"
        subtitle="Encontre respostas ou fale com nossa equipe"
        onBack={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              borderRadius: radius.lg,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={19}
            color={colors.onSurfaceTertiary}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar uma dúvida..."
            placeholderTextColor={
              colors.onSurfaceTertiary
            }
            style={[
              styles.searchInput,
              {
                color: colors.onSurface,
              },
            ]}
          />

          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.onSurfaceTertiary}
              />
            </Pressable>
          ) : null}
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
          PERGUNTAS FREQUENTES
        </Text>

        <View style={styles.faqList}>
          {filteredFaq.map((item) => {
            const isOpen = openFaq === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() =>
                  setOpenFaq(isOpen ? null : item.id)
                }
                style={[
                  styles.faqCard,
                  {
                    backgroundColor:
                      colors.surfaceSecondary,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                  },
                ]}
              >
                <View style={styles.faqHeader}>
                  <Text
                    style={[
                      styles.faqQuestion,
                      {
                        color: colors.onSurface,
                        fontWeight:
                          typography.weight.semibold,
                      },
                    ]}
                  >
                    {item.question}
                  </Text>

                  <Ionicons
                    name={
                      isOpen
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={18}
                    color={colors.onSurfaceTertiary}
                  />
                </View>

                {isOpen ? (
                  <Text
                    style={[
                      styles.faqAnswer,
                      {
                        color:
                          colors.onSurfaceSecondary,
                      },
                    ]}
                  >
                    {item.answer}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {filteredFaq.length === 0 ? (
          <View style={styles.emptySearch}>
            <Ionicons
              name="search-outline"
              size={28}
              color={colors.onSurfaceTertiary}
            />

            <Text
              style={[
                styles.emptySearchText,
                {
                  color: colors.onSurfaceSecondary,
                },
              ]}
            >
              Nenhuma dúvida encontrada.
            </Text>
          </View>
        ) : null}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.onSurfaceTertiary,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          FALE COM O SUPORTE
        </Text>

        <Pressable
          onPress={openEmailSupport}
          style={({ pressed }) => [
            styles.supportCard,
            {
              backgroundColor: colors.brandPrimary,
              borderRadius: radius.lg,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.supportIcon,
              {
                backgroundColor:
                  "rgba(255,255,255,0.16)",
              },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={22}
              color={colors.onBrandPrimary}
            />
          </View>

          <View style={styles.supportContent}>
            <Text
              style={[
                styles.supportTitle,
                {
                  color: colors.onBrandPrimary,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              Enviar e-mail para o suporte
            </Text>

            <Text
              style={[
                styles.supportDescription,
                {
                  color: colors.onBrandPrimary,
                },
              ]}
            >
              Nossa equipe responderá sua solicitação.
            </Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={19}
            color={colors.onBrandPrimary}
          />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
  },

  searchContainer: {
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 9,
    marginLeft: 2,
    fontSize: 10,
    letterSpacing: 0.8,
  },

  faqList: {
    gap: 8,
  },

  faqCard: {
    padding: 14,
    borderWidth: 1,
  },

  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  faqQuestion: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  faqAnswer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    fontSize: 11,
    lineHeight: 18,
  },

  emptySearch: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  emptySearchText: {
    fontSize: 11,
  },

  supportCard: {
    minHeight: 82,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  supportIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  supportContent: {
    flex: 1,
  },

  supportTitle: {
    fontSize: 13,
  },

  supportDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
    opacity: 0.82,
  },
});