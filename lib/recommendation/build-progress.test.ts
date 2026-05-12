import { describe, expect, it } from "vitest";

import { canOpenSummary, getMissingRequiredCategories, getNextCategory } from "@/lib/recommendation/build-progress";
import type { PartCategory } from "@/types/parts";

describe("build progress helpers", () => {
  it("returns missing required categories", () => {
    const selected: Partial<Record<PartCategory, string>> = {
      cpu: "cpu-1",
      motherboard: "mb-1",
      ram: "ram-1",
    };

    expect(getMissingRequiredCategories(selected)).toEqual(["cooler", "gpu", "ssd", "psu", "case"]);
  });

  it("allows summary only after all required categories are selected", () => {
    expect(canOpenSummary({ cpu: "cpu-1" })).toBe(false);
    expect(
      canOpenSummary({
        cpu: "cpu-1",
        cooler: "cooler-1",
        motherboard: "mb-1",
        ram: "ram-1",
        gpu: "gpu-1",
        ssd: "ssd-1",
        psu: "psu-1",
        case: "case-1",
      })
    ).toBe(true);
  });

  it("returns the next missing category after the current category", () => {
    expect(getNextCategory("cpu", { cpu: "cpu-1" })).toBe("cooler");
    expect(getNextCategory("motherboard", { cpu: "cpu-1", cooler: "cooler-1", motherboard: "mb-1", ram: "ram-1" })).toBe("gpu");
  });
});
