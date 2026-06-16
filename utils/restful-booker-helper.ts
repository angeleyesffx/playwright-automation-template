import { RestApiHelper } from './rest-api-helpers';

export interface BookingDates {
  checkin: string;
  checkout: string;
}

export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
}

export interface BookingResponse {
  bookingid: number;
  booking: Booking;
}

export interface BookingIdRef {
  bookingid: number;
}

/**
 * Helper for the Restful Booker API (https://restful-booker.herokuapp.com).
 * Public sandbox API — default credentials admin/password123, no real account needed.
 * Auth: Cookie: token=<token> on PUT/PATCH/DELETE — unlike Bearer-token APIs, so headers()
 * is overridden here instead of relying on RestApiHelper's default Authorization header.
 */
export class RestfulBookerHelper extends RestApiHelper {
  constructor(options?: { silent?: boolean }) {
    super('https://restful-booker.herokuapp.com', options);
  }

  protected headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.token ? { Cookie: `token=${this.token}` } : {}),
    };
  }

  async createToken(username = 'admin', password = 'password123'): Promise<string> {
    return this.authenticate('/auth', { username, password });
  }

  async getBookingIds(params?: Record<string, string | number>): Promise<BookingIdRef[]> {
    return this.get<BookingIdRef[]>('/booking', params);
  }

  async getBooking(id: number): Promise<Booking> {
    return this.get<Booking>(`/booking/${id}`);
  }

  async createBooking(booking: Booking): Promise<BookingResponse> {
    return this.post<BookingResponse>('/booking', booking);
  }

  async updateBooking(id: number, booking: Booking): Promise<Booking> {
    return this.put<Booking>(`/booking/${id}`, booking);
  }

  async deleteBooking(id: number): Promise<void> {
    await this.delete<unknown>(`/booking/${id}`);
  }

  async ping(): Promise<void> {
    await this.get<unknown>('/ping');
  }
}

export function createRestfulBookerHelper(options?: { silent?: boolean }): RestfulBookerHelper {
  return new RestfulBookerHelper(options);
}
