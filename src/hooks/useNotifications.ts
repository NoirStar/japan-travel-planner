import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchNotifications, markNotificationsRead } from "@/lib/notificationService"
import {
  getMockNotifications,
  markNotificationsRead as markMockNotificationsRead,
  mockNotificationsChangedEvent,
} from "@/lib/mockCommunity"
import { supabase } from "@/lib/supabase"
import type { Notification } from "@/types/community"

export function useNotifications(userId: string | null, useMock: boolean) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      return
    }

    setIsLoading(true)
    try {
      if (useMock) {
        setNotifications(getMockNotifications(userId).slice(0, 20))
      } else {
        setNotifications(await fetchNotifications(userId, 20))
      }
    } catch (error) {
      console.error("알림 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, useMock])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const markAllRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return

    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    try {
      if (useMock) {
        markMockNotificationsRead(userId)
      } else {
        await markNotificationsRead(userId)
      }
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error)
      void refresh()
    }
  }, [refresh, unreadCount, userId, useMock])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!userId) return

    if (useMock) {
      const handleMockUpdate = () => {
        void refresh()
      }
      window.addEventListener(mockNotificationsChangedEvent, handleMockUpdate)
      return () => window.removeEventListener(mockNotificationsChangedEvent, handleMockUpdate)
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes" as "system",
        {
          event: "*",
          filter: `user_id=eq.${userId}`,
          schema: "public",
          table: "notifications",
        } as Record<string, string>,
        () => {
          void refresh()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refresh, userId, useMock])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAllRead,
    refresh,
  }
}
