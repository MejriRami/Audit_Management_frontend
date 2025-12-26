let globalSSEStarted = false;

import { useState, useEffect, useCallback, useRef } from "react";
import type { NotificationItem } from "../types";

interface UseSSENotificationsConfig {
  apiBaseUrl: string;
  authToken: string;
  onNotification?: (notification: NotificationItem) => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number; 
  maxReconnectAttempts?: number;
  streamPath?: string; 
}

interface UseSSENotificationsReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  isConnected: boolean;
  isReconnecting: boolean;
  error: Error | null;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  reconnect: () => void;
}

type ParsedSSE = { event?: string; data?: string; id?: string };

function splitSSE(buffer: string) {
  const parts = buffer.split("\n\n");
  return { blocks: parts.slice(0, -1), rest: parts[parts.length - 1] };
}

function parseSSEBlock(block: string): ParsedSSE | null {
  const lines = block.split("\n");
  let event: string | undefined;
  let id: string | undefined;
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(":")) continue; 
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("id:")) id = line.slice(3).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }

  if (!event && dataLines.length === 0) return null;
  return { event, id, data: dataLines.join("\n") };
}

function safeJsonParse<T = any>(raw?: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeBaseUrl(apiBaseUrl: string) {
  return apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
}

export const useSSENotifications = ({
  apiBaseUrl,
  authToken,
  onNotification,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  streamPath = "/notifications/stream",
}: UseSSENotificationsConfig): UseSSENotificationsReturn => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const isMountedRef = useRef(true);
  const connectingRef = useRef(false);

  const cleanupConnection = useCallback(() => {
    // stop any scheduled reconnect
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;

    // then cancel reader
    readerRef.current?.cancel().catch(() => {});
    readerRef.current = null;
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!authToken) return;

    try {
      const base = normalizeBaseUrl(apiBaseUrl);
      const res = await fetch(`${base}/notifications/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch notifications (${res.status})`);
      const data = await res.json();
      if (!isMountedRef.current) return;

      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Unknown error");
      if (!isMountedRef.current) return;
      setError(e);
      onError?.(e);
    }
  }, [apiBaseUrl, authToken, onError]);

  const markAsRead = useCallback(
    async (notificationId: number) => {
      if (!authToken) return;
      try {
        const base = normalizeBaseUrl(apiBaseUrl);
        const res = await fetch(`${base}/notifications/${notificationId}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error(`Failed to mark as read (${res.status})`);

        if (!isMountedRef.current) return;
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Unknown error");
        onError?.(e);
      }
    },
    [apiBaseUrl, authToken, onError]
  );

  const markAllAsRead = useCallback(async () => {
    if (!authToken) return;

    try {
      const base = normalizeBaseUrl(apiBaseUrl);
      const res = await fetch(`${base}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error(`Failed to mark all read (${res.status})`);

      if (!isMountedRef.current) return;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Unknown error");
      onError?.(e);
    }
  }, [apiBaseUrl, authToken, onError]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) return;

    reconnectAttemptsRef.current += 1;
    setIsReconnecting(true);

    const baseDelay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current - 1);
    const capped = Math.min(30000, baseDelay);
    const jitter = 0.8 + Math.random() * 0.4;
    const delay = Math.round(capped * jitter);

    reconnectTimeoutRef.current = window.setTimeout(() => {
      if (isMountedRef.current) startStream();
    }, delay);
  }, [maxReconnectAttempts, reconnectInterval]);

  const startStream = useCallback(async () => {
    // One connection at a time
    if (connectingRef.current) return;
    connectingRef.current = true;

    if (abortRef.current || readerRef.current) {
      connectingRef.current = false;
      return;
    }

    if (!authToken) {
      const e = new Error("No auth token (cannot connect SSE)");
      setError(e);
      onError?.(e);
      connectingRef.current = false;
      return;
    }

    cleanupConnection();
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const base = normalizeBaseUrl(apiBaseUrl);
    const url = `${base}${streamPath}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "text/event-stream",
        },
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(`Unauthorized (${res.status})`);
      }
      if (!res.ok) throw new Error(`SSE HTTP error ${res.status}`);
      if (!res.body) throw new Error("SSE no body");

      setIsConnected(true);
      setIsReconnecting(false);
      reconnectAttemptsRef.current = 0;

      const reader = res.body.getReader();
      readerRef.current = reader;

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (isMountedRef.current) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { blocks, rest } = splitSSE(buffer);
        buffer = rest;

        for (const block of blocks) {
          const parsed = parseSSEBlock(block);
          if (!parsed) continue;

          const eventName = parsed.event ?? "message";
          const payload = safeJsonParse<any>(parsed.data);

          if (eventName === "connected") continue;

          if (eventName === "notification") {
            const notif = payload as NotificationItem | null;
            if (!notif || typeof notif.id !== "number") continue;

            if (!isMountedRef.current) continue;
            setNotifications((prev) => [notif, ...prev]);
            setUnreadCount((prev) => prev + 1);
            onNotification?.(notif);
            continue;
          }

          if (eventName === "error") {
            const msg = payload?.message ?? "SSE error";
            const e = new Error(msg);
            setError(e);
            onError?.(e);
          }
        }
      }

      if (!isMountedRef.current) return;
      setIsConnected(false);
      scheduleReconnect();
    } catch (err) {
      if (!isMountedRef.current) return;

      if ((err as any)?.name === "AbortError") return;

      setIsConnected(false);
      const e = err instanceof Error ? err : new Error("SSE failed");

      if (e.message.includes("Unauthorized")) {
        setError(e);
        setIsReconnecting(false);
        onError?.(e);
        return;
      }

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        scheduleReconnect();
      } else {
        setError(e);
        setIsReconnecting(false);
        onError?.(e);
      }
    } finally {
      connectingRef.current = false;
    }
  }, [
    apiBaseUrl,
    authToken,
    cleanupConnection,
    maxReconnectAttempts,
    onError,
    onNotification,
    scheduleReconnect,
    streamPath,
  ]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    cleanupConnection();
    setIsConnected(false);
    setIsReconnecting(false);
    startStream();
  }, [cleanupConnection, startStream]);

useEffect(() => {
  isMountedRef.current = true;

  if (authToken && !globalSSEStarted) {
    globalSSEStarted = true;   // ✅ only once per page load
    fetchNotifications();
    startStream();
  }

  return () => {
    isMountedRef.current = false;
    cleanupConnection();
   
  };
}, [authToken, fetchNotifications, startStream, cleanupConnection]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        cleanupConnection();
        setIsConnected(false);
        setIsReconnecting(false);
      } else {
        if (authToken) reconnect();
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [authToken, reconnect, cleanupConnection]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isReconnecting,
    error,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    reconnect,
  };
};
