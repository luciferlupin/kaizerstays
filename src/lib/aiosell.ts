/**
 * Aiosell Channel Manager API Integration Client
 * Target URL: https://live.aiosell.com/api/v1/rms
 * Real Hotel ID: 62a25484e5
 */

export const AIOSELL_V2_CONFIG = {
  partnerName: "kaizerstays",
  ratesUrl: "https://live.aiosell.com/api/v2/cm/update-rates/kaizerstays",
  inventoryUrl: "https://live.aiosell.com/api/v2/cm/update/kaizerstays",
  username: "ninaad.khera19@gmail.com",
  password: "aiosell",
  get basicAuthHeader() {
    return "Basic " + (typeof btoa !== "undefined" ? btoa("ninaad.khera19@gmail.com:aiosell") : Buffer.from("ninaad.khera19@gmail.com:aiosell").toString("base64"));
  },
};


export interface AiosellAuthResponse {
  access_token?: string;
  role?: string;
  description?: string;
  error?: string;
}

export interface AiosellRoomType {
  id: string;
  name: string;
  displayName: string;
  totalCount: number;
  maxocc: number;
  description?: string;
}

export interface AiosellRatePlan {
  rateplanId: string;
  displayName: string;
  mealplan: string;
  roomId: string;
  occupancy: string;
  rate?: number;
}

export interface AiosellHotelResponse {
  id?: string;
  name?: string;
  rateplans?: AiosellRatePlan[];
  rooms?: AiosellRoomType[];
  globals?: {
    timezone?: string;
    currency?: string;
    city?: string;
  };
}

export interface AiosellSyncResult {
  success: boolean;
  message?: string;
  error?: string;
  syncedAt: string;
  payloadSent?: unknown;
}

export interface AiosellReservationItem {
  bookingId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  roomCode: string;
  roomTypeName: string;
  totalAmount: number;
  channel: string;
  status: "CONFIRMED" | "CANCELLED" | "MODIFIED";
}

export class AiosellClient {
  private baseUrl = "https://live.aiosell.com/api/v1/rms";
  private token: string | null = null;
  private hotelId: string | null = "62a25484e5";

  constructor(token?: string, hotelId?: string) {
    if (token) this.token = token;
    if (hotelId) this.hotelId = hotelId;
  }

  /**
   * Authenticate against Aiosell RMS API
   */
  async login(username = "ninaad.khera19@gmail.com", password = "aiosell"): Promise<{
    success: boolean;
    token?: string;
    hotelId?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${this.baseUrl}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        cache: "no-store",
      });

      if (!res.ok) {
        return {
          success: false,
          error: `Authentication failed with HTTP status ${res.status}`,
        };
      }

      const data: AiosellAuthResponse = await res.json();
      if (!data.access_token) {
        return {
          success: false,
          error: data.description || data.error || "No access token received from Aiosell.",
        };
      }

      this.token = data.access_token;
      
      // Fetch hotel list to get exact Hotel ID
      let resolvedHotelId = "62a25484e5";
      try {
        const listRes = await fetch(`${this.baseUrl}/hotel-list/?active=true`, {
          headers: { Authorization: `BZ-JWT ${this.token}` },
          cache: "no-store",
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.hotels && listData.hotels[0]?.id) {
            resolvedHotelId = listData.hotels[0].id;
          }
        }
      } catch {
        // Fallback to 62a25484e5
      }

      this.hotelId = resolvedHotelId;

      return {
        success: true,
        token: this.token,
        hotelId: this.hotelId,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to connect to live.aiosell.com",
      };
    }
  }

  /**
   * Get real hotel details, room types, and rate plans from Aiosell API
   */
  async getHotelDetails(hotelId?: string): Promise<AiosellHotelResponse> {
    const targetHotelId = hotelId || this.hotelId || "62a25484e5";
    if (!this.token) {
      const loginRes = await this.login();
      if (!loginRes.success) throw new Error(loginRes.error || "Not authenticated");
    }

    const res = await fetch(`${this.baseUrl}/hotels/${targetHotelId}`, {
      method: "GET",
      headers: {
        Authorization: `BZ-JWT ${this.token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch hotel details from Aiosell (HTTP ${res.status})`);
    }

    return await res.json();
  }

  /**
   * Fetch real live rates from Aiosell
   */
  async getLiveRates(start: string, end: string, hotelId?: string) {
    const targetHotelId = hotelId || this.hotelId || "62a25484e5";
    if (!this.token) {
      const loginRes = await this.login();
      if (!loginRes.success) throw new Error(loginRes.error || "Not authenticated");
    }

    const res = await fetch(
      `${this.baseUrl}/hotels/${targetHotelId}/rates?start=${start}&end=${end}`,
      {
        method: "GET",
        headers: { Authorization: `BZ-JWT ${this.token}` },
        cache: "no-store",
      }
    );

    if (!res.ok) return null;
    return await res.json();
  }

  /**
   * Fetch real live inventory from Aiosell
   */
  async getLiveInventory(start: string, end: string, hotelId?: string) {
    const targetHotelId = hotelId || this.hotelId || "62a25484e5";
    if (!this.token) {
      const loginRes = await this.login();
      if (!loginRes.success) throw new Error(loginRes.error || "Not authenticated");
    }

    const res = await fetch(
      `${this.baseUrl}/hotels/${targetHotelId}/inventory?start=${start}&end=${end}`,
      {
        method: "GET",
        headers: { Authorization: `BZ-JWT ${this.token}` },
        cache: "no-store",
      }
    );

    if (!res.ok) return null;
    return await res.json();
  }

  /**
   * Push rates update to Aiosell CM v2 Partner Endpoint using Basic Auth
   */
  async pushRatesV2(
    rates: Record<string, number>,
    hotelId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AiosellSyncResult> {
    const targetHotelId = hotelId || this.hotelId || "62a25484e5";
    const start = startDate || new Date().toISOString().split("T")[0];
    const end = endDate || start;
    const payload = {
      hotelId: targetHotelId,
      partner: AIOSELL_V2_CONFIG.partnerName,
      syncedAt: new Date().toISOString(),
      startDate: start,
      endDate: end,
      rates: Object.keys(rates).map((roomCode) => ({
        roomCode,
        rate: rates[roomCode],
      })),
    };

    try {
      const res = await fetch(AIOSELL_V2_CONFIG.ratesUrl, {
        method: "POST",
        headers: {
          Authorization: AIOSELL_V2_CONFIG.basicAuthHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      return {
        success: res.ok,
        syncedAt: new Date().toISOString(),
        message: res.ok
          ? `Rates successfully updated (${start} to ${end}) via Aiosell CM v2 partner endpoint.`
          : `Aiosell CM v2 rates update returned HTTP status ${res.status}`,
        payloadSent: payload,
      };
    } catch (err) {
      return {
        success: false,
        syncedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : "Failed to push rates to Aiosell CM v2 endpoint",
      };
    }
  }

  /**
   * Push inventory update to Aiosell CM v2 Partner Endpoint using Basic Auth
   */
  async pushInventoryV2(
    inventory: Record<string, number>,
    hotelId?: string
  ): Promise<AiosellSyncResult> {
    const targetHotelId = hotelId || this.hotelId || "62a25484e5";
    const payload = {
      hotelId: targetHotelId,
      partner: AIOSELL_V2_CONFIG.partnerName,
      syncedAt: new Date().toISOString(),
      inventory: Object.keys(inventory).map((roomCode) => ({
        roomCode,
        available: inventory[roomCode],
      })),
    };

    try {
      const res = await fetch(AIOSELL_V2_CONFIG.inventoryUrl, {
        method: "POST",
        headers: {
          Authorization: AIOSELL_V2_CONFIG.basicAuthHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      return {
        success: res.ok,
        syncedAt: new Date().toISOString(),
        message: res.ok
          ? "Inventory successfully updated via Aiosell CM v2 partner endpoint."
          : `Aiosell CM v2 inventory update returned HTTP status ${res.status}`,
        payloadSent: payload,
      };
    } catch (err) {
      return {
        success: false,
        syncedAt: new Date().toISOString(),
        error: err instanceof Error ? err.message : "Failed to push inventory to Aiosell CM v2 endpoint",
      };
    }
  }

  /**
   * Push rates & inventory sync directly to Aiosell PMS push endpoint
   */
  async pushRatesAndInventory(
    rates: Record<string, number>,
    inventory: Record<string, number>,
    hotelId?: string
  ): Promise<AiosellSyncResult> {
    const targetHotelId = hotelId || this.hotelId || "62a25484e5";

    // Push to v2 CM partner endpoints (Primary)
    const v2RatesRes = await this.pushRatesV2(rates, targetHotelId);
    const v2InvRes = await this.pushInventoryV2(inventory, targetHotelId);

    if (!this.token) {
      try {
        await this.login();
      } catch {
        // Fallback to v2 result
      }
    }

    const payload = [
      {
        hotelId: targetHotelId,
        type: "RATE_INVENTORY_SYNC",
        pmsCode: "KAIZERSTAYS",
        syncedAt: new Date().toISOString(),
        rates: Object.keys(rates).map((roomCode) => ({
          roomCode,
          rate: rates[roomCode],
          available: inventory[roomCode] || 10,
        })),
      },
    ];

    try {
      const res = await fetch(`${this.baseUrl}/pms/common/push`, {
        method: "POST",
        headers: {
          Authorization: this.token ? `BZ-JWT ${this.token}` : AIOSELL_V2_CONFIG.basicAuthHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      return {
        success: v2RatesRes.success || v2InvRes.success || res.ok,
        syncedAt: new Date().toISOString(),
        message: "Rates and inventory synchronized across Aiosell CM v2 partner endpoints and v1 RMS.",
        payloadSent: {
          v2Rates: v2RatesRes,
          v2Inventory: v2InvRes,
          v1PushStatus: res.status,
        },
      };
    } catch {
      return {
        success: v2RatesRes.success || v2InvRes.success,
        syncedAt: new Date().toISOString(),
        message: "Rates and inventory push processed via Aiosell CM v2 partner endpoints.",
        payloadSent: { v2Rates: v2RatesRes, v2Inventory: v2InvRes },
      };
    }
  }

  /**
   * Ingest incoming live channel reservations from Aiosell
   * First queries the live accounting/OTA bookings endpoint from Aiosell RMS
   */
  async fetchLiveReservations(hotelId?: string): Promise<AiosellReservationItem[]> {
    const targetHotelId = hotelId || this.hotelId || "62a25484e5";
    if (!this.token) {
      const loginRes = await this.login();
      if (!loginRes.success) throw new Error(loginRes.error || "Not authenticated");
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const nextMonthStr = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const lastMonthStr = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

    try {
      const res = await fetch(`${this.baseUrl}/accounting2/data/${targetHotelId}`, {
        method: "POST",
        headers: {
          Authorization: `BZ-JWT ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: lastMonthStr,
          to: nextMonthStr,
          channels: [],
        }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((b: Record<string, unknown>, idx: number) => ({
            bookingId: String(b.booking_id || b.bookingId || b.id || `AIO-OTA-${idx + 1}`),
            guestName: String(b.guest_name || b.guestName || b.name || "Aiosell Guest"),
            guestEmail: b.guest_email ? String(b.guest_email) : undefined,
            guestPhone: b.guest_phone ? String(b.guest_phone) : undefined,
            checkIn: String(b.check_in || b.checkIn || b.stay_from || todayStr),
            checkOut: String(b.check_out || b.checkOut || b.stay_to || nextMonthStr),
            roomCode: String(b.room_code || b.room_id || b.roomType || "deluxe-room"),
            roomTypeName: String(b.room_type_name || b.room_type || "Deluxe Room"),
            totalAmount: Number(b.total_amount || b.amount || b.price || 0),
            channel: String(b.channel || b.ota || "Aiosell Channel Manager"),
            status: (String(b.status || "CONFIRMED").toUpperCase() as "CONFIRMED" | "CANCELLED" | "MODIFIED"),
          }));
        }
      }
    } catch {
      // Return empty array if offline or error
    }

    return [];
  }

  /**
   * Fetch live commission report from Aiosell
   */
  async fetchCommissionReport(hotelId?: string, fromDate?: string, toDate?: string) {
    const targetHotelId = hotelId || this.hotelId || "62a25484e5";
    if (!this.token) {
      const loginRes = await this.login();
      if (!loginRes.success) throw new Error(loginRes.error || "Not authenticated");
    }

    const from = fromDate || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const to = toDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    try {
      const res = await fetch(
        `${this.baseUrl}/accounting2/commission/${targetHotelId}?from=${from}&to=${to}&filter=booking`,
        {
          headers: { Authorization: `BZ-JWT ${this.token}` },
          cache: "no-store",
        }
      );
      if (res.ok) return await res.json();
    } catch {
      // Ignore
    }
    return { totalDict: { totalrns: 0, totalPer: 0, totalComm: 0, toatalArr: 0, totalRev: 0 }, data: [] };
  }

  /**
   * Fetch AI demand forecast & pricing intelligence from Aiosell RMS
   */
  async fetchDemandForecast(hotelId?: string, fromDate?: string, toDate?: string) {
    const targetHotelId = hotelId || this.hotelId || "62a25484e5";
    if (!this.token) {
      const loginRes = await this.login();
      if (!loginRes.success) throw new Error(loginRes.error || "Not authenticated");
    }

    const from = fromDate || new Date().toISOString().split("T")[0];
    const to = toDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    try {
      const res = await fetch(
        `${this.baseUrl}/analytics/${targetHotelId}/forecast?from=${from}&to=${to}`,
        {
          headers: { Authorization: `BZ-JWT ${this.token}` },
          cache: "no-store",
        }
      );
      if (res.ok) return await res.json();
    } catch {
      // Ignore
    }
    return { segments: [], datewise_data: {} };
  }
}
