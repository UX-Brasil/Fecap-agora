import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  STARTER_PROMPTS,
  respond,
} from "@/src/services/ai";
import { useTheme } from "@/src/theme/ThemeContext";
import type { ChatMessage } from "@/src/types";

type FormattedBlock =
  | {
      id: string;
      type: "paragraph";
      content: string;
    }
  | {
      id: string;
      type: "title";
      content: string;
    }
  | {
      id: string;
      type: "bullet";
      content: string;
    }
  | {
      id: string;
      type: "numbered";
      content: string;
      number: string;
    };

const CONTENT_MAX_WIDTH = 920;
const DESKTOP_BREAKPOINT = 768;

export default function Assistant() {
  const { width } = useWindowDimensions();
  const { colors, radius, typography } = useTheme();

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m0",
      role: "assistant",
      content:
        "Olá! Sou o Assistente ASA.\n\nPosso ajudar você a encontrar empresas, vagas, hackathons, mentorias e conexões da sua rede.",
      createdAt: new Date().toISOString(),
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const canSend = input.trim().length > 0 && !isTyping;

  const scrollToEnd = useCallback(
    (animated = true) => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({
          animated,
        });
      });
    },
    [],
  );

  const send = useCallback(
    (text: string) => {
      const trimmedText = cleanUserInput(text);

      if (!trimmedText || isTyping) {
        return;
      }

      const now = Date.now();

      const userMessage: ChatMessage = {
        id: `user_${now}`,
        role: "user",
        content: trimmedText,
        createdAt: new Date(now).toISOString(),
      };

      setMessages((current) => [
        ...current,
        userMessage,
      ]);

      setInput("");
      setIsTyping(true);

      scrollToEnd();

      setTimeout(() => {
        try {
          const rawAnswer = respond(trimmedText);

          const assistantMessage: ChatMessage = {
            id: `assistant_${now + 1}`,
            role: "assistant",
            content: normalizeAssistantText(
              String(rawAnswer ?? ""),
            ),
            createdAt: new Date().toISOString(),
          };

          setMessages((current) => [
            ...current,
            assistantMessage,
          ]);
        } catch {
          const errorMessage: ChatMessage = {
            id: `assistant_error_${now + 1}`,
            role: "assistant",
            content:
              "Não consegui processar sua pergunta agora. Tente novamente em alguns instantes.",
            createdAt: new Date().toISOString(),
          };

          setMessages((current) => [
            ...current,
            errorMessage,
          ]);
        } finally {
          setIsTyping(false);

          setTimeout(() => {
            scrollToEnd();
          }, 50);
        }
      }, 500);
    },
    [isTyping, scrollToEnd],
  );

  const handleSubmit = useCallback(() => {
    if (!canSend) {
      return;
    }

    send(input);
  }, [canSend, input, send]);

  const handlePromptPress = useCallback(
    (prompt: string) => {
      send(prompt);
    },
    [send],
  );

  const showStarterPrompts =
    messages.length === 1 && !isTyping;

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor: colors.surface,
        },
      ]}
      edges={["top"]}
      testID="assistant-screen"
    >
      <View
        style={[
          styles.page,
          {
            maxWidth: CONTENT_MAX_WIDTH,
          },
        ]}
      >
        <AssistantHeader />

        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : Platform.OS === "android"
                ? "height"
                : undefined
          }
          style={styles.keyboardView}
          keyboardVerticalOffset={
            Platform.OS === "ios" ? 90 : 0
          }
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(message) => message.id}
            style={styles.messageList}
            contentContainerStyle={[
              styles.messageListContent,
              {
                paddingHorizontal: isDesktop
                  ? 24
                  : 14,
              },
            ]}
            renderItem={({ item }) => (
              <Bubble message={item} />
            )}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios"
                ? "interactive"
                : "on-drag"
            }
            onContentSizeChange={() =>
              scrollToEnd(false)
            }
            ListFooterComponent={
              <View>
                {showStarterPrompts ? (
                  <StarterPrompts
                    onPromptPress={handlePromptPress}
                    disabled={isTyping}
                  />
                ) : null}

                {isTyping ? <TypingIndicator /> : null}
              </View>
            }
          />

          <View
            style={[
              styles.composerContainer,
              {
                paddingHorizontal: isDesktop
                  ? 24
                  : 14,
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor:
                    colors.surfaceSecondary,
                  borderColor: colors.border,
                  borderRadius: radius.xl ?? 24,
                },
              ]}
            >
              <View style={styles.inputContent}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Pergunte sobre vagas, empresas ou conexões..."
                  placeholderTextColor={
                    colors.onSurfaceTertiary
                  }
                  style={[
                    styles.input,
                    {
                      color: colors.onSurface,
                    },
                  ]}
                  multiline
                  maxLength={1200}
                  editable={!isTyping}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    if (
                      Platform.OS !== "web" &&
                      canSend
                    ) {
                      handleSubmit();
                    }
                  }}
                  testID="assistant-input"
                  accessibilityLabel="Digite sua pergunta"
                />

                <Text
                  style={[
                    styles.characterCounter,
                    {
                      color:
                        input.length > 1100
                          ? colors.pass
                          : colors.onSurfaceTertiary,
                    },
                  ]}
                >
                  {input.length}/1200
                </Text>
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={!canSend}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.sendButton,
                  {
                    backgroundColor: canSend
                      ? colors.brandPrimary
                      : colors.border,
                    opacity: pressed && canSend ? 0.75 : 1,
                    transform: [
                      {
                        scale:
                          pressed && canSend ? 0.92 : 1,
                      },
                    ],
                  },
                ]}
                testID="assistant-send-button"
                accessibilityRole="button"
                accessibilityLabel="Enviar mensagem"
                accessibilityState={{
                  disabled: !canSend,
                }}
              >
                <Ionicons
                  name={
                    isTyping
                      ? "ellipsis-horizontal"
                      : "send"
                  }
                  size={17}
                  color={
                    canSend
                      ? colors.onBrandPrimary
                      : colors.onSurfaceTertiary
                  }
                />
              </Pressable>
            </View>

            <Text
              style={[
                styles.disclaimer,
                {
                  color: colors.onSurfaceTertiary,
                },
              ]}
            >
              O Assistente ASA pode cometer erros. Confira
              informações importantes antes de tomar uma
              decisão.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

function AssistantHeader() {
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
      <View style={styles.headerIdentity}>
        <LinearGradient
          colors={[
            colors.brand,
            colors.brandPrimary,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={styles.headerIcon}
        >
          <Ionicons
            name="sparkles"
            size={21}
            color={colors.onBrandPrimary}
          />
        </LinearGradient>

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
            Assistente ASA
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: colors.like,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: colors.onSurfaceTertiary,
                  fontWeight:
                    typography.weight.semibold,
                },
              ]}
            >
              Online e pronto para ajudar
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.aiLabel,
          {
            backgroundColor: `${colors.brandPrimary}12`,
          },
        ]}
      >
        <Ionicons
          name="hardware-chip-outline"
          size={14}
          color={colors.brandPrimary}
        />

        <Text
          style={[
            styles.aiLabelText,
            {
              color: colors.brandPrimary,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          IA
        </Text>
      </View>
    </View>
  );
}

function Bubble({
  message,
}: {
  message: ChatMessage;
}) {
  const { colors, typography, radius } = useTheme();

  const isUser = message.role === "user";

  const formattedBlocks = useMemo(
    () =>
      isUser
        ? []
        : parseAssistantContent(message.content),
    [isUser, message.content],
  );

  return (
    <View
      style={[
        styles.messageWrapper,
        {
          alignItems: isUser
            ? "flex-end"
            : "flex-start",
        },
      ]}
    >
      {!isUser ? (
        <View style={styles.assistantLabelRow}>
          <View
            style={[
              styles.assistantAvatar,
              {
                backgroundColor: `${colors.brandPrimary}16`,
              },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={13}
              color={colors.brandPrimary}
            />
          </View>

          <Text
            style={[
              styles.assistantName,
              {
                color: colors.onSurfaceTertiary,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            Assistente ASA
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.bubble,
          {
            maxWidth: isUser ? "82%" : "92%",
            borderRadius: radius.lg ?? 18,
            borderTopRightRadius: isUser
              ? 5
              : radius.lg ?? 18,
            borderTopLeftRadius: isUser
              ? radius.lg ?? 18
              : 5,
            backgroundColor: isUser
              ? colors.brandPrimary
              : colors.surfaceSecondary,
            borderColor: isUser
              ? colors.brandPrimary
              : colors.border,
          },
        ]}
        testID={`chat-bubble-${message.role}`}
      >
        {isUser ? (
          <Text
            style={[
              styles.userMessage,
              {
                color: colors.onBrandPrimary,
                fontWeight: typography.weight.medium,
              },
            ]}
          >
            {message.content}
          </Text>
        ) : (
          <FormattedAssistantMessage
            blocks={formattedBlocks}
          />
        )}

        <Text
          style={[
            styles.messageTime,
            {
              color: isUser
                ? "rgba(255,255,255,0.68)"
                : colors.onSurfaceTertiary,
              textAlign: isUser ? "right" : "left",
            },
          ]}
        >
          {formatMessageTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

function FormattedAssistantMessage({
  blocks,
}: {
  blocks: FormattedBlock[];
}) {
  const { colors, typography } = useTheme();

  if (blocks.length === 0) {
    return (
      <Text
        style={[
          styles.assistantParagraph,
          {
            color: colors.onSurfaceSecondary,
          },
        ]}
      >
        Não encontrei uma resposta para essa pergunta.
      </Text>
    );
  }

  return (
    <View style={styles.formattedContent}>
      {blocks.map((block, index) => {
        const isFirst = index === 0;

        if (block.type === "title") {
          return (
            <Text
              key={block.id}
              style={[
                styles.assistantTitle,
                {
                  color: colors.onSurface,
                  fontWeight: typography.weight.bold,
                  marginTop: isFirst ? 0 : 10,
                },
              ]}
            >
              {block.content}
            </Text>
          );
        }

        if (block.type === "bullet") {
          return (
            <View
              key={block.id}
              style={styles.listItem}
            >
              <View
                style={[
                  styles.bulletDot,
                  {
                    backgroundColor:
                      colors.brandPrimary,
                  },
                ]}
              />

              <Text
                style={[
                  styles.listItemText,
                  {
                    color: colors.onSurfaceSecondary,
                  },
                ]}
              >
                {block.content}
              </Text>
            </View>
          );
        }

        if (block.type === "numbered") {
          return (
            <View
              key={block.id}
              style={styles.listItem}
            >
              <View
                style={[
                  styles.numberBadge,
                  {
                    backgroundColor: `${colors.brandPrimary}16`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.numberBadgeText,
                    {
                      color: colors.brandPrimary,
                      fontWeight:
                        typography.weight.bold,
                    },
                  ]}
                >
                  {block.number}
                </Text>
              </View>

              <Text
                style={[
                  styles.listItemText,
                  {
                    color: colors.onSurfaceSecondary,
                  },
                ]}
              >
                {block.content}
              </Text>
            </View>
          );
        }

        return (
          <Text
            key={block.id}
            style={[
              styles.assistantParagraph,
              {
                color: colors.onSurfaceSecondary,
                marginTop: isFirst ? 0 : 7,
              },
            ]}
          >
            {block.content}
          </Text>
        );
      })}
    </View>
  );
}

function StarterPrompts({
  onPromptPress,
  disabled,
}: {
  onPromptPress: (prompt: string) => void;
  disabled: boolean;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={styles.promptsContainer}
      testID="assistant-prompts"
    >
      <View style={styles.promptsHeader}>
        <View
          style={[
            styles.promptsHeaderIcon,
            {
              backgroundColor: `${colors.brandPrimary}14`,
            },
          ]}
        >
          <Ionicons
            name="bulb-outline"
            size={16}
            color={colors.brandPrimary}
          />
        </View>

        <View style={styles.promptsHeaderText}>
          <Text
            style={[
              styles.promptsTitle,
              {
                color: colors.onSurface,
                fontWeight: typography.weight.bold,
              },
            ]}
          >
            Sugestões para começar
          </Text>

          <Text
            style={[
              styles.promptsSubtitle,
              {
                color: colors.onSurfaceTertiary,
              },
            ]}
          >
            Selecione uma pergunta ou escreva a sua.
          </Text>
        </View>
      </View>

      <View style={styles.promptsGrid}>
        {STARTER_PROMPTS.map((prompt, index) => (
          <Pressable
            key={`${prompt}-${index}`}
            onPress={() => onPromptPress(prompt)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.promptCard,
              {
                backgroundColor:
                  colors.surfaceSecondary,
                borderColor: colors.border,
                borderRadius: radius.md,
                opacity: disabled
                  ? 0.45
                  : pressed
                    ? 0.72
                    : 1,
                transform: [
                  {
                    scale:
                      pressed && !disabled
                        ? 0.985
                        : 1,
                  },
                ],
              },
            ]}
            testID={`assistant-prompt-${index}`}
            accessibilityRole="button"
            accessibilityLabel={prompt}
          >
            <View
              style={[
                styles.promptIcon,
                {
                  backgroundColor: `${colors.brandPrimary}12`,
                },
              ]}
            >
              <Ionicons
                name={getPromptIcon(index)}
                size={16}
                color={colors.brandPrimary}
              />
            </View>

            <Text
              style={[
                styles.promptText,
                {
                  color: colors.onSurface,
                  fontWeight:
                    typography.weight.medium,
                },
              ]}
            >
              {cleanInlineMarkdown(prompt)}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={15}
              color={colors.onSurfaceTertiary}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TypingIndicator() {
  const { colors, typography, radius } = useTheme();

  return (
    <View style={styles.typingWrapper}>
      <View style={styles.assistantLabelRow}>
        <View
          style={[
            styles.assistantAvatar,
            {
              backgroundColor: `${colors.brandPrimary}16`,
            },
          ]}
        >
          <Ionicons
            name="sparkles"
            size={13}
            color={colors.brandPrimary}
          />
        </View>

        <Text
          style={[
            styles.assistantName,
            {
              color: colors.onSurfaceTertiary,
              fontWeight: typography.weight.semibold,
            },
          ]}
        >
          Assistente ASA
        </Text>
      </View>

      <View
        style={[
          styles.typingBubble,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
            borderRadius: radius.lg ?? 18,
          },
        ]}
      >
        <View style={styles.typingDots}>
          <View
            style={[
              styles.typingDot,
              {
                backgroundColor:
                  colors.onSurfaceTertiary,
              },
            ]}
          />

          <View
            style={[
              styles.typingDot,
              {
                backgroundColor:
                  colors.onSurfaceTertiary,
              },
            ]}
          />

          <View
            style={[
              styles.typingDot,
              {
                backgroundColor:
                  colors.onSurfaceTertiary,
              },
            ]}
          />
        </View>

        <Text
          style={[
            styles.typingText,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
        >
          Organizando a resposta...
        </Text>
      </View>
    </View>
  );
}

function parseAssistantContent(
  content: string,
): FormattedBlock[] {
  const normalized = normalizeAssistantText(content);

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const numberedMatch = line.match(
      /^(\d+)[.)]\s+(.+)$/,
    );

    if (numberedMatch) {
      return {
        id: `numbered-${index}`,
        type: "numbered",
        number: numberedMatch[1],
        content: cleanInlineMarkdown(
          numberedMatch[2],
        ),
      };
    }

    const bulletMatch = line.match(
      /^(?:[-*•▪◦‣])\s+(.+)$/,
    );

    if (bulletMatch) {
      return {
        id: `bullet-${index}`,
        type: "bullet",
        content: cleanInlineMarkdown(
          bulletMatch[1],
        ),
      };
    }

    const isTitle =
      line.endsWith(":") &&
      line.length <= 70 &&
      !line.includes("http");

    if (isTitle) {
      return {
        id: `title-${index}`,
        type: "title",
        content: cleanInlineMarkdown(
          line.replace(/:$/, ""),
        ),
      };
    }

    return {
      id: `paragraph-${index}`,
      type: "paragraph",
      content: cleanInlineMarkdown(line),
    };
  });
}

function normalizeAssistantText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/â€™/g, "’")
    .replace(/â€˜/g, "‘")
    .replace(/â€œ/g, "“")
    .replace(/â€�/g, "”")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "—")
    .replace(/â€¦/g, "…")
    .replace(/Âº/g, "º")
    .replace(/Âª/g, "ª")
    .replace(/Â/g, "")
    .replace(/ðŸ¤–/g, "🤖")
    .replace(/ðŸš€/g, "🚀")
    .replace(/ðŸ’¡/g, "💡")
    .replace(/ðŸ“Œ/g, "📌")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanInlineMarkdown(text: string) {
  return text
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/^#+\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanUserInput(text: string) {
  return text
    .replace(/\s+/g, " ")
    .trim();
}

function formatMessageTime(date?: string) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPromptIcon(
  index: number,
): keyof typeof Ionicons.glyphMap {
  const icons: Array<
    keyof typeof Ionicons.glyphMap
  > = [
    "briefcase-outline",
    "business-outline",
    "people-outline",
    "school-outline",
    "rocket-outline",
    "search-outline",
  ];

  return icons[index % icons.length];
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

  keyboardView: {
    flex: 1,
  },

  header: {
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.35,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 10,
    lineHeight: 14,
  },

  aiLabel: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  aiLabelText: {
    fontSize: 10,
  },

  messageList: {
    flex: 1,
  },

  messageListContent: {
    flexGrow: 1,
    paddingTop: 18,
    paddingBottom: 16,
  },

  messageWrapper: {
    width: "100%",
    marginBottom: 14,
  },

  assistantLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    marginLeft: 2,
  },

  assistantAvatar: {
    width: 25,
    height: 25,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  assistantName: {
    fontSize: 9,
    lineHeight: 13,
  },

  bubble: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 9,
    borderWidth: 1,
  },

  userMessage: {
    fontSize: 14,
    lineHeight: 21,
  },

  formattedContent: {
    width: "100%",
  },

  assistantTitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 5,
    letterSpacing: -0.1,
  },

  assistantParagraph: {
    fontSize: 13,
    lineHeight: 21,
  },

  listItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 7,
  },

  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },

  numberBadge: {
    minWidth: 23,
    height: 23,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  numberBadgeText: {
    fontSize: 10,
  },

  listItemText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  messageTime: {
    fontSize: 8,
    lineHeight: 11,
    marginTop: 7,
  },

  promptsContainer: {
    width: "100%",
    marginTop: 5,
    paddingBottom: 12,
  },

  promptsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 11,
  },

  promptsHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  promptsHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  promptsTitle: {
    fontSize: 12,
    lineHeight: 17,
  },

  promptsSubtitle: {
    fontSize: 9,
    lineHeight: 14,
    marginTop: 1,
  },

  promptsGrid: {
    width: "100%",
    gap: 8,
  },

  promptCard: {
    width: "100%",
    minHeight: 54,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  promptIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  promptText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },

  typingWrapper: {
    width: "100%",
    alignItems: "flex-start",
    marginTop: 2,
    marginBottom: 12,
  },

  typingBubble: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderTopLeftRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  typingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  typingText: {
    fontSize: 10,
    lineHeight: 14,
  },

  composerContainer: {
    paddingTop: 10,
    paddingBottom:
      Platform.OS === "web" ? 18 : 104,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  inputRow: {
    width: "100%",
    minHeight: 54,
    padding: 4,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },

  inputContent: {
    flex: 1,
    minWidth: 0,
  },

  input: {
    width: "100%",
    minHeight: 42,
    maxHeight: 120,
    paddingHorizontal: 13,
    paddingTop: 11,
    paddingBottom: 16,
    fontSize: 13,
    lineHeight: 19,
    textAlignVertical: "top",
  },

  characterCounter: {
    position: "absolute",
    right: 8,
    bottom: 3,
    fontSize: 7,
    lineHeight: 10,
  },

  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  disclaimer: {
    fontSize: 8,
    lineHeight: 12,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 12,
  },
});