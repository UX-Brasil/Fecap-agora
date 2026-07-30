import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/src/contexts/AuthContext";
import { COMPANIES } from "@/src/services/mock-data";
import { useTheme } from "@/src/theme/ThemeContext";

const WEB_BREAKPOINT = 768;
const WEB_MAX_WIDTH = 880;
const MAX_BIO_LENGTH = 300;

type FormErrors = {
  name?: string;
  handle?: string;
  course?: string;
  semester?: string;
  portfolio?: string;
};

type ProfileForm = {
  name: string;
  handle: string;
  course: string;
  semester: string;
  bio: string;
  companyDesired: string;
  github: string;
  linkedin: string;
  portfolio: string;
  avatarUrl: string;
  skills: string[];
};

export default function EditProfile() {
  const { colors, typography, radius } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop =
    Platform.OS === "web" && width >= WEB_BREAKPOINT;

  const [form, setForm] = useState<ProfileForm>({
    name: user?.name ?? "",
    handle: user?.handle ?? "",
    course: user?.course ?? "",
    semester: String(user?.semester ?? ""),
    bio:
      "bio" in (user ?? {})
        ? String(user?.bio ?? "")
        : "",
    companyDesired: user?.companyDesired ?? "",
    github: user?.github ?? "",
    linkedin: user?.linkedin ?? "",
    portfolio: user?.portfolio ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    skills: user?.skills ?? [],
  });

  const [errors, setErrors] = useState<FormErrors>(
    {},
  );
  const [skillInput, setSkillInput] = useState("");
  const [companySearch, setCompanySearch] =
    useState("");
  const [showCompanies, setShowCompanies] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const selectedCompany = useMemo(
    () =>
      COMPANIES.find(
        (company) =>
          company.id === form.companyDesired,
      ),
    [form.companyDesired],
  );

  const filteredCompanies = useMemo(() => {
    const query = companySearch
      .trim()
      .toLowerCase();

    if (!query) {
      return COMPANIES.slice(0, 8);
    }

    return COMPANIES.filter((company) => {
      return (
        company.name.toLowerCase().includes(query) ||
        company.industry
          .toLowerCase()
          .includes(query)
      );
    }).slice(0, 8);
  }, [companySearch]);

  if (!user) {
    return null;
  }

  const updateField = <K extends keyof ProfileForm>(
    field: K,
    value: ProfileForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setHasChanges(true);

    if (field in errors) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name =
        "Informe seu nome completo.";
    }

    if (!form.handle.trim()) {
      nextErrors.handle =
        "Informe um nome de usuário.";
    } else if (
      !/^@?[a-zA-Z0-9._-]{3,30}$/.test(
        form.handle.trim(),
      )
    ) {
      nextErrors.handle =
        "Use de 3 a 30 caracteres sem espaços.";
    }

    if (!form.course.trim()) {
      nextErrors.course =
        "Informe seu curso.";
    }

    const semester = Number(form.semester);

    if (
      !form.semester.trim() ||
      Number.isNaN(semester) ||
      semester < 1 ||
      semester > 20
    ) {
      nextErrors.semester =
        "Informe um semestre entre 1 e 20.";
    }

    if (
      form.portfolio.trim() &&
      !isValidUrl(form.portfolio)
    ) {
      nextErrors.portfolio =
        "Informe uma URL válida.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSelectAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          "Autorize o acesso às fotos para alterar sua imagem de perfil.",
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });

      if (!result.canceled) {
        updateField(
          "avatarUrl",
          result.assets[0].uri,
        );
      }
    } catch (error) {
      console.error(
        "Erro ao selecionar imagem:",
        error,
      );

      Alert.alert(
        "Erro ao abrir galeria",
        "Não foi possível selecionar uma imagem.",
      );
    }
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();

    if (!skill) {
      return;
    }

    const alreadyExists = form.skills.some(
      (item) =>
        item.toLowerCase() === skill.toLowerCase(),
    );

    if (alreadyExists) {
      Alert.alert(
        "Skill já adicionada",
        "Essa habilidade já está no seu perfil.",
      );
      return;
    }

    if (form.skills.length >= 15) {
      Alert.alert(
        "Limite atingido",
        "Você pode adicionar até 15 habilidades.",
      );
      return;
    }

    updateField("skills", [
      ...form.skills,
      skill,
    ]);

    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    updateField(
      "skills",
      form.skills.filter(
        (item) => item !== skill,
      ),
    );
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Revise os dados",
        "Alguns campos precisam ser corrigidos.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        handle: normalizeHandle(form.handle),
        course: form.course.trim(),
        semester: Number(form.semester),
        bio: form.bio.trim(),
        companyDesired:
          form.companyDesired || null,
        github: cleanGithub(form.github),
        linkedin: cleanLinkedin(form.linkedin),
        portfolio: form.portfolio.trim(),
        avatarUrl: form.avatarUrl,
        skills: form.skills,
      };

      console.log(
        "Dados para atualização do perfil:",
        payload,
      );

      /*
       * Substitua este bloco pela função real do
       * AuthContext ou serviço do Supabase:
       *
       * await updateProfile(payload);
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 500),
      );

      setHasChanges(false);

      Alert.alert(
        "Perfil atualizado",
        "Suas alterações foram salvas com sucesso.",
        [
          {
            text: "Continuar",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar perfil:",
        error,
      );

      Alert.alert(
        "Erro ao salvar",
        "Não foi possível atualizar seu perfil. Tente novamente.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Você possui alterações não salvas. Deseja sair mesmo assim?",
      );

      if (confirmed) {
        router.back();
      }

      return;
    }

    Alert.alert(
      "Descartar alterações?",
      "As alterações feitas não serão salvas.",
      [
        {
          text: "Continuar editando",
          style: "cancel",
        },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => router.back(),
        },
      ],
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
      testID="edit-profile-screen"
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <EditProfileHeader
          isSaving={isSaving}
          hasChanges={hasChanges}
          onBack={handleBack}
          onSave={handleSave}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: isDesktop
                ? 24
                : 14,
            },
          ]}
        >
          <View
            style={[
              styles.content,
              {
                maxWidth: isDesktop
                  ? WEB_MAX_WIDTH
                  : undefined,
              },
            ]}
          >
            <AvatarSection
              avatarUrl={form.avatarUrl}
              name={form.name}
              onSelectAvatar={handleSelectAvatar}
            />

            <FormSection
              title="Informações básicas"
              description="Dados exibidos no seu perfil profissional."
              icon="person-outline"
            >
              <FormField
                label="Nome completo"
                value={form.name}
                onChangeText={(value) =>
                  updateField("name", value)
                }
                placeholder="Digite seu nome completo"
                icon="person-outline"
                error={errors.name}
                autoCapitalize="words"
                testID="edit-profile-name"
              />

              <FormField
                label="Nome de usuário"
                value={form.handle}
                onChangeText={(value) =>
                  updateField("handle", value)
                }
                placeholder="@seuusuario"
                icon="at-outline"
                error={errors.handle}
                autoCapitalize="none"
                autoCorrect={false}
                testID="edit-profile-handle"
              />

              <FormField
                label="Curso"
                value={form.course}
                onChangeText={(value) =>
                  updateField("course", value)
                }
                placeholder="Ciência da Computação"
                icon="school-outline"
                error={errors.course}
                autoCapitalize="words"
                testID="edit-profile-course"
              />

              <FormField
                label="Semestre"
                value={form.semester}
                onChangeText={(value) =>
                  updateField(
                    "semester",
                    value.replace(/\D/g, ""),
                  )
                }
                placeholder="Ex.: 5"
                icon="calendar-outline"
                error={errors.semester}
                keyboardType="number-pad"
                maxLength={2}
                testID="edit-profile-semester"
              />

              <View>
                <FieldLabel
                  label="Sobre você"
                  optional
                />

                <View
                  style={[
                    styles.textAreaContainer,
                    {
                      backgroundColor:
                        colors.surfaceSecondary,
                      borderColor: colors.border,
                      borderRadius: radius.lg,
                    },
                  ]}
                >
                  <TextInput
                    value={form.bio}
                    onChangeText={(value) =>
                      updateField(
                        "bio",
                        value.slice(
                          0,
                          MAX_BIO_LENGTH,
                        ),
                      )
                    }
                    placeholder="Conte um pouco sobre seus interesses, objetivos e experiências..."
                    placeholderTextColor={
                      colors.onSurfaceTertiary
                    }
                    multiline
                    textAlignVertical="top"
                    style={[
                      styles.textArea,
                      {
                        color: colors.onSurface,
                      },
                    ]}
                    maxLength={MAX_BIO_LENGTH}
                    testID="edit-profile-bio"
                  />

                  <Text
                    style={[
                      styles.characterCount,
                      {
                        color:
                          colors.onSurfaceTertiary,
                      },
                    ]}
                  >
                    {form.bio.length}/
                    {MAX_BIO_LENGTH}
                  </Text>
                </View>
              </View>
            </FormSection>

            <FormSection
              title="Objetivo profissional"
              description="Selecione a empresa em que deseja trabalhar."
              icon="flag-outline"
            >
              <View>
                <FieldLabel
                  label="Empresa desejada"
                  optional
                />

                {selectedCompany ? (
                  <View
                    style={[
                      styles.selectedCompany,
                      {
                        backgroundColor:
                          colors.surfaceSecondary,
                        borderColor: colors.border,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <Image
                      source={{
                        uri: selectedCompany.logoUrl,
                      }}
                      style={styles.companyLogo}
                      contentFit="contain"
                    />

                    <View
                      style={styles.companyInfo}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.companyName,
                          {
                            color:
                              colors.onSurface,
                            fontWeight:
                              typography.weight
                                .semibold,
                          },
                        ]}
                      >
                        {selectedCompany.name}
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.companyIndustry,
                          {
                            color:
                              colors.onSurfaceTertiary,
                          },
                        ]}
                      >
                        {selectedCompany.industry}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => {
                        updateField(
                          "companyDesired",
                          "",
                        );
                        setCompanySearch("");
                      }}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="close-circle"
                        size={21}
                        color={
                          colors.onSurfaceTertiary
                        }
                      />
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View
                      style={[
                        styles.searchContainer,
                        {
                          backgroundColor:
                            colors.surfaceSecondary,
                          borderColor:
                            showCompanies
                              ? colors.brandPrimary
                              : colors.border,
                          borderRadius: radius.lg,
                        },
                      ]}
                    >
                      <Ionicons
                        name="search-outline"
                        size={18}
                        color={
                          colors.onSurfaceTertiary
                        }
                      />

                      <TextInput
                        value={companySearch}
                        onChangeText={(value) => {
                          setCompanySearch(value);
                          setShowCompanies(true);
                        }}
                        onFocus={() =>
                          setShowCompanies(true)
                        }
                        placeholder="Buscar empresa..."
                        placeholderTextColor={
                          colors.onSurfaceTertiary
                        }
                        style={[
                          styles.searchInput,
                          {
                            color:
                              colors.onSurface,
                          },
                        ]}
                      />
                    </View>

                    {showCompanies ? (
                      <View
                        style={[
                          styles.companyDropdown,
                          {
                            backgroundColor:
                              colors.surfaceSecondary,
                            borderColor:
                              colors.border,
                            borderRadius:
                              radius.lg,
                          },
                        ]}
                      >
                        {filteredCompanies.length >
                        0 ? (
                          filteredCompanies.map(
                            (company, index) => (
                              <Pressable
                                key={company.id}
                                onPress={() => {
                                  updateField(
                                    "companyDesired",
                                    company.id,
                                  );
                                  setCompanySearch("");
                                  setShowCompanies(
                                    false,
                                  );
                                }}
                                style={({ pressed }) => [
                                  styles.companyOption,
                                  index <
                                    filteredCompanies.length -
                                      1 && {
                                    borderBottomWidth:
                                      StyleSheet.hairlineWidth,
                                    borderBottomColor:
                                      colors.border,
                                  },
                                  {
                                    opacity: pressed
                                      ? 0.7
                                      : 1,
                                  },
                                ]}
                              >
                                <Image
                                  source={{
                                    uri: company.logoUrl,
                                  }}
                                  style={
                                    styles.companyOptionLogo
                                  }
                                  contentFit="contain"
                                />

                                <View
                                  style={
                                    styles.companyInfo
                                  }
                                >
                                  <Text
                                    numberOfLines={1}
                                    style={[
                                      styles.companyName,
                                      {
                                        color:
                                          colors.onSurface,
                                        fontWeight:
                                          typography
                                            .weight
                                            .semibold,
                                      },
                                    ]}
                                  >
                                    {company.name}
                                  </Text>

                                  <Text
                                    numberOfLines={1}
                                    style={[
                                      styles.companyIndustry,
                                      {
                                        color:
                                          colors.onSurfaceTertiary,
                                      },
                                    ]}
                                  >
                                    {company.industry}
                                  </Text>
                                </View>

                                <Ionicons
                                  name="add-circle-outline"
                                  size={20}
                                  color={
                                    colors.brandPrimary
                                  }
                                />
                              </Pressable>
                            ),
                          )
                        ) : (
                          <View
                            style={
                              styles.emptyCompanies
                            }
                          >
                            <Ionicons
                              name="business-outline"
                              size={24}
                              color={
                                colors.onSurfaceTertiary
                              }
                            />

                            <Text
                              style={[
                                styles.emptyCompaniesText,
                                {
                                  color:
                                    colors.onSurfaceSecondary,
                                },
                              ]}
                            >
                              Nenhuma empresa encontrada.
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            </FormSection>

            <FormSection
              title="Habilidades"
              description="Adicione até 15 competências ao perfil."
              icon="code-slash-outline"
            >
              <View
                style={[
                  styles.skillInputContainer,
                  {
                    backgroundColor:
                      colors.surfaceSecondary,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                  },
                ]}
              >
                <Ionicons
                  name="add-outline"
                  size={19}
                  color={colors.onSurfaceTertiary}
                />

                <TextInput
                  value={skillInput}
                  onChangeText={setSkillInput}
                  onSubmitEditing={handleAddSkill}
                  placeholder="Ex.: React Native"
                  placeholderTextColor={
                    colors.onSurfaceTertiary
                  }
                  returnKeyType="done"
                  style={[
                    styles.skillInput,
                    {
                      color: colors.onSurface,
                    },
                  ]}
                />

                <Pressable
                  onPress={handleAddSkill}
                  disabled={!skillInput.trim()}
                  style={({ pressed }) => [
                    styles.addSkillButton,
                    {
                      backgroundColor:
                        skillInput.trim()
                          ? colors.brandPrimary
                          : colors.surfaceTertiary,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.addSkillText,
                      {
                        color: skillInput.trim()
                          ? colors.onBrandPrimary
                          : colors.onSurfaceTertiary,
                        fontWeight:
                          typography.weight.bold,
                      },
                    ]}
                  >
                    Adicionar
                  </Text>
                </Pressable>
              </View>

              <View style={styles.skillsList}>
                {form.skills.map((skill) => (
                  <View
                    key={skill}
                    style={[
                      styles.skillChip,
                      {
                        backgroundColor:
                          `${colors.brandPrimary}10`,
                        borderColor:
                          `${colors.brandPrimary}30`,
                        borderRadius: radius.pill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.skillChipText,
                        {
                          color:
                            colors.brandPrimary,
                          fontWeight:
                            typography.weight
                              .semibold,
                        },
                      ]}
                    >
                      {skill}
                    </Text>

                    <Pressable
                      onPress={() =>
                        handleRemoveSkill(skill)
                      }
                      hitSlop={6}
                    >
                      <Ionicons
                        name="close"
                        size={15}
                        color={colors.brandPrimary}
                      />
                    </Pressable>
                  </View>
                ))}

                {form.skills.length === 0 ? (
                  <Text
                    style={[
                      styles.noSkillsText,
                      {
                        color:
                          colors.onSurfaceTertiary,
                      },
                    ]}
                  >
                    Nenhuma habilidade adicionada.
                  </Text>
                ) : null}
              </View>
            </FormSection>

            <FormSection
              title="Links profissionais"
              description="Adicione suas redes e seu portfólio."
              icon="link-outline"
            >
              <FormField
                label="GitHub"
                value={form.github}
                onChangeText={(value) =>
                  updateField("github", value)
                }
                placeholder="seuusuario"
                icon="logo-github"
                autoCapitalize="none"
                autoCorrect={false}
                testID="edit-profile-github"
              />

              <FormField
                label="LinkedIn"
                value={form.linkedin}
                onChangeText={(value) =>
                  updateField("linkedin", value)
                }
                placeholder="seuusuario"
                icon="logo-linkedin"
                autoCapitalize="none"
                autoCorrect={false}
                testID="edit-profile-linkedin"
              />

              <FormField
                label="Portfólio"
                value={form.portfolio}
                onChangeText={(value) =>
                  updateField("portfolio", value)
                }
                placeholder="https://seusite.com.br"
                icon="globe-outline"
                error={errors.portfolio}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                testID="edit-profile-portfolio"
              />
            </FormSection>

            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor:
                    colors.brandPrimary,
                  borderRadius: radius.lg,
                  opacity:
                    isSaving || pressed
                      ? 0.72
                      : 1,
                },
              ]}
              testID="edit-profile-save-bottom"
            >
              {isSaving ? (
                <Ionicons
                  name="hourglass-outline"
                  size={19}
                  color={colors.onBrandPrimary}
                />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={19}
                  color={colors.onBrandPrimary}
                />
              )}

              <Text
                style={[
                  styles.saveButtonText,
                  {
                    color: colors.onBrandPrimary,
                    fontWeight:
                      typography.weight.bold,
                  },
                ]}
              >
                {isSaving
                  ? "Salvando..."
                  : "Salvar alterações"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type EditProfileHeaderProps = {
  isSaving: boolean;
  hasChanges: boolean;
  onBack: () => void;
  onSave: () => void;
};

function EditProfileHeader({
  isSaving,
  hasChanges,
  onBack,
  onSave,
}: EditProfileHeaderProps) {
  const { colors, typography, radius } = useTheme();

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
      <View style={styles.headerLeft}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [
            styles.headerButton,
            {
              backgroundColor:
                colors.surfaceSecondary,
              borderColor: colors.border,
              borderRadius: radius.md,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          testID="edit-profile-back"
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons
            name="chevron-back"
            size={21}
            color={colors.onSurface}
          />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <View style={styles.headerTitleRow}>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: colors.onSurface,
                  fontWeight:
                    typography.weight.heavy,
                },
              ]}
            >
              Editar perfil
            </Text>

            {hasChanges ? (
              <View
                style={[
                  styles.unsavedBadge,
                  {
                    backgroundColor:
                      `${colors.warning}18`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.unsavedDot,
                    {
                      backgroundColor:
                        colors.warning,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.unsavedText,
                    {
                      color: colors.warning,
                      fontWeight:
                        typography.weight
                          .semibold,
                    },
                  ]}
                >
                  Não salvo
                </Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[
              styles.headerSubtitle,
              {
                color: colors.onSurfaceTertiary,
              },
            ]}
          >
            Atualize suas informações profissionais
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onSave}
        disabled={isSaving}
        style={({ pressed }) => [
          styles.headerSaveButton,
          {
            backgroundColor:
              colors.brandPrimary,
            borderRadius: radius.md,
            opacity:
              isSaving || pressed ? 0.72 : 1,
          },
        ]}
        testID="edit-profile-save-header"
      >
        <Ionicons
          name={
            isSaving
              ? "hourglass-outline"
              : "checkmark-outline"
          }
          size={17}
          color={colors.onBrandPrimary}
        />

        <Text
          style={[
            styles.headerSaveText,
            {
              color: colors.onBrandPrimary,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          {isSaving ? "Salvando" : "Salvar"}
        </Text>
      </Pressable>
    </View>
  );
}

function AvatarSection({
  avatarUrl,
  name,
  onSelectAvatar,
}: {
  avatarUrl: string;
  name: string;
  onSelectAvatar: () => void;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.avatarCard,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image
            source={{
              uri: avatarUrl,
            }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              {
                backgroundColor:
                  `${colors.brandPrimary}18`,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarInitials,
                {
                  color: colors.brandPrimary,
                  fontWeight:
                    typography.weight.heavy,
                },
              ]}
            >
              {getInitials(name)}
            </Text>
          </View>
        )}

        <Pressable
          onPress={onSelectAvatar}
          style={({ pressed }) => [
            styles.cameraButton,
            {
              backgroundColor:
                colors.brandPrimary,
              borderColor: colors.surface,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Alterar foto do perfil"
        >
          <Ionicons
            name="camera"
            size={18}
            color={colors.onBrandPrimary}
          />
        </Pressable>
      </View>

      <View style={styles.avatarTextContent}>
        <Text
          style={[
            styles.avatarTitle,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          Foto de perfil
        </Text>

        <Text
          style={[
            styles.avatarDescription,
            {
              color: colors.onSurfaceSecondary,
            },
          ]}
        >
          Escolha uma imagem nítida e profissional.
        </Text>

        <Pressable
          onPress={onSelectAvatar}
          style={({ pressed }) => [
            styles.changePhotoButton,
            {
              borderColor: colors.border,
              borderRadius: radius.md,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons
            name="images-outline"
            size={16}
            color={colors.brandPrimary}
          />

          <Text
            style={[
              styles.changePhotoText,
              {
                color: colors.brandPrimary,
                fontWeight:
                  typography.weight.semibold,
              },
            ]}
          >
            Escolher imagem
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FormSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.formSection,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIcon,
            {
              backgroundColor:
                `${colors.brandPrimary}14`,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={colors.brandPrimary}
          />
        </View>

        <View style={styles.sectionHeaderText}>
          <Text
            style={[
              styles.sectionTitle,
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
              styles.sectionDescription,
              {
                color: colors.onSurfaceSecondary,
              },
            ]}
          >
            {description}
          </Text>
        </View>
      </View>

      <View style={styles.sectionFields}>
        {children}
      </View>
    </View>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  testID?: string;
  optional?: boolean;
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "number-pad"
    | "url";
  autoCapitalize?:
    | "none"
    | "sentences"
    | "words"
    | "characters";
  autoCorrect?: boolean;
  maxLength?: number;
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  testID,
  optional,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoCorrect = true,
  maxLength,
}: FormFieldProps) {
  const { colors, radius } = useTheme();

  return (
    <View>
      <FieldLabel
        label={label}
        optional={optional}
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error
              ? colors.error
              : colors.border,
            borderRadius: radius.lg,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            error
              ? colors.error
              : colors.onSurfaceTertiary
          }
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            colors.onSurfaceTertiary
          }
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          style={[
            styles.input,
            {
              color: colors.onSurface,
            },
          ]}
          testID={testID}
        />
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons
            name="alert-circle-outline"
            size={13}
            color={colors.error}
          />

          <Text
            style={[
              styles.errorText,
              {
                color: colors.error,
              },
            ]}
          >
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function FieldLabel({
  label,
  optional,
}: {
  label: string;
  optional?: boolean;
}) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.labelRow}>
      <Text
        style={[
          styles.fieldLabel,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.semibold,
          },
        ]}
      >
        {label}
      </Text>

      {optional ? (
        <Text
          style={[
            styles.optionalText,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
        >
          Opcional
        </Text>
      ) : null}
    </View>
  );
}

function normalizeHandle(handle: string) {
  const cleaned = handle
    .trim()
    .replace(/^@+/, "");

  return `@${cleaned}`;
}

function cleanGithub(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
}

function cleanLinkedin(value: string) {
  return value
    .trim()
    .replace(
      /^https?:\/\/(www\.)?linkedin\.com\/in\//i,
      "",
    )
    .replace(/^@/, "")
    .replace(/\/$/, "");
}

function isValidUrl(value: string) {
  const normalized = value.startsWith("http")
    ? value
    : `https://${value}`;

  try {
    const url = new URL(normalized);

    return Boolean(
      url.hostname && url.hostname.includes("."),
    );
  } catch {
    return false;
  }
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  headerTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },

  headerTitle: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.35,
  },

  headerSubtitle: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 14,
  },

  unsavedBadge: {
    minHeight: 23,
    paddingHorizontal: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  unsavedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  unsavedText: {
    fontSize: 8,
  },

  headerSaveButton: {
    minHeight: 40,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  headerSaveText: {
    fontSize: 11,
  },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 70,
  },

  content: {
    width: "100%",
    alignSelf: "center",
  },

  avatarCard: {
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },

  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarInitials: {
    fontSize: 28,
  },

  cameraButton: {
    position: "absolute",
    right: -2,
    bottom: 1,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarTextContent: {
    flex: 1,
    minWidth: 0,
  },

  avatarTitle: {
    fontSize: 15,
  },

  avatarDescription: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 15,
  },

  changePhotoButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    marginTop: 10,
    paddingHorizontal: 11,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  changePhotoText: {
    fontSize: 10,
  },

  formSection: {
    marginTop: 14,
    padding: 16,
    borderWidth: 1,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  sectionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 14,
    lineHeight: 19,
  },

  sectionDescription: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 15,
  },

  sectionFields: {
    marginTop: 18,
    gap: 16,
  },

  labelRow: {
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  fieldLabel: {
    fontSize: 11,
  },

  optionalText: {
    fontSize: 9,
  },

  inputContainer: {
    minHeight: 51,
    paddingHorizontal: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    fontSize: 12,
  },

  errorRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  errorText: {
    flex: 1,
    fontSize: 9,
  },

  textAreaContainer: {
    minHeight: 140,
    padding: 12,
    borderWidth: 1,
  },

  textArea: {
    minHeight: 100,
    padding: 0,
    fontSize: 12,
    lineHeight: 18,
  },

  characterCount: {
    marginTop: 6,
    fontSize: 9,
    textAlign: "right",
  },

  searchContainer: {
    minHeight: 51,
    paddingHorizontal: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 12,
  },

  selectedCompany: {
    minHeight: 68,
    padding: 11,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  companyLogo: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },

  companyOptionLogo: {
    width: 36,
    height: 36,
    borderRadius: 9,
  },

  companyInfo: {
    flex: 1,
    minWidth: 0,
  },

  companyName: {
    fontSize: 12,
  },

  companyIndustry: {
    marginTop: 2,
    fontSize: 9,
  },

  companyDropdown: {
    marginTop: 7,
    borderWidth: 1,
    overflow: "hidden",
  },

  companyOption: {
    minHeight: 60,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  emptyCompanies: {
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  emptyCompaniesText: {
    fontSize: 10,
  },

  skillInputContainer: {
    minHeight: 52,
    paddingLeft: 13,
    paddingRight: 5,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  skillInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 12,
  },

  addSkillButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  addSkillText: {
    fontSize: 9,
  },

  skillsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  skillChip: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  skillChipText: {
    fontSize: 10,
  },

  noSkillsText: {
    fontSize: 10,
  },

  saveButton: {
    minHeight: 54,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  saveButtonText: {
    fontSize: 13,
  },
});