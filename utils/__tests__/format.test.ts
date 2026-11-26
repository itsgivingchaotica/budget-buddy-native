import { daysAgo, earliestDay, formatDay, formatMoney, freshness, plural } from "@/utils/format";
import { fileErrorMessage, rowErrorMessage } from "@/utils/importMessages";
import { categorizeUntilDone, templateUrl } from "@/utils/activityApi";

jest.mock("@/utils/api", () => ({ api: {} }));

const today = new Date(2026, 10, 25); // Nov 25, 2026

describe("formatMoney", () => {
  it("formats money out and in, with true minus, $ and separators", () => {
    expect(formatMoney("-64.18")).toEqual({ text: "−$64.18", direction: "out" });
    expect(formatMoney("120")).toEqual({ text: "+$120.00", direction: "in" });
    expect(formatMoney("-1234567.5")).toEqual({ text: "−$1,234,567.50", direction: "out" });
    expect(formatMoney("0.07").text).toBe("+$0.07");
  });

  it("never uses floating point (no rounding drift)", () => {
    expect(formatMoney("-9999999999.99").text).toBe("−$9,999,999,999.99");
    expect(formatMoney("0.29").text).toBe("+$0.29");
  });
});

describe("dates and freshness", () => {
  it("formats days, omitting the year when it's this year", () => {
    expect(formatDay("2026-11-20", today)).toBe("Nov 20");
    expect(formatDay("2025-02-03", today)).toBe("Feb 3, 2025");
  });

  it("counts calendar days", () => {
    expect(daysAgo("2026-11-25", today)).toBe(0);
    expect(daysAgo("2026-11-18", today)).toBe(7);
  });

  it("freshness: up to date within 7 days, else N days old", () => {
    expect(freshness("2026-11-18", today)).toEqual({ label: "Up to date", fresh: true });
    expect(freshness("2026-11-17", today)).toEqual({ label: "8 days old", fresh: false });
    expect(freshness(null, today)).toEqual({ label: "No data yet", fresh: false });
  });

  it("earliest data-through across accounts ignores empty accounts", () => {
    expect(earliestDay(["2026-11-20", null, "2026-11-02"])).toBe("2026-11-02");
    expect(earliestDay([null])).toBeNull();
  });

  it("plurals", () => {
    expect(plural(1, "account")).toBe("1 account");
    expect(plural(3, "account")).toBe("3 accounts");
  });
});

describe("import messages", () => {
  it("whole-file errors in plain words; missing columns use the server's list", () => {
    expect(fileErrorMessage("file_too_large")).toMatch(/over 2 MB/);
    expect(fileErrorMessage("missing_headers", "Required columns: date, description, amount. Missing: amount.")).toBe(
      "Required columns: date, description, amount. Missing: amount."
    );
    expect(fileErrorMessage("something_new", "Server says no.")).toBe("Server says no.");
    expect(fileErrorMessage(undefined)).toBe("This file couldn't be imported.");
  });

  it("row errors give the line and a reason, never row text", () => {
    expect(rowErrorMessage({ line: 7, code: "bad_date" })).toBe(
      "Line 7: the date isn't in a format we read (use YYYY-MM-DD or M/D/YYYY)"
    );
    expect(rowErrorMessage({ line: 3, code: "mystery" })).toBe("Line 3: this row couldn't be read");
  });
});

describe("categorizeUntilDone", () => {
  it("calls until nothing remains", async () => {
    const call = jest.fn().mockResolvedValueOnce({ processed: 100, remaining: 40 }).mockResolvedValueOnce({ processed: 40, remaining: 0 });
    await expect(categorizeUntilDone(140, 10, call)).resolves.toEqual({ remaining: 0, stoppedByLimit: false });
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("doesn't call at all when nothing is waiting", async () => {
    const call = jest.fn();
    await categorizeUntilDone(0, 10, call);
    expect(call).not.toHaveBeenCalled();
  });

  it("stops quietly at the AI cap or rate limit (429)", async () => {
    const call = jest.fn().mockResolvedValueOnce({ processed: 100, remaining: 30 }).mockRejectedValueOnce({ response: { status: 429 } });
    await expect(categorizeUntilDone(130, 10, call)).resolves.toEqual({ remaining: 30, stoppedByLimit: true });
  });

  it("other errors are thrown, and the loop is bounded", async () => {
    await expect(categorizeUntilDone(5, 10, jest.fn().mockRejectedValue({ response: { status: 500 } }))).rejects.toBeTruthy();
    const stuck = jest.fn().mockResolvedValue({ processed: 0, remaining: 5 });
    await categorizeUntilDone(5, 3, stuck);
    expect(stuck).toHaveBeenCalledTimes(3);
  });
});

describe("templateUrl", () => {
  it("points at the Rails public template, outside /api/v1", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://192.168.1.135:3000/api/v1";
    expect(templateUrl()).toBe("http://192.168.1.135:3000/csv-templates/generic.csv");
  });
});

import { importFigures } from "@/utils/importMessages";

describe("importFigures", () => {
  const base = { inserted_count: 922, duplicate_count: 0, error_count: 0, data_from: "2024-11-21", data_through: "2026-11-20" };

  it("splits added rows into categorized automatically and to review", () => {
    expect(importFigures(base, 82, 0)).toEqual({
      added: 922,
      range: { from: "2024-11-21", through: "2026-11-20" },
      categorizedAutomatically: 840,
      toReview: 82,
      duplicates: 0,
      unreadable: 0,
      laterNote: false,
    });
  });

  it("an overlapping export adds nothing and reports duplicates", () => {
    const f = importFigures({ ...base, inserted_count: 0, duplicate_count: 76, data_from: "2026-09-21" }, 0, 0);
    expect([f.added, f.duplicates, f.categorizedAutomatically, f.toReview]).toEqual([0, 76, 0, 0]);
  });

  it("notes when the AI will finish later", () => {
    expect(importFigures(base, 10, 25).laterNote).toBe(true);
  });

  it("no date range when nothing was read", () => {
    expect(importFigures({ ...base, data_from: null, data_through: null }, 0, 0).range).toBeNull();
  });
});

import { groupByDay } from "@/utils/format";

describe("groupByDay", () => {
  it("groups by posted day, newest day first, keeping order within a day", () => {
    const rows = [
      { id: 1, posted_on: "2026-11-02" },
      { id: 2, posted_on: "2026-11-05" },
      { id: 3, posted_on: "2026-11-02" },
    ];
    expect(groupByDay(rows)).toEqual([
      { title: "2026-11-05", data: [{ id: 2, posted_on: "2026-11-05" }] },
      { title: "2026-11-02", data: [{ id: 1, posted_on: "2026-11-02" }, { id: 3, posted_on: "2026-11-02" }] },
    ]);
  });
});

import { formatCount, formatDayLong, formatDayWithWeekday } from "@/utils/format";

describe("design date and count formats", () => {
  it("weekday dates, long dates and thousands separators", () => {
    expect(formatDayWithWeekday("2026-11-21", today)).toBe("Sat, Nov 21");
    expect(formatDayLong("2024-12-01")).toBe("Dec 1, 2024");
    expect(formatCount(1082)).toBe("1,082");
    expect(formatCount(37)).toBe("37");
    expect(plural(1082, "transaction")).toBe("1,082 transactions");
  });
});
