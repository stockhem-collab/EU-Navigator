import { test, expect } from "@playwright/test";
import { pageWindow, totalPagesFor } from "../../components/Pagination";

test("page window keeps the first, the last and two either side of the current page", () => {
  expect(pageWindow(1, 1)).toEqual([1]);
  expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
  expect(pageWindow(1, 20)).toEqual([1, 2, 3, null, 20]);
  expect(pageWindow(10, 20)).toEqual([1, null, 8, 9, 10, 11, 12, null, 20]);
  // A gap of one page shows that page instead of "…".
  expect(pageWindow(5, 20)).toEqual([1, 2, 3, 4, 5, 6, 7, null, 20]);
  expect(pageWindow(20, 20)).toEqual([1, null, 18, 19, 20]);
});

test("total pages is at least one", () => {
  expect(totalPagesFor(0, 20)).toBe(1);
  expect(totalPagesFor(20, 20)).toBe(1);
  expect(totalPagesFor(21, 20)).toBe(2);
});
