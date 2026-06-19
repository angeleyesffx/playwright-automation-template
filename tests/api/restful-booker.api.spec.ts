import { test, expect } from "../fixtures/test-fixtures";
import {
  createRestfulBookerHelper,
  type Booking,
} from "../../utils/restful-booker-helper";
import { validateSchema } from "../../utils/schema-validator";

function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: "Jim",
    lastname: "Brown",
    totalprice: 111,
    depositpaid: true,
    bookingdates: { checkin: "2024-01-01", checkout: "2024-01-05" },
    additionalneeds: "Breakfast",
    ...overrides,
  };
}

test.describe("Restful Booker - Auth @smoke @api", () => {
  test("should return a token for valid credentials", async ({ bookerApi }) => {
    const token = await bookerApi.createToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });
});

test.describe("Restful Booker - Booking CRUD @api", () => {
  let bookingId: number;

  // Guarantees cleanup even when a test fails mid-execution.
  test.afterEach(async ({ bookerApi }) => {
    if (bookingId) {
      await bookerApi.deleteBooking(bookingId).catch(() => {});
      bookingId = undefined!;
    }
  });

  test("should create a booking with the requested fields @smoke", async ({
    bookerApi,
  }) => {
    const booking = buildBooking();

    const response = await test.step("Create booking", () =>
      bookerApi.createBooking(booking));
    bookingId = response.bookingid;

    await test.step("Verify response", async () => {
      expect(response.bookingid).toBeDefined();
      expect(response.booking).toMatchObject({ ...booking });
    });
  });

  // Demonstrates expect.soft(): collects all field failures before throwing,
  // so a single test run surfaces every mismatch instead of stopping at the first.
  test("should return all booking fields after creation", async ({
    bookerApi,
  }) => {
    const booking = buildBooking();

    const response = await test.step("Create booking", () =>
      bookerApi.createBooking(booking));
    bookingId = response.bookingid;

    await test.step("Verify all fields with soft assertions", async () => {
      expect.soft(response.booking.firstname).toBe(booking.firstname);
      expect.soft(response.booking.lastname).toBe(booking.lastname);
      expect.soft(response.booking.totalprice).toBe(booking.totalprice);
      expect.soft(response.booking.depositpaid).toBe(booking.depositpaid);
      expect(response.bookingid).toBeGreaterThan(0);
    });
  });

  test("should retrieve a created booking by id", async ({ bookerApi }) => {
    const created = await test.step("Create booking", () =>
      bookerApi.createBooking(buildBooking({ firstname: "Alice" })));
    bookingId = created.bookingid;

    const fetched = await test.step("Fetch booking by id", () =>
      bookerApi.getBooking(created.bookingid));

    await test.step("Verify fetched data", async () => {
      expect(fetched.firstname).toBe("Alice");
    });
  });

  test("should update an existing booking", async ({ bookerApi }) => {
    const created = await test.step("Create booking", () =>
      bookerApi.createBooking(buildBooking()));
    bookingId = created.bookingid;

    const updated = await test.step("Update booking", () =>
      bookerApi.updateBooking(
        created.bookingid,
        buildBooking({ firstname: "Updated" }),
      ));

    await test.step("Verify update", async () => {
      expect(updated.firstname).toBe("Updated");
    });
  });

  test("should delete a booking", async ({ bookerApi }) => {
    const created = await test.step("Create booking", () =>
      bookerApi.createBooking(buildBooking()));
    bookingId = created.bookingid;

    await test.step("Delete booking", () =>
      bookerApi.deleteBooking(created.bookingid));
    bookingId = undefined!;

    await test.step("Verify 404 after deletion", async () => {
      await expect(bookerApi.getBooking(created.bookingid)).rejects.toThrow(
        /404/,
      );
    });
  });
});

// Boundary Value Analysis — covers the ISTQB BVA gap.
test.describe("Restful Booker - Boundary values @api", () => {
  let bookingId: number;

  test.afterEach(async ({ bookerApi }) => {
    if (bookingId) {
      await bookerApi.deleteBooking(bookingId).catch(() => {});
      bookingId = undefined!;
    }
  });

  test("should accept a booking with totalprice of 0", async ({
    bookerApi,
  }) => {
    const created = await test.step("Create booking with totalprice 0", () =>
      bookerApi.createBooking(buildBooking({ totalprice: 0 })));
    bookingId = created.bookingid;

    await test.step("Verify totalprice boundary", async () => {
      expect(created.booking.totalprice).toBe(0);
    });
  });
});

test.describe("Restful Booker - Schema validation @api", () => {
  let bookingId: number;

  test.afterEach(async ({ bookerApi }) => {
    if (bookingId) {
      await bookerApi.deleteBooking(bookingId).catch(() => {});
      bookingId = undefined!;
    }
  });

  // Demonstrates validateSchema(): verifies the full response contract,
  // not just individual fields — catches API regressions that remove or retype fields.
  test("should return a response that matches the Booking schema", async ({
    bookerApi,
  }) => {
    const response = await test.step("Create booking", () =>
      bookerApi.createBooking(buildBooking()));
    bookingId = response.bookingid;

    await test.step("Validate response schema", async () => {
      // Custom matcher validates the full Booking shape in one assertion.
      expect(response.booking).toBeValidBooking();
      // validateSchema() demonstrates the type-by-type approach alongside the custom matcher.
      validateSchema<Booking>(response.booking, {
        firstname: "string",
        lastname: "string",
        totalprice: "number",
        depositpaid: "boolean",
      });
    });
  });
});

test.describe("Restful Booker - Negative cases @api", () => {
  test("should reject an update without a valid token", async () => {
    const api = createRestfulBookerHelper({ silent: true });
    // No createToken() called — request sent without Cookie auth
    await expect(api.updateBooking(1, buildBooking())).rejects.toThrow(/403/);
    await api.dispose();
  });

  test("should return a 404 for a non-existent booking id", async ({
    bookerApi,
  }) => {
    await expect(bookerApi.getBooking(999999999)).rejects.toThrow(/404/);
  });
});
