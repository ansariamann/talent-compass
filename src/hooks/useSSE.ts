import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SSEEvent {
  type: string;
  payload: unknown;
  timestamp: string;
}

interface UseSSEOptions {
  enabled?: boolean;
  onEvent?: (event: SSEEvent) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useSSE(options: UseSSEOptions = {}) {
  const {
    enabled = true,
    onEvent,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const eventSource = new EventSource(`${apiBase}/events/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      console.log('[SSE] Connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        setLastEvent(data);
        onEvent?.(data);

        // Invalidate relevant queries based on event type
        switch (data.type) {
          case 'candidate_updated':
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
            break;
          case 'application_updated':
          case 'status_changed':
            queryClient.invalidateQueries({ queryKey: ['applications'] });
            break;
          case 'new_application':
            queryClient.invalidateQueries({ queryKey: ['applications'] });
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
            break;
        }
      } catch (e) {
        console.error('[SSE] Failed to parse event:', e);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        console.log(
          `[SSE] Reconnecting... attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`
        );
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      } else {
        console.error('[SSE] Max reconnect attempts reached');
      }
    };
  }, [onEvent, queryClient, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    reconnect: connect,
    disconnect,
  };
}
