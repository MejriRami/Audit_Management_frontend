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

  const connect = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `wss://audit-back.azurewebsites.net/ws/${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Send heartbeat every 30 seconds
      heartbeatInterval.current = window.setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send('ping');
        }
      }, 30000);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connection' || data.type === 'pong') {
        return; // Ignore connection/heartbeat messages
      }
      
      onMessage(data);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Clear heartbeat interval
      if (heartbeatInterval.current) {
        window.clearInterval(heartbeatInterval.current);
      }
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeout.current = window.setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 3000);
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
  }, []); // Empty dependency array

  return { isConnected };
}