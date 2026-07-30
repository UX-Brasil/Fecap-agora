import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/contexts/AuthContext";
import { useTheme } from "@/src/theme/ThemeContext";

type FieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  testID: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoComplete?: "email" | "password" | "current-password";
  textContentType?: "emailAddress" | "password";
  onSubmitEditing?: () => void;
  returnKeyType?: "done" | "next" | "go";
};

export default function Login() {
  const { colors, typography, spacing, radius } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [email, setEmail] = useState("aluno@fecap.br");
  const [password, setPassword] = useState("demo1234");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isDesktop = width >= 900;

  const normalizedEmail = useMemo(
    () => email.trim().toLowerCase(),
    [email]
  );

  const submit = async () => {
    if (submitting) return;

    setErr(null);

    if (!normalizedEmail) {
      setErr("Informe seu e-mail.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setErr("Digite um e-mail válido.");
      return;
    }

    if (!password.trim()) {
      setErr("Informe sua senha.");
      return;
    }

    try {
      setSubmitting(true);

      const result = await signIn(normalizedEmail, password);

      if (!result.ok) {
        setErr(result.error ?? "Não foi possível entrar. Tente novamente.");
        return;
      }

      router.replace("/(tabs)");
    } catch {
      setErr("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.surface }]}
      edges={["top", "bottom"]}
      testID="login-screen"
    >
      <LinearGradient
        colors={["#071D21", "#0F2B30", "#123C3C"]}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />

      <DecorativeBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            isDesktop && styles.scrollDesktop,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.pageContent,
              isDesktop && styles.pageContentDesktop,
            ]}
          >
            {isDesktop && (
              <View style={styles.presentation}>
                <View style={styles.brandRow}>
                  <View style={styles.smallLogoContainer}>
                    <Image
                      source={require("@/assets/images/adaptive-icon.png")}
                      style={styles.smallLogo}
                      contentFit="contain"
                    />
                  </View>

                  <View>
                    <Text style={styles.brandName}>ASA Connect</Text>
                    <Text style={styles.brandCaption}>
                      O ecossistema que aproxima talentos e oportunidades
                    </Text>
                  </View>
                </View>

                <View style={styles.presentationContent}>
                  <View style={styles.presentationBadge}>
                    <Ionicons
                      name="sparkles-outline"
                      size={16}
                      color="#75F0B5"
                    />
                    <Text style={styles.presentationBadgeText}>
                      Conecte. Descubra. Cresça.
                    </Text>
                  </View>

                  <Text style={styles.presentationTitle}>
                    Sua próxima oportunidade pode estar a uma conexão de
                    distância.
                  </Text>

                  <Text style={styles.presentationDescription}>
                    Encontre vagas, eventos, hackathons, mentorias, empresas e
                    pessoas que podem transformar sua trajetória.
                  </Text>

                  <View style={styles.featureList}>
                    <Feature
                      icon="briefcase-outline"
                      title="Oportunidades personalizadas"
                    />
                    <Feature
                      icon="people-outline"
                      title="Networking universitário"
                    />
                    <Feature
                      icon="git-network-outline"
                      title="Conexões com empresas e alumni"
                    />
                  </View>
                </View>
              </View>
            )}

            <View
              style={[
                styles.card,
                {
                  borderRadius: radius.xl ?? 28,
                  borderColor: "rgba(255,255,255,0.12)",
                },
                isDesktop && styles.cardDesktop,
              ]}
            >
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={["rgba(117,240,181,0.18)", "rgba(31,211,203,0.08)"]}
                  style={styles.logoGlow}
                >
                  <Image
                    source={require("@/assets/images/adaptive-icon.png")}
                    style={styles.logo}
                    contentFit="contain"
                    transition={200}
                  />
                </LinearGradient>
              </View>

              <View style={styles.heading}>
                <Text style={styles.eyebrow}>BEM-VINDO AO ASA CONNECT</Text>

                <Text style={styles.title}>Entre na sua conta</Text>

                <Text style={styles.subtitle}>
                  Continue explorando oportunidades, conexões e experiências.
                </Text>
              </View>

              <View style={[styles.form, { gap: spacing.md }]}>
                <Field
                  icon="mail-outline"
                  placeholder="E-mail institucional"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (err) setErr(null);
                  }}
                  testID="login-email-input"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                />

                <Field
                  icon="lock-closed-outline"
                  placeholder="Senha"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (err) setErr(null);
                  }}
                  testID="login-password-input"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={submit}
                />
              </View>

              <View style={styles.passwordActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setEmail("aluno@fecap.br");
                    setPassword("demo1234");
                    setErr(null);
                  }}
                >
                  <Text style={styles.demoAccessText}>
                    Preencher acesso demonstrativo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotPassword}>
                    Esqueci minha senha
                  </Text>
                </TouchableOpacity>
              </View>

              {err && (
                <View
                  style={[
                    styles.errorContainer,
                    {
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <View style={styles.errorIcon}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color="#FF8A8A"
                    />
                  </View>

                  <Text
                    style={[
                      styles.errorText,
                      { fontWeight: typography.weight.medium },
                    ]}
                  >
                    {err}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={submit}
                disabled={submitting}
                style={[
                  styles.ctaWrapper,
                  {
                    borderRadius: radius.lg,
                    opacity: submitting ? 0.7 : 1,
                  },
                ]}
                testID="login-submit-button"
              >
                <LinearGradient
                  colors={["#37DD95", "#16C7AF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.cta,
                    {
                      borderRadius: radius.lg,
                    },
                  ]}
                >
                  {submitting ? (
                    <>
                      <ActivityIndicator size="small" color="#062B24" />
                      <Text style={styles.ctaText}>Entrando...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.ctaText}>Entrar</Text>

                      <View style={styles.ctaIcon}>
                        <Ionicons
                          name="arrow-forward"
                          size={18}
                          color="#062B24"
                        />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>ou</Text>
                <View style={styles.separatorLine} />
              </View>

              <View style={styles.rowBottom}>
                <Text style={styles.accountText}>Ainda não possui conta?</Text>

                <Link href="/(auth)/signup" asChild>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    testID="login-signup-link"
                  >
                    <Text style={styles.signupText}>Criar conta</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <View
                style={[
                  styles.demoBox,
                  {
                    borderRadius: radius.md,
                  },
                ]}
              >
                <View style={styles.demoIcon}>
                  <Ionicons
                    name="school-outline"
                    size={18}
                    color="#75F0B5"
                  />
                </View>

                <Text style={styles.demoText}>
                  <Text
                    style={{
                      fontWeight: typography.weight.bold,
                      color: "#D6FFF0",
                    }}
                  >
                    Modo demonstrativo:{" "}
                  </Text>
                  use qualquer e-mail válido e senha para explorar o aplicativo.
                </Text>
              </View>

              <Text style={styles.terms}>
                Ao continuar, você concorda com os Termos de Uso e a Política de
                Privacidade.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  testID,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  autoComplete,
  textContentType,
  onSubmitEditing,
  returnKeyType,
}: FieldProps) {
  const { radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = Boolean(secureTextEntry);

  return (
    <View
      style={[
        styles.field,
        {
          borderRadius: radius.lg,
          borderColor: focused
            ? "rgba(117,240,181,0.85)"
            : "rgba(255,255,255,0.12)",
          backgroundColor: focused
            ? "rgba(117,240,181,0.07)"
            : "rgba(255,255,255,0.055)",
        },
      ]}
    >
      <View
        style={[
          styles.fieldIcon,
          {
            backgroundColor: focused
              ? "rgba(117,240,181,0.14)"
              : "rgba(255,255,255,0.06)",
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={focused ? "#75F0B5" : "#91AAA8"}
        />
      </View>

      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#79918F"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isPassword && !showPassword}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        textContentType={textContentType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        selectionColor="#75F0B5"
        cursorColor="#75F0B5"
        style={styles.input}
        testID={testID}
      />

      {isPassword && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowPassword((current) => !current)}
          style={styles.passwordToggle}
          accessibilityLabel={
            showPassword ? "Ocultar senha" : "Mostrar senha"
          }
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={showPassword ? "#75F0B5" : "#91AAA8"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

function DecorativeBackground() {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.blurCircle, styles.blurCircleTop]} />
      <View style={[styles.blurCircle, styles.blurCircleBottom]} />

      <View style={styles.gridContainer}>
        {Array.from({ length: 8 }).map((_, index) => (
          <View
            key={`vertical-${index}`}
            style={[
              styles.gridVerticalLine,
              {
                left: `${index * 15}%`,
              },
            ]}
          />
        ))}

        {Array.from({ length: 10 }).map((_, index) => (
          <View
            key={`horizontal-${index}`}
            style={[
              styles.gridHorizontalLine,
              {
                top: `${index * 12}%`,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function Feature({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={19} color="#75F0B5" />
      </View>

      <Text style={styles.featureText}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  scrollDesktop: {
    paddingHorizontal: 48,
    paddingVertical: 48,
  },

  pageContent: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },

  pageContentDesktop: {
    maxWidth: 1180,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 60,
  },

  card: {
    width: "100%",
    paddingHorizontal: 22,
    paddingVertical: 28,
    backgroundColor: "rgba(5, 28, 31, 0.88)",
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 24,
    },
    shadowOpacity: 0.35,
    shadowRadius: 35,
    elevation: 18,
    overflow: "hidden",
  },

  cardDesktop: {
    maxWidth: 470,
    paddingHorizontal: 36,
    paddingVertical: 38,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 22,
  },

  logoGlow: {
    width: 94,
    height: 94,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(117,240,181,0.2)",
  },

  logo: {
    width: 80,
    height: 80,
  },

  heading: {
    alignItems: "center",
    marginBottom: 28,
  },

  eyebrow: {
    color: "#75F0B5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginBottom: 10,
  },

  title: {
    color: "#F5FFFC",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.7,
    textAlign: "center",
  },

  subtitle: {
    color: "#8DA8A5",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
    maxWidth: 350,
  },

  form: {
    width: "100%",
  },

  field: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
  },

  fieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    color: "#F2FFFB",
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 15,
    minWidth: 0,
  },

  passwordToggle: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  passwordActions: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  demoAccessText: {
    color: "#91AAA8",
    fontSize: 12,
    fontWeight: "600",
  },

  forgotPassword: {
    color: "#75F0B5",
    fontSize: 12,
    fontWeight: "700",
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "rgba(255,138,138,0.22)",
    backgroundColor: "rgba(255,89,89,0.09)",
  },

  errorIcon: {
    marginRight: 9,
  },

  errorText: {
    flex: 1,
    color: "#FFAAAA",
    fontSize: 13,
    lineHeight: 18,
  },

  ctaWrapper: {
    marginTop: 22,
    overflow: "hidden",
    shadowColor: "#35D99B",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.23,
    shadowRadius: 18,
    elevation: 8,
  },

  cta: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },

  ctaText: {
    color: "#062B24",
    fontSize: 16,
    fontWeight: "800",
  },

  ctaIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.24)",
  },

  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },

  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.13)",
  },

  separatorText: {
    color: "#6F8987",
    fontSize: 12,
    paddingHorizontal: 12,
  },

  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 5,
  },

  accountText: {
    color: "#8DA8A5",
    fontSize: 14,
  },

  signupText: {
    color: "#75F0B5",
    fontWeight: "800",
    fontSize: 14,
  },

  demoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(117,240,181,0.14)",
    backgroundColor: "rgba(117,240,181,0.055)",
  },

  demoIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(117,240,181,0.11)",
    marginRight: 10,
  },

  demoText: {
    flex: 1,
    color: "#91AAA8",
    fontSize: 12,
    lineHeight: 18,
  },

  terms: {
    color: "#5F7876",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 12,
  },

  presentation: {
    flex: 1,
    minHeight: 650,
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  smallLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(117,240,181,0.09)",
    borderWidth: 1,
    borderColor: "rgba(117,240,181,0.15)",
  },

  smallLogo: {
    width: 48,
    height: 48,
  },

  brandName: {
    color: "#F2FFFB",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  brandCaption: {
    color: "#74918E",
    fontSize: 12,
    marginTop: 3,
  },

  presentationContent: {
    maxWidth: 570,
  },

  presentationBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(117,240,181,0.08)",
    borderWidth: 1,
    borderColor: "rgba(117,240,181,0.14)",
    marginBottom: 24,
  },

  presentationBadgeText: {
    color: "#A7D9C8",
    fontSize: 12,
    fontWeight: "700",
  },

  presentationTitle: {
    color: "#F4FFFC",
    fontSize: 46,
    lineHeight: 54,
    fontWeight: "800",
    letterSpacing: -1.5,
  },

  presentationDescription: {
    color: "#8AA4A1",
    fontSize: 17,
    lineHeight: 27,
    marginTop: 20,
    maxWidth: 530,
  },

  featureList: {
    marginTop: 34,
    gap: 14,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(117,240,181,0.085)",
    borderWidth: 1,
    borderColor: "rgba(117,240,181,0.11)",
  },

  featureText: {
    color: "#B9CECA",
    fontSize: 14,
    fontWeight: "600",
  },

  blurCircle: {
    position: "absolute",
    borderRadius: 999,
  },

  blurCircleTop: {
    width: 330,
    height: 330,
    top: -140,
    right: -100,
    backgroundColor: "rgba(28, 221, 177, 0.07)",
  },

  blurCircleBottom: {
    width: 420,
    height: 420,
    bottom: -240,
    left: -170,
    backgroundColor: "rgba(30, 198, 210, 0.06)",
  },

  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },

  gridVerticalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  gridHorizontalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
});