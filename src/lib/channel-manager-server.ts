import "server-only";

import {
  CHANNEL_PROVIDERS,
  ChannelProviderId,
  ChannelProviderRuntime,
} from "@/lib/channel-manager";

function getBridgeConfiguration() {
  return {
    url: process.env.KAIZER_CHANNEL_MANAGER_BRIDGE_URL?.replace(/\/$/, ""),
    token: process.env.KAIZER_CHANNEL_MANAGER_BRIDGE_TOKEN,
  };
}

export function getChannelProviderRuntime(): ChannelProviderRuntime[] {
  const bridge = getBridgeConfiguration();
  const productionConfigured = Boolean(bridge.url && bridge.token);

  return CHANNEL_PROVIDERS.map((provider) => ({
    ...provider,
    productionConfigured,
    connectionMethod: "APPROVED_BRIDGE" as const,
  }));
}

export async function forwardChannelOperation(
  providerId: ChannelProviderId,
  action: string,
  payload: unknown,
  transactionId: string
) {
  const bridge = getBridgeConfiguration();
  if (!bridge.url || !bridge.token) {
    return {
      ok: false as const,
      status: 409,
      body: {
        success: false,
        code: "PRODUCTION_ACCESS_REQUIRED",
        error:
          "The approved channel-manager bridge is not configured on the server.",
        transactionId,
      },
    };
  }

  try {
    const response = await fetch(
      `${bridge.url}/v1/channels/${providerId}/${action}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bridge.token}`,
          "Content-Type": "application/json",
          "X-Kaizer-Transaction-Id": transactionId,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      }
    );
    const result = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.status,
      body: {
        ...result,
        success: response.ok,
        source: "PRODUCTION",
        transactionId:
          response.headers.get("x-transaction-id") || transactionId,
      },
    };
  } catch (error) {
    return {
      ok: false as const,
      status: 502,
      body: {
        success: false,
        code: "CHANNEL_BRIDGE_UNAVAILABLE",
        error:
          error instanceof Error
            ? error.message
            : "The approved channel-manager bridge could not be reached.",
        transactionId,
      },
    };
  }
}
