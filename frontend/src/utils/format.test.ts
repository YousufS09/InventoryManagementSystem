import { describe, expect, it } from "vitest";

import { formatCurrency, formatNumber, getInitials } from "./format";

describe("format helpers", () => {
  it("formats rupees with Indian digit grouping", () => {
    expect(formatCurrency(1234567.5)).toBe("₹12,34,567.50");
    expect(formatCurrency(0)).toBe("₹0.00");
  });

  it("formats plain numbers", () => {
    expect(formatNumber(1234567)).toBe("12,34,567");
  });

  it("builds up to two initials", () => {
    expect(getInitials("Mohamed Yousuf Khan")).toBe("MY");
    expect(getInitials("raj")).toBe("R");
    expect(getInitials("   ")).toBe("?");
  });
});
