import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TIMES, CACHE_TAGS } from "@/lib/cache-config";
import type {
  ChannelAccount,
  CreateChannelAccountPayload,
  IChannelAccountService,
} from "./interfaces/channel-account-service";

class ChannelAccountService implements IChannelAccountService {
  /**
   * List all connected channel accounts for the current user.
   * @returns Array of channel accounts
   * @throws Error if the request fails
   */
  async list(): Promise<ChannelAccount[]> {
    const response = await authFetch("/channel-accounts", {
      revalidate: CACHE_TIMES.channels,
      tags: [CACHE_TAGS.channels],
    });
    return unwrapEnvelope<ChannelAccount[]>(response);
  }

  /**
   * Connect a new channel account.
   * @param payload - Channel type and access token
   * @returns The created channel account
   * @throws Error if validation fails or request fails
   */
  async create(payload: CreateChannelAccountPayload): Promise<ChannelAccount> {
    const response = await authFetch("/channel-accounts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<ChannelAccount>(response);
  }

  /**
   * Disconnect a channel account.
   * @param id - The channel account ID
   * @throws Error if the request fails
   */
  async remove(id: string): Promise<void> {
    const response = await authFetch(`/channel-accounts/${id}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }
}

export const channelAccountService = new ChannelAccountService();
