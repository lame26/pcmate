import type { Part } from "@/types/parts";

export function getPartSpecBadges(part: Part): string[] {
  const specs = part.specs;

  if (specs.kind === "cpu") {
    return [
      specs.socket ?? "소켓 확인 필요",
      specs.cores && specs.threads ? `${specs.cores}C/${specs.threads}T` : undefined,
      specs.tdpW ? `${specs.tdpW}W` : undefined,
      specs.series,
    ].filter(Boolean) as string[];
  }

  if (specs.kind === "motherboard") {
    return [specs.socket, specs.chipset, specs.formFactor, specs.ramType, specs.m2Slots ? `M.2 ${specs.m2Slots}개` : undefined].filter(Boolean) as string[];
  }

  if (specs.kind === "ram") {
    const moduleLabel = specs.totalGb && specs.moduleCount && specs.moduleCount > 1 ? `${specs.totalGb}GB(${specs.totalGb / specs.moduleCount}Gx${specs.moduleCount})` : specs.totalGb ? `${specs.totalGb}GB` : undefined;
    return [
      specs.type,
      moduleLabel,
      specs.speedMhz ? `${specs.speedMhz}MHz` : undefined,
      specs.timing,
    ].filter(Boolean) as string[];
  }

  if (specs.kind === "gpu") {
    return [
      specs.chipset,
      specs.vramGb ? `VRAM ${specs.vramGb}GB` : undefined,
      specs.lengthMm ? `길이 ${specs.lengthMm}mm` : undefined,
      specs.thicknessMm ? `두께 ${specs.thicknessMm}mm` : specs.slotWidth ? `${specs.slotWidth}슬롯` : undefined,
      specs.recommendedPsuW ? `권장 ${specs.recommendedPsuW}W` : undefined,
      specs.powerConnectors?.map(formatConnector).join(", "),
    ].filter(Boolean) as string[];
  }

  if (specs.kind === "case") {
    return [
      specs.supportedFormFactors?.join(", "),
      specs.maxGpuLengthMm ? `GPU ${specs.maxGpuLengthMm}mm` : undefined,
      specs.maxCoolerHeightMm ? `쿨러 ${specs.maxCoolerHeightMm}mm` : undefined,
      specs.topRadiatorMm || specs.frontRadiatorMm ? `라디 ${Math.max(specs.topRadiatorMm ?? 0, specs.frontRadiatorMm ?? 0)}mm` : undefined,
      specs.gpuSlotCount ? `${specs.gpuSlotCount}슬롯` : undefined,
    ].filter(Boolean) as string[];
  }

  if (specs.kind === "psu") {
    return [
      specs.wattage ? `${specs.wattage}W` : undefined,
      specs.atxVersion,
      specs.efficiency,
      specs.has12v2x6 || specs.native12v2x6 ? "12V-2x6" : specs.has12vhpwr ? "12VHPWR" : undefined,
      specs.pcie8pinCount ? `PCIe 8핀 x${specs.pcie8pinCount}` : specs.gpuConnectors?.map(formatConnector).join(", "),
      specs.modular === "full" ? "풀모듈러" : specs.modular === "semi" ? "세미모듈러" : specs.modular === "none" ? "일체형" : undefined,
    ].filter(Boolean) as string[];
  }

  if (specs.kind === "cooler") {
    return [
      specs.type === "liquid" ? "수랭" : "공랭",
      specs.radiatorSizeMm ? `${specs.radiatorSizeMm}mm 라디` : specs.heightMm ? `높이 ${specs.heightMm}mm` : undefined,
      specs.supportedSockets?.join(", "),
      specs.tdpCapacityW ? `${specs.tdpCapacityW}W 대응` : specs.coolingCapacityTier,
    ].filter(Boolean) as string[];
  }

  return [
    specs.capacityGb ? `${specs.capacityGb >= 1000 ? `${specs.capacityGb / 1000}TB` : `${specs.capacityGb}GB`}` : undefined,
    specs.interface,
    specs.formFactor,
  ].filter(Boolean) as string[];
}

function formatConnector(connector: string) {
  if (/12v-?2x6/i.test(connector)) return "12V-2x6";
  if (/12vhpwr/i.test(connector)) return "12VHPWR";
  if (/6\s*\+\s*2|8[\s-]*pin|pcie\s*8/i.test(connector)) return "PCIe 8핀";
  if (/6[\s-]*pin/i.test(connector)) return "PCIe 6핀";
  return connector;
}
