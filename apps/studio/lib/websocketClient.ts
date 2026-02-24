'use client';

import type { SignalingMessage } from '@/lib/types';

type MessageHandler = (message: SignalingMessage) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Error) => void;

interface WebSocketClientOptions {
  url: string;
  token?: string; // for guest authentication
  onMessage?: MessageHandler;
  onConnect?: ConnectionHandler;
  onDisconnect?: ConnectionHandler;
  onError?: ErrorHandler;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token?: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private messageQueue: string[] = [];

  // event handlers
  private onMessageHandler?: MessageHandler;
  private onConnectHandler?: ConnectionHandler;
  private onDisconnectHandler?: ConnectionHandler;
  private onErrorHandler?: ErrorHandler;

  // connection state
  public isConnected = false;
  public clientId: string | null = null;

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.token = options.token;
    this.onMessageHandler = options.onMessage;
    this.onConnectHandler = options.onConnect;
    this.onDisconnectHandler = options.onDisconnect;
    this.onErrorHandler = options.onError;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
  }

  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected');
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      // add token to URL if guest
      const wsUrl = this.token
        ? `${this.url}?token=${this.token}`
        : this.url;

      console.log('[WS] Connecting to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('[WS] Connection error:', error);
      this.handleError(error as Event);
    }
  }

  public disconnect(): void {
    console.log('[WS] Disconnecting...');
    this.isIntentionallyClosed = true;
    this.clearReconnectTimeout();
    this.clearPingInterval();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isConnected = false;
  }

  public send(message: SignalingMessage): void {
    const data = JSON.stringify(message);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
      console.log('[WS] Sent:', message.type);
    } else {
      console.warn('[WS] Not connected, queuing message:', message.type);
      this.messageQueue.push(data);
    }
  }

  public joinSession(sessionId: string, isHost: boolean = false, userName?: string): void {
    this.send({
      type: 'join-session',
      data: { sessionId, isHost, userName },
      timestamp: Date.now(),
    });
  }

  public leaveSession(): void {
    this.send({
      type: 'leave-session',
      timestamp: Date.now(),
    });
  }

  public startRecording(sessionId: string, recordingId: string, hostUserId: string): void {
    this.send({
      type: 'start-recording',
      data: { sessionId, recordingId, hostUserId },
      timestamp: Date.now(),
    });
  }

  public stopRecording(sessionId: string, recordingId: string, hostUserId?: string): void {
    this.send({
      type: 'stop-recording',
      data: { sessionId, recordingId, hostUserId },
      timestamp: Date.now(),
    });
  }

  public sendOffer(to: string, offer: RTCSessionDescriptionInit): void {
    this.send({
      type: 'offer',
      to,
      data: offer,
      timestamp: Date.now(),
    });
  }

  public sendAnswer(to: string, answer: RTCSessionDescriptionInit): void {
    this.send({
      type: 'answer',
      to,
      data: answer,
      timestamp: Date.now(),
    });
  }

  public sendIceCandidate(to: string, candidate: RTCIceCandidateInit): void {
    this.send({
      type: 'ice-candidate',
      to,
      data: candidate,
      timestamp: Date.now(),
    });
  }

  public setMessageHandler(handler: MessageHandler): void {
    this.onMessageHandler = handler;
  }

  // private methods

  private handleOpen(): void {
    console.log('[WS] Connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;

    this.startPingInterval();

    this.flushMessageQueue();

    this.onConnectHandler?.();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: SignalingMessage = JSON.parse(event.data);
      console.log('[WS] Received:', message.type);

      // store client ID from session-update
      if (message.type === 'session-update' && message.data?.clientId) {
        this.clientId = message.data.clientId;
        console.log('[WS] Client ID:', this.clientId);
      }

      // call message handler
      this.onMessageHandler?.(message);
    } catch (error) {
      console.error('[WS] Failed to parse message:', error);
    }
  }

  private handleError(event: Event): void {
    console.error('[WS] Error:', event);
  }

  private handleClose(event: CloseEvent): void {
    console.log('[WS] Disconnected:', event.code, event.reason);
    this.isConnected = false;
    this.clearPingInterval();

    // call disconnect handler
    this.onDisconnectHandler?.();

    // attempt reconnection if not intentionally closed
    if (!this.isIntentionallyClosed) {
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnection attempts reached');
      const error = new Error('Failed to reconnect to WebSocket server');
      this.onErrorHandler?.(error);
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[WS] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  private startPingInterval(): void {
    this.clearPingInterval();

    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          timestamp: Date.now(),
        });
      }
    }, 30000);
  }

  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const data = this.messageQueue.shift();
      if (data) {
        this.ws.send(data);
      }
    }
  }
}