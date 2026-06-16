import { test, expect } from '../fixtures/test-fixtures';
import { createRestfulBookerHelper, type Booking } from '../../utils/restful-booker-helper';

function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Jim',
    lastname: 'Brown',
    totalprice: 111,
    depositpaid: true,
    bookingdates: { checkin: '2024-01-01', checkout: '2024-01-05' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}

test.describe('Restful Booker - Auth @smoke @api', () => {
  test('should return a token for valid credentials', async ({ bookerApi }) => {
    const token = await bookerApi.createToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
});

test.describe('Restful Booker - Booking CRUD @api', () => {
  test('should create a booking with the requested fields @smoke', async ({ bookerApi }) => {
    const booking = buildBooking();
    const response = await bookerApi.createBooking(booking);

    expect(response.bookingid).toBeDefined();
    expect(response.booking).toMatchObject({ ...booking });

    await bookerApi.deleteBooking(response.bookingid);
  });

  test('should retrieve a created booking by id', async ({ bookerApi }) => {
    const created = await bookerApi.createBooking(buildBooking({ firstname: 'Alice' }));

    const fetched = await bookerApi.getBooking(created.bookingid);
    expect(fetched.firstname).toBe('Alice');

    await bookerApi.deleteBooking(created.bookingid);
  });

  test('should update an existing booking', async ({ bookerApi }) => {
    const created = await bookerApi.createBooking(buildBooking());

    const updated = await bookerApi.updateBooking(
      created.bookingid,
      buildBooking({ firstname: 'Updated' })
    );
    expect(updated.firstname).toBe('Updated');

    await bookerApi.deleteBooking(created.bookingid);
  });

  test('should delete a booking', async ({ bookerApi }) => {
    const created = await bookerApi.createBooking(buildBooking());

    await bookerApi.deleteBooking(created.bookingid);
    await expect(bookerApi.getBooking(created.bookingid)).rejects.toThrow(/404/);
  });
});

// Boundary Value Analysis — closes the ISTQB gap flagged for the Marvel API tests.
test.describe('Restful Booker - Boundary values @api', () => {
  test('should accept a booking with totalprice of 0', async ({ bookerApi }) => {
    const created = await bookerApi.createBooking(buildBooking({ totalprice: 0 }));
    expect(created.booking.totalprice).toBe(0);
    await bookerApi.deleteBooking(created.bookingid);
  });
});

test.describe('Restful Booker - Negative cases @api', () => {
  test('should reject an update without a valid token', async () => {
    const api = createRestfulBookerHelper({ silent: true });
    // No createToken() called — request sent without Cookie auth
    await expect(api.updateBooking(1, buildBooking())).rejects.toThrow(/403/);
    await api.dispose();
  });

  test('should return a 404 for a non-existent booking id', async ({ bookerApi }) => {
    await expect(bookerApi.getBooking(999999999)).rejects.toThrow(/404/);
  });
});
