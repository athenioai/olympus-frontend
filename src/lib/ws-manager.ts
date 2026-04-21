import type { ChatMessage } from "./services/interfaces/chat-service";
import { counter } from "./observability/sentry-metrics";

export type WsState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

type MessageHandler = (message: ChatMessage) => void;
type StateChangeHandler = (state: WsState) => void;

interface WsManagerOptions {
  readonly url: string;
  readonly token: string;
  readonly onMessage: MessageHandler;
  readonly onStateChange?: StateChangeHandler;
}

const MAX_RECONNECT_DELAY_MS = 30_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;

/**
 * Client-side WebSocket manager for real-time chat messages.
 * Handles connection lifecycle, auth, and auto-reconnect with exponential backoff.
 */
export class WsManager {
  private ws: WebSocket | null = null;
  private currentState: WsState = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  private readonly url: string;
  private readonly token: string;
  private readonly onMessage: MessageHandler;
  private readonly onStateChange: StateChangeHandler | undefined;

  constructor(options: WsManagerOptions) {
    this.url = options.url;
    this.token = options.token;
    this.onMessage = options.onMessage;
    this.onStateChange = options.onStateChange;
  }

  /**
   * Current WebSocket connection state.
   */
  get state(): WsState {
    return this.currentState;
  }

  /**
   * Open the WebSocket connection.
   * If already connected or connecting, this is a no-op.
   */
  connect(): void {
    if (this.ws && this.currentState !== "disconnected") {
      return;
    }

    this.intentionalClose = false;
    this.setState("connecting");

    const separator = this.url.includes("?") ? "&" : "?";
    const wsUrl = `${this.url}${separator}token=${encodeURIComponent(this.token)}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setState("connected");
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: ChatMessage = JSON.parse(String(event.data));
        this.onMessage(message);
      } catch {
        // Ignore non-JSON messages (e.g. ping/pong frames)
      }
    };

    this.ws.onclose = () => {
      this.ws = null;

      if (this.intentionalClose) {
        this.setState("disconnected");
        return;
      }

      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror, so reconnect is handled there
    };
  }

  /**
   * Close the WebSocket connection and stop reconnection attempts.
   */
  disconnect(): void {
    this.intentionalClose = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    this.setState("disconnected");
  }

  /**
   * Send a raw string message through the WebSocket.
   * @param data - The string payload to send
   * @throws Error if the WebSocket is not connected
   */
  send(data: string): void {
    if (!this.ws || this.currentState !== "connected") {
      throw new Error("WebSocket is not connected");
    }

    this.ws.send(data);
  }

  private setState(newState: WsState): void {
    if (this.currentState === newState) return;
    this.currentState = newState;
    counter("chat.ws_state_change", 1, { attributes: { state: newState } });
    this.onStateChange?.(newState);
  }

  private scheduleReconnect(): void {
    this.setState("reconnecting");

    const delay = Math.min(
      INITIAL_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY_MS,
    );

    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}
