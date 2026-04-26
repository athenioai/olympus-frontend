import { counter } from "./observability/sentry-metrics";

export type WsState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

type EventHandler = (payload: Record<string, unknown>) => void;
type StateChangeHandler = (state: WsState) => void;

interface WsManagerOptions {
  readonly url: string;
  readonly token: string;
  readonly onStateChange?: StateChangeHandler;
}

const MAX_RECONNECT_DELAY_MS = 30_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;

/**
 * Generic WebSocket manager. Consumers `register(type, handler)` after
 * construction (and `unregister` on cleanup). Incoming messages with shape
 * `{ type: string, ... }` are routed to the registered handler; unknown types
 * are ignored. Messages without a string `type` field are dropped.
 */
export class WsManager {
  private ws: WebSocket | null = null;
  private currentState: WsState = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private readonly handlers = new Map<string, EventHandler>();

  private readonly url: string;
  private readonly token: string;
  private readonly onStateChange: StateChangeHandler | undefined;

  constructor(options: WsManagerOptions) {
    this.url = options.url;
    this.token = options.token;
    this.onStateChange = options.onStateChange;
  }

  /**
   * Current WebSocket connection state.
   */
  get state(): WsState {
    return this.currentState;
  }

  /**
   * Register a handler for a specific event type.
   * @param type - The event type string to listen for
   * @param handler - Callback receiving the full envelope as Record
   */
  register(type: string, handler: EventHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Remove a previously registered handler for an event type.
   * @param type - The event type string to stop listening for
   */
  unregister(type: string): void {
    this.handlers.delete(type);
  }

  /**
   * Open the WebSocket connection.
   * If already connected or connecting, this is a no-op.
   */
  connect(): void {
    if (this.ws && this.currentState !== "disconnected") return;

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
        const payload = JSON.parse(String(event.data)) as unknown;
        if (!payload || typeof payload !== "object") return;
        const envelope = payload as Record<string, unknown>;
        const type = envelope.type;
        if (typeof type !== "string") return;
        const handler = this.handlers.get(type);
        if (handler) handler(envelope);
      } catch {
        // ping/pong frames or malformed JSON — silently ignored
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
