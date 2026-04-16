export interface ChannelAccount {
  readonly id: string;
  readonly userId: string;
  readonly channel: "whatsapp" | "telegram";
  readonly channelAccountId: string | null;
  readonly accessToken: string | null;
  readonly metadata: Record<string, unknown>;
  readonly status: "active" | "inactive";
  readonly connectedAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateChannelAccountPayload {
  readonly channel: string;
  readonly accessToken: string;
  readonly metadata?: Record<string, unknown>;
}

export interface IChannelAccountService {
  list(): Promise<ChannelAccount[]>;
  create(payload: CreateChannelAccountPayload): Promise<ChannelAccount>;
  remove(id: string): Promise<void>;
}
