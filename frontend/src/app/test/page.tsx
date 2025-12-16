'use client';

import { useEffect, useState, useRef } from 'react';
import { getWebSocketUrl } from '@/services/api';
import styles from './page.module.css';

type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export default function TestPage() {
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected');
  const [messages, setMessages] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const addMessage = (message: string) => {
    setMessages((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Get WebSocket URL and connect
    const initWebSocket = async () => {
      try {
        addMessage('Getting WebSocket URL...');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          addMessage('ERROR: NEXT_PUBLIC_API_URL not configured');
          return;
        }

        // Get WebSocket URL (using dummy gameId and playerId for test)
        const result = await getWebSocketUrl('TEST_GAME', 'test-player-1');
        const wsUrl = result.wsUrl;
        addMessage(`WebSocket URL obtained: ${wsUrl.substring(0, 60)}...`);

        // Connect directly with WebSocket API
        addMessage('Connecting to WebSocket...');
        setWsStatus('connecting');

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          addMessage('✅ WebSocket connected');
          setWsStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            addMessage(`📨 Received: ${JSON.stringify(data).substring(0, 300)}`);
          } catch (error) {
            addMessage(`📨 Received (raw): ${event.data.substring(0, 200)}`);
          }
        };

        ws.onerror = (error) => {
          addMessage(`❌ WebSocket error: ${error}`);
          setWsStatus('error');
        };

        ws.onclose = (event) => {
          addMessage(`❌ WebSocket closed: code=${event.code}, reason=${event.reason || 'none'}, wasClean=${event.wasClean}`);
          setWsStatus('disconnected');
        };
      } catch (error) {
        addMessage(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
        setWsStatus('error');
      }
    };

    initWebSocket();

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const sendTestMessage = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      addMessage('ERROR: WebSocket not connected');
      return;
    }

    try {
      addMessage('Sending test message (action: test)...');
      const message = JSON.stringify({
        action: 'test',
        gameId: 'TEST_GAME',
      });
      ws.send(message);
      addMessage('Test message sent');
    } catch (error) {
      addMessage(`ERROR sending message: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const sendSyncMessage = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      addMessage('ERROR: WebSocket not connected');
      return;
    }

    try {
      addMessage('Sending sync message (action: sync)...');
      const message = JSON.stringify({
        action: 'sync',
        gameId: 'TEST_GAME',
      });
      ws.send(message);
      addMessage('Sync message sent');
    } catch (error) {
      addMessage(`ERROR sending sync: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <main className={styles.container}>
      <h1>WebSocket Test Page</h1>
      
      <div className={styles.status}>
        <p>
          Status: <span className={styles[wsStatus]}>{wsStatus}</span>
        </p>
      </div>

      <div className={styles.actions}>
        <button onClick={sendTestMessage} disabled={wsStatus !== 'connected'}>
          Send Test Message (route: test)
        </button>
        <button onClick={sendSyncMessage} disabled={wsStatus !== 'connected'}>
          Send Sync Message (route: $default)
        </button>
      </div>

      <div className={styles.messages}>
        <h2>Messages Log</h2>
        <div className={styles.messagesList}>
          {messages.map((msg, idx) => (
            <div key={idx} className={styles.message}>
              {msg}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

