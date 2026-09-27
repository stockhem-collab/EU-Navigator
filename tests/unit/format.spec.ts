import { test, expect } from "@playwright/test";
import { fmtFileSize } from "../../lib/format";

test.describe("fmtFileSize", () => {
  test("formats bytes, kilobytes and megabytes with the right unit", () => {
    expect(fmtFileSize(500)).toBe("500 B");
    expect(fmtFileSize(2048)).toBe("2 KB");
    expect(fmtFileSize(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
