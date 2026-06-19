import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

export class FakerDataGenerator {
  // ── Identity ──────────────────────────────────────────────────────────────

  static generateEmail(domain?: string): string {
    return domain
      ? `${faker.internet.username()}@${domain}`
      : faker.internet.email();
  }

  static generatePersonName(): string {
    return faker.person.fullName();
  }
  static generateFirstName(): string {
    return faker.person.firstName();
  }
  static generateLastName(): string {
    return faker.person.lastName();
  }
  static generateUsername(): string {
    return faker.internet.username();
  }
  static generateJobTitle(): string {
    return faker.person.jobTitle();
  }

  static generatePassword(): string {
    return `Test${faker.string.alphanumeric(8)}@${faker.string.numeric(3)}`;
  }

  static generatePhoneNumber(): string {
    return `${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(4)}`;
  }

  // ── Company ───────────────────────────────────────────────────────────────

  static generateCompanyName(): string {
    return faker.company.name();
  }

  static generateUniqueCompanyName(): string {
    return `${faker.company.name()}-${uuidv4().substring(0, 8)}`;
  }

  // ── Address ───────────────────────────────────────────────────────────────

  private static readonly STATE_ZIP_PREFIXES: Record<string, string> = {
    AL: "35",
    AK: "99",
    AZ: "85",
    AR: "71",
    CA: "90",
    CO: "80",
    CT: "06",
    DE: "19",
    FL: "32",
    GA: "30",
    HI: "96",
    ID: "83",
    IL: "60",
    IN: "46",
    IA: "50",
    KS: "66",
    KY: "40",
    LA: "70",
    ME: "04",
    MD: "21",
    MA: "02",
    MI: "48",
    MN: "55",
    MS: "38",
    MO: "63",
    MT: "59",
    NE: "68",
    NV: "89",
    NH: "03",
    NJ: "07",
    NM: "87",
    NY: "10",
    NC: "27",
    ND: "58",
    OH: "43",
    OK: "73",
    OR: "97",
    PA: "15",
    RI: "02",
    SC: "29",
    SD: "57",
    TN: "37",
    TX: "75",
    UT: "84",
    VT: "05",
    VA: "22",
    WA: "98",
    WV: "25",
    WI: "53",
    WY: "82",
    DC: "20",
  };

  static generateAddressComponents(): {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  } {
    const state = faker.location
      .state({ abbreviated: true })
      .slice(0, 2)
      .toUpperCase();
    const prefix = this.STATE_ZIP_PREFIXES[state] ?? "90";
    return {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state,
      zipCode: `${prefix}${faker.string.numeric(3)}`,
    };
  }

  static generateUSAddress(): string {
    const { street, city, state, zipCode } = this.generateAddressComponents();
    return `${street}, ${city}, ${state} ${zipCode}`;
  }

  // ── Strings ───────────────────────────────────────────────────────────────

  static generateRandomString(length = 10): string {
    return faker.string.alphanumeric(length);
  }
  static generateWord(): string {
    return faker.word.sample();
  }
  static generateSentence(): string {
    return faker.lorem.sentence();
  }
  static generateParagraph(sentences = 3): string {
    return faker.lorem.paragraphs(sentences);
  }
  static generateUUID(): string {
    return faker.string.uuid();
  }
  static generateSlug(): string {
    return faker.helpers
      .slugify(`${faker.word.sample()}-${faker.word.sample()}`)
      .toLowerCase();
  }

  // ── Web / Network ─────────────────────────────────────────────────────────

  static generateURL(): string {
    return faker.internet.url();
  }
  static generateIPAddress(): string {
    return faker.internet.ipv4();
  }
  static generateColor(): string {
    return faker.color.rgb({ casing: "lower", format: "hex" });
  }

  // ── Numbers ───────────────────────────────────────────────────────────────

  static generateRandomInt(minOrMax?: number, max?: number): number {
    let min: number, maxValue: number;
    if (max === undefined) {
      min = 1;
      maxValue = minOrMax ?? 100;
    } else {
      min = minOrMax ?? 1;
      maxValue = max;
    }
    if (min > maxValue) [min, maxValue] = [maxValue, min];
    return faker.number.int({ min, max: maxValue });
  }

  // ── Dates ─────────────────────────────────────────────────────────────────

  static generatePastDate(daysAgo = 30): string {
    return faker.date.recent({ days: daysAgo }).toISOString().split("T")[0];
  }

  static generateFutureDate(daysAhead = 30): string {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split("T")[0];
  }

  static generateTodayDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  static generateFormattedDate(daysOffset = 0): string {
    const d = new Date();
    if (daysOffset) d.setDate(d.getDate() + daysOffset);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}/${d.getFullYear()}`;
  }

  static generateTodayDateISO(): string {
    return new Date().toISOString();
  }

  static generateFirstDayOfMonthISO(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  }

  static generateFirstDayOfLastMonthISO(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
  }

  static generateMonthAgoDateISO(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString();
  }

  static generateMonthAgoDatePlusOneDayISO(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(d.getDate() + 1); // getDate() = day of month (was incorrectly getDay() = day of week)
    return d.toISOString();
  }
}
