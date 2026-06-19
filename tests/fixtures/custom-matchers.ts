import { expect } from "@playwright/test";
import type { Booking } from "../../utils/restful-booker-helper";

expect.extend({
  toBeValidBooking(received: unknown) {
    const b = received as Partial<Booking>;
    const pass =
      typeof b.firstname === "string" &&
      b.firstname.length > 0 &&
      typeof b.lastname === "string" &&
      typeof b.totalprice === "number" &&
      b.totalprice >= 0 &&
      typeof b.depositpaid === "boolean" &&
      typeof b.bookingdates?.checkin === "string" &&
      typeof b.bookingdates?.checkout === "string";
    return {
      pass,
      message: () =>
        `Expected object to be a valid Booking (firstname, lastname, totalprice, depositpaid, bookingdates).\nReceived: ${JSON.stringify(received, null, 2)}`,
    };
  },
});

// Augment the PlaywrightTest namespace so TypeScript recognises toBeValidBooking().
// Playwright 1.50+ defines MakeMatchers via PlaywrightTest.Matchers in playwright/types/test.
// Augmenting that exact path is required for the type to appear on expect(...).toBeValidBooking().
declare module "playwright/types/test" {
  namespace PlaywrightTest {
    interface Matchers<R, _T = unknown> {
      toBeValidBooking(): R;
    }
  }
}
