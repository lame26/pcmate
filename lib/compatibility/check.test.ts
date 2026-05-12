import { describe, expect, it } from "vitest";

import { checkCompatibility } from "@/lib/compatibility/check";
import type { Part } from "@/types/parts";

describe("checkCompatibility", () => {
  it("blocks a GPU that is longer than the case limit", () => {
    const gpu = createPart("gpu-long", "gpu", {
      kind: "gpu",
      chipset: "RTX Test",
      vramGb: 12,
      lengthMm: 340,
      recommendedPsuW: 750,
      powerConnectors: ["12V2x6"],
      gamingTier: 8,
    });
    const pcCase = createPart("case-small", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX", "ATX"],
      maxGpuLengthMm: 320,
      maxCoolerHeightMm: 165,
      color: "black",
    });

    const result = checkCompatibility({
      gpu,
      case: pcCase,
    });

    expect(result.status).toBe("blocked");
    expect(result.canRecommend).toBe(false);
    expect(result.canExport).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "GPU_CASE_LENGTH_EXCEEDED",
        severity: "critical",
      })
    );
  });

  it("does not emit BIOS unknown when CPU series is explicitly supported", () => {
    const cpu = createPart("cpu-7500f", "cpu", {
      kind: "cpu",
      socket: "AM5",
      series: "Ryzen 7000",
      generation: "Zen/Ryzen 7000",
      tdpW: 65,
    });
    const motherboard = createPart("board-b650", "motherboard", {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "M-ATX",
      ramType: "DDR5",
      supportedCpuSeries: ["Ryzen 7000", "Ryzen 8000", "Ryzen 9000"],
      biosSupportNotes: ["Ryzen 9000 사용 시 출고 BIOS 버전 확인 필요"],
    });

    const result = checkCompatibility({ cpu, motherboard });

    expect(result.status).toBe("compatible");
    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: "CPU_BOARD_BIOS_UNKNOWN" }));
  });

  it("keeps supported CPUs as needs-check when the board may require a BIOS update", () => {
    const cpu = createPart("cpu-9700x", "cpu", {
      kind: "cpu",
      socket: "AM5",
      series: "Ryzen 9000",
      generation: "Zen/Ryzen 9000",
      tdpW: 65,
    });
    const motherboard = createPart("board-b650", "motherboard", {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "M-ATX",
      ramType: "DDR5",
      supportedCpuSeries: ["Ryzen 7000", "Ryzen 8000", "Ryzen 9000"],
      biosSupportNotes: ["Ryzen 9000 사용 시 출고 BIOS 버전 확인 필요"],
    });

    const result = checkCompatibility({ cpu, motherboard });

    expect(result.status).toBe("needs-check");
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "CPU_BOARD_BIOS_NEEDS_CHECK",
        status: "needs-check",
      })
    );
  });

  it("blocks CPU generations outside the motherboard support data", () => {
    const cpu = createPart("cpu-unsupported", "cpu", {
      kind: "cpu",
      socket: "AM5",
      series: "Ryzen 5000",
      generation: "Zen/Ryzen 5000",
      tdpW: 65,
    });
    const motherboard = createPart("board-b650", "motherboard", {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "M-ATX",
      ramType: "DDR5",
      supportedCpuSeries: ["Ryzen 7000", "Ryzen 8000", "Ryzen 9000"],
    });

    const result = checkCompatibility({ cpu, motherboard });

    expect(result.status).toBe("blocked");
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "CPU_BOARD_GENERATION_UNSUPPORTED",
        severity: "critical",
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
