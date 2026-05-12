import { describe, expect, it } from "vitest";

import { checkCompatibility } from "@/lib/compatibility/check";
import { createCompatibilityCheckRows } from "@/lib/compatibility/display";
import type { Part } from "@/types/parts";

describe("createCompatibilityCheckRows", () => {
  it("shows a passing row when a checked pair has no issues", () => {
    const cpu = createPart("cpu-am5", "cpu", {
      kind: "cpu",
      socket: "AM5",
      series: "Ryzen 7000",
    });
    const motherboard = createPart("board-am5", "motherboard", {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "M-ATX",
      ramType: "DDR5",
      supportedCpuSeries: ["Ryzen 7000"],
    });
    const result = checkCompatibility({ cpu, motherboard });
    const rows = createCompatibilityCheckRows(result, { cpu, motherboard });

    expect(rows.find((row) => row.id === "cpu-board")).toEqual(
      expect.objectContaining({
        status: "compatible",
        issues: [],
      })
    );
  });

  it("groups blocked GPU and case issues into the physical fit row", () => {
    const gpu = createPart("gpu-long", "gpu", {
      kind: "gpu",
      chipset: "RTX Test",
      lengthMm: 340,
      slotWidth: 4,
      powerConnectors: ["12V2x6"],
    });
    const pcCase = createPart("case-small", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX"],
      maxGpuLengthMm: 320,
      gpuSlotCount: 3,
      color: "black",
    });
    const result = checkCompatibility({ gpu, case: pcCase });
    const rows = createCompatibilityCheckRows(result, { gpu, case: pcCase });
    const gpuCaseRow = rows.find((row) => row.id === "gpu-case");

    expect(gpuCaseRow?.status).toBe("blocked");
    expect(gpuCaseRow?.issues.map((issue) => issue.code)).toEqual([
      "GPU_CASE_LENGTH_EXCEEDED",
      "GPU_CASE_SLOT_EXCEEDED",
    ]);
  });

  it("keeps missing related parts visible as a not-ready row", () => {
    const gpu = createPart("gpu-only", "gpu", {
      kind: "gpu",
      chipset: "RTX Test",
      lengthMm: 300,
      powerConnectors: ["8pin"],
    });
    const result = checkCompatibility({ gpu });
    const rows = createCompatibilityCheckRows(result, { gpu });

    expect(rows.find((row) => row.id === "gpu-case")).toEqual(
      expect.objectContaining({
        status: "not-ready",
        partNames: ["gpu-only"],
      })
    );
  });
});

function createPart(id: string, category: Part["category"], specs: Part["specs"]): Part {
  return {
    id,
    category,
    name: id,
    brand: "Test",
    model: id,
    aliases: [],
    specs,
    classification: {
      brandLineTier: "mainstream",
      marketPosition: "fair",
      confidence: "high",
      reasons: [],
    },
    offers: [],
    source: {
      type: "static",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    confidence: "high",
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}
