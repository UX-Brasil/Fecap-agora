import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import { supabase } from "@/src/lib/supabase";
import { useTheme } from "@/src/theme/ThemeContext";

type Course = {
  id: string;
  code: string;
  name: string;
  level: string;
  active: boolean;
  total_semesters?: number | null;
  available_periods?: string[] | null;
};

type FieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  testID: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoComplete?:
    | "name"
    | "email"
    | "password"
    | "new-password"
    | "off";
  textContentType?:
    | "name"
    | "emailAddress"
    | "password"
    | "newPassword";
  onSubmitEditing?: () => void;
  returnKeyType?: "done" | "next" | "go";
};

export default function Signup() {
  const { typography, spacing, radius } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState<Course | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isDesktop = width >= 900;

  const normalizedEmail = useMemo(
    () => email.trim().toLowerCase(),
    [email],
  );

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    return score;
  }, [password]);

  const clearError = () => {
    if (err) {
      setErr(null);
    }
  };

  const submit = async () => {
    if (submitting) return;

    setErr(null);

    const normalizedName = name.trim();

    if (!normalizedName) {
      setErr("Informe seu nome completo.");
      return;
    }

    if (normalizedName.length < 3) {
      setErr("O nome deve possuir pelo menos 3 caracteres.");
      return;
    }

    if (!normalizedEmail) {
      setErr("Informe seu e-mail.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setErr("Digite um e-mail válido.");
      return;
    }

    if (!password) {
      setErr("Informe uma senha.");
      return;
    }

    if (password.length < 8) {
      setErr("A senha deve possuir pelo menos 8 caracteres.");
      return;
    }

    if (!course) {
      setErr("Selecione seu curso.");
      return;
    }

    if (!acceptedTerms) {
      setErr("Você precisa aceitar os Termos de Uso para continuar.");
      return;
    }

    try {
      setSubmitting(true);

      const result = await signUp({
        name: normalizedName,
        email: normalizedEmail,
        password,
        course: course.name,

        // Adicione esta propriedade no AuthContext caso ele aceite courseId:
        // courseId: course.id,
      });

      if (!result.ok) {
        setErr(result.error ?? "Não foi possível criar sua conta.");
        return;
      }

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      setErr("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
      testID="signup-screen"
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
                      Universidade, estudantes e empresas conectados
                    </Text>
                  </View>
                </View>

                <View style={styles.presentationContent}>
                  <View style={styles.presentationBadge}>
                    <Ionicons
                      name="rocket-outline"
                      size={16}
                      color="#75F0B5"
                    />

                    <Text style={styles.presentationBadgeText}>
                      Comece sua jornada
                    </Text>
                  </View>

                  <Text style={styles.presentationTitle}>
                    Crie conexões que podem transformar sua carreira.
                  </Text>

                  <Text style={styles.presentationDescription}>
                    Cadastre-se para descobrir vagas, hackathons, mentorias,
                    eventos, projetos e pessoas alinhadas aos seus objetivos.
                  </Text>

                  <View style={styles.featureList}>
                    <Feature
                      icon="briefcase-outline"
                      title="Vagas com match personalizado"
                    />

                    <Feature
                      icon="calendar-outline"
                      title="Eventos e hackathons em destaque"
                    />

                    <Feature
                      icon="people-outline"
                      title="Networking com estudantes e alumni"
                    />

                    <Feature
                      icon="trophy-outline"
                      title="Experiências, XP e conquistas"
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
                  colors={[
                    "rgba(117,240,181,0.18)",
                    "rgba(31,211,203,0.08)",
                  ]}
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
                <Text style={styles.eyebrow}>
                  FAÇA PARTE DO ASA CONNECT
                </Text>

                <Text style={styles.title}>Crie sua conta</Text>

                <Text style={styles.subtitle}>
                  Preencha seus dados e comece a explorar novas oportunidades.
                </Text>
              </View>

              <View style={[styles.form, { gap: spacing.md }]}>
                <Field
                  icon="person-outline"
                  placeholder="Nome completo"
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    clearError();
                  }}
                  testID="signup-name-input"
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  returnKeyType="next"
                />

                <Field
                  icon="mail-outline"
                  placeholder="E-mail institucional"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    clearError();
                  }}
                  testID="signup-email-input"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                />

                <Field
                  icon="lock-closed-outline"
                  placeholder="Crie uma senha"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearError();
                  }}
                  testID="signup-password-input"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                />

                {password.length > 0 && (
                  <PasswordStrength
                    score={passwordStrength}
                    password={password}
                  />
                )}

                <CourseDropdown
                  value={course}
                  onChange={(selectedCourse) => {
                    setCourse(selectedCourse);
                    clearError();
                  }}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setAcceptedTerms((current) => !current);
                  clearError();
                }}
                style={styles.termsRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
                testID="signup-terms-checkbox"
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptedTerms && styles.checkboxChecked,
                  ]}
                >
                  {acceptedTerms && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#062B24"
                    />
                  )}
                </View>

                <Text style={styles.termsLabel}>
                  Li e aceito os{" "}
                  <Text style={styles.termsLink}>Termos de Uso</Text> e a{" "}
                  <Text style={styles.termsLink}>
                    Política de Privacidade
                  </Text>
                  .
                </Text>
              </TouchableOpacity>

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
                      {
                        fontWeight: typography.weight.medium,
                      },
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
                testID="signup-submit-button"
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

                      <Text style={styles.ctaText}>
                        Criando sua conta...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.ctaText}>Criar conta</Text>

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
                <Text style={styles.accountText}>
                  Já possui uma conta?
                </Text>

                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    testID="signup-login-link"
                  >
                    <Text style={styles.loginText}>Entrar</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <View
                style={[
                  styles.securityBox,
                  {
                    borderRadius: radius.md,
                  },
                ]}
              >
                <View style={styles.securityIcon}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color="#75F0B5"
                  />
                </View>

                <Text style={styles.securityText}>
                  Seus dados são armazenados de forma segura e utilizados
                  apenas para personalizar sua experiência.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CourseDropdown({
  value,
  onChange,
}: {
  value: Course | null;
  onChange: (course: Course) => void;
}) {
  const { radius } = useTheme();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("courses")
        .select(
          `
            id,
            code,
            name,
            level,
            active
          `,
        )
        .eq("active", true)
        .eq("level", "undergraduate")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      setCourses((data ?? []) as Course[]);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      setCourses([]);
      setLoadError(
        "Não foi possível carregar os cursos. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return courses;

    return courses.filter((courseItem) => {
      return (
        courseItem.name.toLowerCase().includes(query) ||
        courseItem.code.toLowerCase().includes(query)
      );
    });
  }, [courses, search]);

  const openModal = () => {
    setOpen(true);

    if (courses.length === 0 && !loading) {
      loadCourses();
    }
  };

  const closeModal = () => {
    setOpen(false);
    setSearch("");
  };

  const selectCourse = (selectedCourse: Course) => {
    onChange(selectedCourse);
    closeModal();
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={openModal}
        style={[
          styles.courseField,
          {
            borderRadius: radius.lg,
          },
        ]}
        testID="signup-course-input"
        accessibilityRole="button"
        accessibilityLabel="Selecionar curso"
      >
        <View
          style={[
            styles.fieldIcon,
            styles.courseFieldIcon,
            value && styles.courseFieldIconSelected,
          ]}
        >
          <Ionicons
            name="school-outline"
            size={19}
            color={value ? "#75F0B5" : "#91AAA8"}
          />
        </View>

        <View style={styles.courseFieldContent}>
          <Text
            numberOfLines={1}
            style={[
              styles.courseFieldText,
              !value && styles.coursePlaceholder,
            ]}
          >
            {value?.name ?? "Selecione seu curso"}
          </Text>

          {value && (
            <Text style={styles.courseFieldDescription}>
              Código: {value.code}
            </Text>
          )}
        </View>

        {loading && courses.length === 0 ? (
          <ActivityIndicator size="small" color="#75F0B5" />
        ) : (
          <Ionicons
            name="chevron-down-outline"
            size={20}
            color="#91AAA8"
          />
        )}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeModal}
          />

          <View
            style={[
              styles.courseModal,
              {
                borderRadius: radius.xl ?? 28,
              },
            ]}
          >
            <View style={styles.courseModalHeader}>
              <View style={styles.courseModalHeaderText}>
                <Text style={styles.courseModalEyebrow}>
                  FORMAÇÃO ACADÊMICA
                </Text>

                <Text style={styles.courseModalTitle}>
                  Selecione seu curso
                </Text>

                {!loading && !loadError && (
                  <Text style={styles.courseModalSubtitle}>
                    {courses.length}{" "}
                    {courses.length === 1
                      ? "curso disponível"
                      : "cursos disponíveis"}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={closeModal}
                style={styles.courseModalClose}
                accessibilityLabel="Fechar seletor de cursos"
              >
                <Ionicons
                  name="close-outline"
                  size={24}
                  color="#D9EEEA"
                />
              </TouchableOpacity>
            </View>

            {!loadError && (
              <View style={styles.courseSearch}>
                <Ionicons
                  name="search-outline"
                  size={19}
                  color="#91AAA8"
                />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar por nome ou código"
                  placeholderTextColor="#718B88"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor="#75F0B5"
                  cursorColor="#75F0B5"
                  style={styles.courseSearchInput}
                  testID="signup-course-search"
                />

                {search.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSearch("")}
                    accessibilityLabel="Limpar busca"
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color="#718B88"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {loading ? (
              <View style={styles.courseLoadingContainer}>
                <ActivityIndicator size="large" color="#75F0B5" />

                <Text style={styles.courseLoadingTitle}>
                  Carregando cursos
                </Text>

                <Text style={styles.courseLoadingDescription}>
                  Consultando os cursos disponíveis no sistema.
                </Text>
              </View>
            ) : loadError ? (
              <View style={styles.courseErrorContainer}>
                <View style={styles.courseErrorIcon}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={28}
                    color="#FF9B9B"
                  />
                </View>

                <Text style={styles.courseErrorTitle}>
                  Não foi possível carregar
                </Text>

                <Text style={styles.courseErrorDescription}>
                  {loadError}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={loadCourses}
                  style={styles.courseRetryButton}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color="#062B24"
                  />

                  <Text style={styles.courseRetryButtonText}>
                    Tentar novamente
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={styles.courseList}
                contentContainerStyle={styles.courseListContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {filteredCourses.map((item) => {
                  const selected = value?.id === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => selectCourse(item)}
                      style={[
                        styles.courseOption,
                        selected && styles.courseOptionSelected,
                      ]}
                      testID={`course-option-${item.code.toLowerCase()}`}
                    >
                      <View
                        style={[
                          styles.courseCode,
                          selected && styles.courseCodeSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.courseCodeText,
                            selected && styles.courseCodeTextSelected,
                          ]}
                        >
                          {item.code}
                        </Text>
                      </View>

                      <View style={styles.courseOptionContent}>
                        <Text
                          style={[
                            styles.courseOptionName,
                            selected &&
                              styles.courseOptionNameSelected,
                          ]}
                        >
                          {item.name}
                        </Text>

                        <Text style={styles.courseOptionDescription}>
                          Curso de graduação
                        </Text>
                      </View>

                      {selected ? (
                        <View style={styles.selectedCourseIcon}>
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#062B24"
                          />
                        </View>
                      ) : (
                        <Ionicons
                          name="chevron-forward-outline"
                          size={18}
                          color="#607A77"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {filteredCourses.length === 0 && (
                  <View style={styles.emptyCourses}>
                    <View style={styles.emptyCoursesIcon}>
                      <Ionicons
                        name="search-outline"
                        size={25}
                        color="#75F0B5"
                      />
                    </View>

                    <Text style={styles.emptyCoursesTitle}>
                      Nenhum curso encontrado
                    </Text>

                    <Text style={styles.emptyCoursesDescription}>
                      Verifique o nome ou o código pesquisado.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
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

function PasswordStrength({
  score,
  password,
}: {
  score: number;
  password: string;
}) {
  const strength = useMemo(() => {
    if (score <= 1) {
      return {
        label: "Senha fraca",
        color: "#FF8A8A",
      };
    }

    if (score === 2) {
      return {
        label: "Senha razoável",
        color: "#F5C26B",
      };
    }

    if (score === 3) {
      return {
        label: "Senha boa",
        color: "#72DDA4",
      };
    }

    return {
      label: "Senha forte",
      color: "#37DD95",
    };
  }, [score]);

  return (
    <View style={styles.passwordStrength}>
      <View style={styles.strengthHeader}>
        <Text style={styles.strengthTitle}>Segurança da senha</Text>

        <Text
          style={[
            styles.strengthLabel,
            {
              color: strength.color,
            },
          ]}
        >
          {strength.label}
        </Text>
      </View>

      <View style={styles.strengthBars}>
        {[1, 2, 3, 4].map((item) => (
          <View
            key={item}
            style={[
              styles.strengthBar,
              {
                backgroundColor:
                  item <= score
                    ? strength.color
                    : "rgba(255,255,255,0.09)",
              },
            ]}
          />
        ))}
      </View>

      <Text style={styles.passwordHint}>
        Use pelo menos 8 caracteres, incluindo número, letra maiúscula e
        símbolo.
      </Text>

      {password.length > 0 && password.length < 8 && (
        <Text style={styles.passwordLength}>
          Faltam {8 - password.length} caracteres.
        </Text>
      )}
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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#071D21",
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
    maxWidth: 500,
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
    backgroundColor: "rgba(5,28,31,0.88)",
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
    maxWidth: 490,
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
    maxWidth: 360,
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

  passwordStrength: {
    paddingHorizontal: 4,
    marginTop: -2,
  },

  strengthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  strengthTitle: {
    color: "#809A97",
    fontSize: 11,
    fontWeight: "600",
  },

  strengthLabel: {
    fontSize: 11,
    fontWeight: "800",
  },

  strengthBars: {
    flexDirection: "row",
    gap: 6,
  },

  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },

  passwordHint: {
    color: "#617C79",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
  },

  passwordLength: {
    color: "#F5C26B",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  courseField: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  courseFieldIcon: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  courseFieldIconSelected: {
    backgroundColor: "rgba(117,240,181,0.14)",
  },

  courseFieldContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  courseFieldText: {
    color: "#F2FFFB",
    fontSize: 15,
    fontWeight: "600",
  },

  coursePlaceholder: {
    color: "#79918F",
    fontWeight: "400",
  },

  courseFieldDescription: {
    color: "#718B88",
    fontSize: 11,
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 30,
    backgroundColor: "rgba(0,0,0,0.76)",
  },

  courseModal: {
    width: "100%",
    maxWidth: 540,
    maxHeight: "82%",
    padding: 20,
    backgroundColor: "#092529",
    borderWidth: 1,
    borderColor: "rgba(117,240,181,0.16)",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 20,
  },

  courseModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  courseModalHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  courseModalEyebrow: {
    color: "#75F0B5",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  courseModalTitle: {
    color: "#F4FFFC",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  courseModalSubtitle: {
    color: "#718B88",
    fontSize: 12,
    marginTop: 5,
  },

  courseModalClose: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  courseSearch: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    backgroundColor: "rgba(255,255,255,0.055)",
    marginBottom: 14,
  },

  courseSearchInput: {
    flex: 1,
    color: "#F2FFFB",
    fontSize: 14,
    marginLeft: 10,
    paddingVertical: 13,
  },

  courseList: {
    flexGrow: 0,
  },

  courseListContent: {
    gap: 10,
    paddingBottom: 4,
  },

  courseOption: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  courseOptionSelected: {
    borderColor: "rgba(117,240,181,0.42)",
    backgroundColor: "rgba(117,240,181,0.09)",
  },

  courseCode: {
    width: 58,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 4,
  },

  courseCodeSelected: {
    backgroundColor: "rgba(117,240,181,0.14)",
    borderColor: "rgba(117,240,181,0.28)",
  },

  courseCodeText: {
    color: "#A4BBB8",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },

  courseCodeTextSelected: {
    color: "#75F0B5",
  },

  courseOptionContent: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },

  courseOptionName: {
    color: "#D8EAE7",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },

  courseOptionNameSelected: {
    color: "#F2FFFB",
  },

  courseOptionDescription: {
    color: "#718B88",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  selectedCourseIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#75F0B5",
  },

  courseLoadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 54,
    paddingHorizontal: 24,
  },

  courseLoadingTitle: {
    color: "#E8F8F5",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 16,
  },

  courseLoadingDescription: {
    color: "#718B88",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },

  courseErrorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
    paddingHorizontal: 24,
  },

  courseErrorIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,138,138,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,138,138,0.15)",
    marginBottom: 14,
  },

  courseErrorTitle: {
    color: "#F8EAEA",
    fontSize: 16,
    fontWeight: "800",
  },

  courseErrorDescription: {
    color: "#A88989",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 320,
  },

  courseRetryButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#75F0B5",
    marginTop: 18,
  },

  courseRetryButtonText: {
    color: "#062B24",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyCourses: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
    paddingHorizontal: 20,
  },

  emptyCoursesIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(117,240,181,0.09)",
    marginBottom: 14,
  },

  emptyCoursesTitle: {
    color: "#E8F8F5",
    fontSize: 15,
    fontWeight: "800",
  },

  emptyCoursesDescription: {
    color: "#718B88",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: "#75F0B5",
    borderColor: "#75F0B5",
  },

  termsLabel: {
    flex: 1,
    color: "#849E9B",
    fontSize: 12,
    lineHeight: 18,
  },

  termsLink: {
    color: "#75F0B5",
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

  loginText: {
    color: "#75F0B5",
    fontWeight: "800",
    fontSize: 14,
  },

  securityBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(117,240,181,0.14)",
    backgroundColor: "rgba(117,240,181,0.055)",
  },

  securityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(117,240,181,0.11)",
    marginRight: 10,
  },

  securityText: {
    flex: 1,
    color: "#91AAA8",
    fontSize: 12,
    lineHeight: 18,
  },

  presentation: {
    flex: 1,
    minHeight: 720,
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
    backgroundColor: "rgba(28,221,177,0.07)",
  },

  blurCircleBottom: {
    width: 420,
    height: 420,
    bottom: -240,
    left: -170,
    backgroundColor: "rgba(30,198,210,0.06)",
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