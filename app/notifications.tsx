import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NOTIFICATIONS } from "@/src/services/mock-data";
import { useTheme } from "@/src/theme/ThemeContext";

type NotificationFilter = "all" | "unread";

type NotificationItem = (typeof NOTIFICATIONS)[number];

const WEB_MAX_WIDTH = 920;
const WEB_BREAKPOINT = 768;

const timeAgo = (iso: string) => {
  const createdAt = new Date(iso);
  const timestamp = createdAt.getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const difference = Date.now() - timestamp;

  if (difference < 0) {
    return "agora";
  }

  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);
  const weeks = Math.floor(days / 7);

  if (minutes < 1) {
    return "agora";
  }

  if (minutes < 60) {
    return `${minutes}min atrás`;
  }

  if (hours < 24) {
    return `${hours}h atrás`;
  }

  if (days < 7) {
    return `${days}d atrás`;
  }

  if (weeks < 4) {
    return `${weeks}sem atrás`;
  }

  return createdAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
};

export default function Notifications() {
  const { colors, typography, radius } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === "web";
  const isDesktop = isWeb && width >= WEB_BREAKPOINT;

  const [activeFilter, setActiveFilter] =
    useState<NotificationFilter>("all");

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(() =>
      NOTIFICATIONS.map((notification) => ({
        ...notification,
      })),
    );

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.read,
      ).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter(
        (notification) => !notification.read,
      );
    }

    return notifications;
  }, [activeFilter, notifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  };

  const handleNotificationPress = (
    notification: NotificationItem,
  ) => {
    markAsRead(notification.id);

    /*
     * Caso suas notificações possuam uma rota,
     * você pode utilizar algo como:
     *
     * if (notification.route) {
     *   router.push(notification.route);
     * }
     */
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
      testID="notifications-screen"
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
        <NotificationsHeader
          unreadCount={unreadCount}
          onBack={() => router.back()}
          onMarkAllAsRead={markAllAsRead}
        />

        <View
          style={[
            styles.content,
            {
              paddingHorizontal: isDesktop ? 24 : 14,
            },
          ]}
        >
          <NotificationSummary
            total={notifications.length}
            unread={unreadCount}
          />

          <NotificationFilters
            activeFilter={activeFilter}
            unreadCount={unreadCount}
            onChange={setActiveFilter}
          />

          <FlatList
            data={filteredNotifications}
            keyExtractor={(notification) =>
              notification.id
            }
            renderItem={({ item }) => (
              <NotificationCard
                notification={item}
                onPress={() =>
                  handleNotificationPress(item)
                }
              />
            )}
            ItemSeparatorComponent={() => (
              <View style={styles.separator} />
            )}
            ListEmptyComponent={
              <EmptyNotifications
                filter={activeFilter}
              />
            }
            contentContainerStyle={[
              styles.listContent,
              filteredNotifications.length === 0 &&
                styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

type NotificationsHeaderProps = {
  unreadCount: number;
  onBack: () => void;
  onMarkAllAsRead: () => void;
};

function NotificationsHeader({
  unreadCount,
  onBack,
  onMarkAllAsRead,
}: NotificationsHeaderProps) {
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
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          testID="notif-back-button"
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
          <View style={styles.titleRow}>
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
              Notificações
            </Text>

            {unreadCount > 0 ? (
              <View
                style={[
                  styles.headerBadge,
                  {
                    backgroundColor:
                      colors.brandPrimary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.headerBadgeText,
                    {
                      color:
                        colors.onBrandPrimary,
                      fontWeight:
                        typography.weight.bold,
                    },
                  ]}
                >
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
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
            Acompanhe suas atividades recentes
          </Text>
        </View>
      </View>

      {unreadCount > 0 ? (
        <Pressable
          onPress={onMarkAllAsRead}
          hitSlop={6}
          style={({ pressed }) => [
            styles.markAllButton,
            {
              backgroundColor: `${colors.brandPrimary}12`,
              opacity: pressed ? 0.68 : 1,
            },
          ]}
          testID="notif-mark-all-button"
          accessibilityRole="button"
          accessibilityLabel="Marcar todas como lidas"
        >
          <Ionicons
            name="checkmark-done-outline"
            size={17}
            color={colors.brandPrimary}
          />

          <Text
            style={[
              styles.markAllText,
              {
                color: colors.brandPrimary,
                fontWeight:
                  typography.weight.bold,
              },
            ]}
          >
            Marcar como lidas
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type NotificationSummaryProps = {
  total: number;
  unread: number;
};

function NotificationSummary({
  total,
  unread,
}: NotificationSummaryProps) {
  const { colors, typography, radius } = useTheme();

  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor: `${colors.brandPrimary}14`,
          },
        ]}
      >
        <Ionicons
          name="notifications-outline"
          size={21}
          color={colors.brandPrimary}
        />
      </View>

      <View style={styles.summaryText}>
        <Text
          style={[
            styles.summaryTitle,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.bold,
            },
          ]}
        >
          Central de notificações
        </Text>

        <Text
          style={[
            styles.summaryDescription,
            {
              color: colors.onSurfaceSecondary,
            },
          ]}
        >
          {unread > 0
            ? `Você possui ${unread} ${
                unread === 1
                  ? "notificação não lida"
                  : "notificações não lidas"
              }.`
            : "Você está em dia com suas notificações."}
        </Text>
      </View>

      <View style={styles.summaryNumbers}>
        <Text
          style={[
            styles.summaryNumber,
            {
              color: colors.onSurface,
              fontWeight: typography.weight.heavy,
            },
          ]}
        >
          {total}
        </Text>

        <Text
          style={[
            styles.summaryNumberLabel,
            {
              color: colors.onSurfaceTertiary,
            },
          ]}
        >
          no total
        </Text>
      </View>
    </View>
  );
}

type NotificationFiltersProps = {
  activeFilter: NotificationFilter;
  unreadCount: number;
  onChange: (filter: NotificationFilter) => void;
};

function NotificationFilters({
  activeFilter,
  unreadCount,
  onChange,
}: NotificationFiltersProps) {
  const { colors, typography, radius } = useTheme();

  return (
    <View style={styles.filterSection}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.bold,
          },
        ]}
      >
        Atividades recentes
      </Text>

      <View
        style={[
          styles.filters,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
            borderRadius: radius.pill,
          },
        ]}
      >
        <FilterButton
          title="Todas"
          active={activeFilter === "all"}
          onPress={() => onChange("all")}
        />

        <FilterButton
          title="Não lidas"
          count={unreadCount}
          active={activeFilter === "unread"}
          onPress={() => onChange("unread")}
        />
      </View>
    </View>
  );
}

type FilterButtonProps = {
  title: string;
  count?: number;
  active: boolean;
  onPress: () => void;
};

function FilterButton({
  title,
  count,
  active,
  onPress,
}: FilterButtonProps) {
  const { colors, typography } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterButton,
        {
          backgroundColor: active
            ? colors.brandPrimary
            : "transparent",
          opacity: pressed ? 0.75 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{
        selected: active,
      }}
    >
      <Text
        style={[
          styles.filterButtonText,
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

      {typeof count === "number" && count > 0 ? (
        <View
          style={[
            styles.filterCount,
            {
              backgroundColor: active
                ? "rgba(255,255,255,0.22)"
                : `${colors.brandPrimary}14`,
            },
          ]}
        >
          <Text
            style={[
              styles.filterCountText,
              {
                color: active
                  ? colors.onBrandPrimary
                  : colors.brandPrimary,
                fontWeight:
                  typography.weight.bold,
              },
            ]}
          >
            {count > 99 ? "99+" : count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

type NotificationCardProps = {
  notification: NotificationItem;
  onPress: () => void;
};

function NotificationCard({
  notification,
  onPress,
}: NotificationCardProps) {
  const { colors, typography, radius } = useTheme();

  const isUnread = !notification.read;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.notificationCard,
        {
          backgroundColor: isUnread
            ? `${colors.brandPrimary}08`
            : colors.surfaceSecondary,
          borderColor: isUnread
            ? `${colors.brandPrimary}35`
            : colors.border,
          borderRadius: radius.lg,
          opacity: pressed ? 0.76 : 1,
          transform: [
            {
              scale: pressed ? 0.994 : 1,
            },
          ],
        },
      ]}
      testID={`notif-${notification.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.body}`}
      accessibilityHint={
        isUnread
          ? "Toque para marcar como lida"
          : "Abrir notificação"
      }
    >
      {isUnread ? (
        <View
          style={[
            styles.unreadIndicator,
            {
              backgroundColor: colors.brandPrimary,
            },
          ]}
        />
      ) : null}

      <View
        style={[
          styles.notificationIcon,
          {
            backgroundColor: isUnread
              ? `${colors.brandPrimary}16`
              : colors.surfaceTertiary,
          },
        ]}
      >
        <Ionicons
          name={
            notification.icon as keyof typeof Ionicons.glyphMap
          }
          size={20}
          color={
            isUnread
              ? colors.brandPrimary
              : colors.onSurfaceTertiary
          }
        />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationTitleRow}>
          <Text
            numberOfLines={2}
            style={[
              styles.notificationTitle,
              {
                color: colors.onSurface,
                fontWeight: isUnread
                  ? typography.weight.bold
                  : typography.weight.semibold,
              },
            ]}
          >
            {notification.title}
          </Text>

          <Text
            style={[
              styles.notificationTime,
              {
                color: isUnread
                  ? colors.brandPrimary
                  : colors.onSurfaceTertiary,
                fontWeight: isUnread
                  ? typography.weight.semibold
                  : typography.weight.regular,
              },
            ]}
          >
            {timeAgo(notification.createdAt)}
          </Text>
        </View>

        <Text
          numberOfLines={3}
          style={[
            styles.notificationBody,
            {
              color: colors.onSurfaceSecondary,
            },
          ]}
        >
          {notification.body}
        </Text>

        <View style={styles.notificationFooter}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isUnread
                  ? `${colors.brandPrimary}12`
                  : colors.surfaceTertiary,
              },
            ]}
          >
            <Ionicons
              name={
                isUnread
                  ? "ellipse"
                  : "checkmark-circle-outline"
              }
              size={10}
              color={
                isUnread
                  ? colors.brandPrimary
                  : colors.onSurfaceTertiary
              }
            />

            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: isUnread
                    ? colors.brandPrimary
                    : colors.onSurfaceTertiary,
                  fontWeight:
                    typography.weight.semibold,
                },
              ]}
            >
              {isUnread ? "Nova" : "Lida"}
            </Text>
          </View>

          <View style={styles.openAction}>
            <Text
              style={[
                styles.openActionText,
                {
                  color: colors.onSurfaceTertiary,
                  fontWeight:
                    typography.weight.medium,
                },
              ]}
            >
              Ver detalhes
            </Text>

            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.onSurfaceTertiary}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyNotifications({
  filter,
}: {
  filter: NotificationFilter;
}) {
  const { colors, typography, radius } = useTheme();

  const isUnreadFilter = filter === "unread";

  return (
    <View
      style={[
        styles.emptyState,
        {
          backgroundColor: colors.surfaceSecondary,
          borderColor: colors.border,
          borderRadius: radius.lg,
        },
      ]}
    >
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: `${colors.brandPrimary}12`,
          },
        ]}
      >
        <Ionicons
          name={
            isUnreadFilter
              ? "checkmark-done-outline"
              : "notifications-off-outline"
          }
          size={30}
          color={colors.brandPrimary}
        />
      </View>

      <Text
        style={[
          styles.emptyTitle,
          {
            color: colors.onSurface,
            fontWeight: typography.weight.bold,
          },
        ]}
      >
        {isUnreadFilter
          ? "Tudo lido por aqui"
          : "Nenhuma notificação"}
      </Text>

      <Text
        style={[
          styles.emptyDescription,
          {
            color: colors.onSurfaceSecondary,
          },
        ]}
      >
        {isUnreadFilter
          ? "Você não possui notificações pendentes no momento."
          : "Quando houver alguma novidade, ela aparecerá nesta tela."}
      </Text>
    </View>
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
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  headerTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerTitle: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.4,
  },

  headerBadge: {
    minWidth: 23,
    height: 23,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  headerBadgeText: {
    fontSize: 10,
  },

  headerSubtitle: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 14,
  },

  markAllButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  markAllText: {
    fontSize: 11,
  },

  content: {
    flex: 1,
    paddingTop: 16,
  },

  summaryCard: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  summaryText: {
    flex: 1,
    minWidth: 0,
  },

  summaryTitle: {
    fontSize: 14,
    lineHeight: 19,
  },

  summaryDescription: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
  },

  summaryNumbers: {
    alignItems: "flex-end",
    flexShrink: 0,
  },

  summaryNumber: {
    fontSize: 23,
    lineHeight: 26,
  },

  summaryNumberLabel: {
    fontSize: 9,
    lineHeight: 12,
  },

  filterSection: {
    marginTop: 18,
    marginBottom: 12,
  },

  sectionTitle: {
    marginBottom: 9,
    fontSize: 14,
    lineHeight: 19,
  },

  filters: {
    alignSelf: "flex-start",
    padding: 3,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  filterButton: {
    minHeight: 35,
    paddingHorizontal: 13,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  filterButtonText: {
    fontSize: 11,
  },

  filterCount: {
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  filterCountText: {
    fontSize: 8,
  },

  listContent: {
    paddingBottom: 120,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  separator: {
    height: 9,
  },

  notificationCard: {
    position: "relative",
    width: "100%",
    minHeight: 116,
    padding: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    overflow: "hidden",
  },

  unreadIndicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 3,
  },

  notificationIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  notificationContent: {
    flex: 1,
    minWidth: 0,
  },

  notificationTitleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  notificationTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  notificationTime: {
    marginTop: 1,
    fontSize: 9,
    lineHeight: 13,
    flexShrink: 0,
  },

  notificationBody: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
  },

  notificationFooter: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  statusBadge: {
    minHeight: 23,
    paddingHorizontal: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statusBadgeText: {
    fontSize: 8,
  },

  openAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  openActionText: {
    fontSize: 9,
  },

  emptyState: {
    minHeight: 280,
    marginTop: 10,
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 360,
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
});