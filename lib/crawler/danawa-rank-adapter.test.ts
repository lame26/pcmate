import { describe, expect, it } from "vitest";

import { parseDanawaRankedProducts } from "@/lib/crawler/danawa-rank-adapter";

describe("parseDanawaRankedProducts", () => {
  it("parses PSU connector, ATX version, and modular edge cases", () => {
    const [product] = parseDanawaRankedProducts(
      createHtml({
        pcode: "111",
        name: "시소닉 FOCUS GX-850 ATX3.1",
        specText: "ATX 파워 / 정격출력 : 850W / 80PLUS GOLD / ATX 3.1 / PCIe 8핀(6+2) x4 / 12V-2x6 x1 / 풀모듈러",
      }),
      "psu",
      1
    );

    expect(product.structuredSpecs).toMatchObject({
      psuWattageW: 850,
      psuAtxVersion: "ATX 3.1",
      psuPcie8pinCount: 4,
      psuHas12v2x6: true,
      psuModularText: "풀모듈러",
    });
  });

  it("infers motherboard CPU series and BIOS notes from chipset", () => {
    const [product] = parseDanawaRankedProducts(
      createHtml({
        pcode: "222",
        name: "MSI MAG B650M 박격포 WIFI",
        specText: "AMD B650 / AMD(소켓AM5) / M-ATX / DDR5 / M.2 : 2개",
      }),
      "motherboard",
      1
    );

    expect(product.structuredSpecs).toMatchObject({
      motherboardChipset: "AMD B650",
      motherboardSocket: "AMD(소켓AM5)",
      motherboardFormFactor: "M-ATX",
      motherboardRamType: "DDR5",
      motherboardSupportedCpuSeries: "Ryzen 7000,Ryzen 8000,Ryzen 9000",
      motherboardBiosSupportNotes: "Ryzen 9000 사용 시 출고 BIOS 버전 확인 필요",
    });
  });

  it("parses cooler radiator and TDP capacity variants", () => {
    const [product] = parseDanawaRankedProducts(
      createHtml({
        pcode: "333",
        name: "ARCTIC Liquid Freezer III 360",
        specText: "수랭 CPU쿨러 / 라디에이터 : 360mm / 지원 소켓 : AM5, LGA1851 / TDP : 300W",
      }),
      "cooler",
      1
    );

    expect(product.structuredSpecs).toMatchObject({
      coolerRadiatorMm: 360,
      coolerSupportedSockets: "AM5, LGA1851",
      coolerTdpCapacityW: 300,
    });
  });
});

function createHtml(input: { pcode: string; name: string; specText: string }) {
  return `
    <div class="main_prodlist main_prodlist_list">
      <li class="prod_item productItem" id="productItem${input.pcode}">
        <strong class="pop_rank"><span>인기</span>1</strong>
        <p class="prod_name"><a name="productName" href="https://prod.danawa.com/info/?pcode=${input.pcode}">${input.name}</a></p>
        <input id="min_price_${input.pcode}" value="123,000" />
        <div class="spec_list">${input.specText.replaceAll(" / ", "<em>/</em>")}</div>
      </li>
    </div>
  `;
}
