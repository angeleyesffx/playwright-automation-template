import { test, expect } from "@playwright/test";
import { FakerDataGenerator } from "../../utils/faker-data-generator";

test.describe("FakerDataGenerator @unit", () => {
  test.describe("generateEmail", () => {
    test("should generate a string in valid email format", () => {
      const email = FakerDataGenerator.generateEmail();
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test("should generate an email ending with the given domain", () => {
      const email = FakerDataGenerator.generateEmail("example.com");
      expect(email).toMatch(/@example\.com$/);
    });
  });

  test.describe("generatePassword", () => {
    test("should meet minimum complexity requirements", () => {
      const password = FakerDataGenerator.generatePassword();
      expect(password).toMatch(/[A-Z]/); // uppercase
      expect(password).toMatch(/[0-9]/); // digit
      expect(password).toContain("@"); // special char separator
      expect(password.length).toBeGreaterThanOrEqual(16);
    });
  });

  test.describe("generateRandomInt", () => {
    test("should return a value within [min, max]", () => {
      const value = FakerDataGenerator.generateRandomInt(5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(10);
    });

    test("should swap reversed min/max gracefully", () => {
      const value = FakerDataGenerator.generateRandomInt(10, 1);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(10);
    });

    test("should use 1 as min when only one argument is given", () => {
      const value = FakerDataGenerator.generateRandomInt(5);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(5);
    });
  });

  test.describe("generateAddressComponents", () => {
    test("should return all required address fields", () => {
      const addr = FakerDataGenerator.generateAddressComponents();
      expect(typeof addr.street).toBe("string");
      expect(typeof addr.city).toBe("string");
      expect(addr.state).toMatch(/^[A-Z]{2}$/); // 2-letter state code
      expect(addr.zipCode).toMatch(/^\d{5}$/); // 5-digit zip
    });
  });

  test.describe("date generators", () => {
    test("generateTodayDate should return YYYY-MM-DD format", () => {
      const date = FakerDataGenerator.generateTodayDate();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(date).toString()).not.toBe("Invalid Date");
    });

    test("generateMonthAgoDatePlusOneDayISO should return a past date", () => {
      const result = FakerDataGenerator.generateMonthAgoDatePlusOneDayISO();
      const date = new Date(result);
      expect(date.toString()).not.toBe("Invalid Date");
      // Should be in the past (between 3 months ago and today)
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      expect(date.getTime()).toBeLessThan(now.getTime());
      expect(date.getTime()).toBeGreaterThan(threeMonthsAgo.getTime());
    });
  });
});
