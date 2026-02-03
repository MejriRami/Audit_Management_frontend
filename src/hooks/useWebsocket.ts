import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
  read: boolean;
  created_at: string;
}

export function useWebSocket(onMessage: (message: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | undefined>(undefined);
  const heartbeatInterval = useRef<number | undefined>(undefined);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const getWebSocketUrl = (): string => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/';

    // Replace http -> ws, https -> wss automatically
    const wsBase = apiUrl.replace(/^https/, 'wss').replace(/^http/, 'ws');

    // Remove trailing slash so we don't get double slash
    const cleanBase = wsBase.replace(/\/+$/, '');

    // Final URL:
    //   ws://localhost:8000/ws/TOKEN
    //   wss://audit-back.azurewebsites.net/ws/TOKEN
    return `${cleanBase}/ws/${token}`;
  };

  const connect = () => {
    // Don't open a new connection if one is already open or connecting
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    let url: string;
    try {
      url = getWebSocketUrl();
    } catch (e) {
      console.error('Cannot connect WebSocket:', e);
      return;
    }

    console.log('Connecting to:', url);
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0; // Reset on successful connection

      // Send heartbeat every 30 seconds
      heartbeatInterval.current = window.setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send('ping');
        }
      }, 30000);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connection' || data.type === 'pong') {
          return; 
        }

        onMessage(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Close it so onclose fires and triggers reconnect
      ws.current?.close();
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
      setIsConnected(false);

      // Clear heartbeat
      if (heartbeatInterval.current) {
        window.clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = undefined;
      }

      // 1008 = token invalid/expired — don't retry
      if (event.code === 1008) {
        console.warn('WebSocket closed: invalid or expired token. Not reconnecting.');
        return;
      }

      // Exponential backoff reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // caps at 30s
        reconnectAttempts.current++;
        console.log(`Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);

        reconnectTimeout.current = window.setTimeout(() => {
          connect();
        }, delay);
      } else {
        console.error('Max reconnection attempts reached.');
      }
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        window.clearTimeout(reconnectTimeout.current);
      }
      if (heartbeatInterval.current) {
        window.clearInterval(heartbeatInterval.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { isConnected };
}