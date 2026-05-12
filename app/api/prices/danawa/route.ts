import { NextResponse } from "next/server";
import { z } from "zod";

import { getDanawaRankedSnapshotResult } from "@/lib/crawler/danawa-rank-adapter";
import { createPcodePlaceholderSnapshot, extractDanawaPcode } from "@/lib/pricing/danawa-parser";

const danawaPriceRequestSchema = z.object({
  pcode: z.string().optional(),
  searchQuery: z.string().optional(),
  category: z.enum(["cpu", "cooler", "motherboard", "ram", "gpu", "ssd", "psu", "case"]).optional(),
  limit: z.number().int().min(1).max(30).optional(),
  forceRefresh: z.boolean().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = danawaPriceRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        snapshot: createPcodePlaceholderSnapshot({
          warning: "요청 형식이 올바르지 않습니다. pcode 또는 searchQuery 값을 확인해 주세요.",
        }),
        fromCache: false,
        warnings: ["요청 형식이 올바르지 않습니다."],
      },
      { status: 400 }
    );
  }

  const pcode = parsed.data.pcode ? extractDanawaPcode(parsed.data.pcode) : undefined;
  const result =
    pcode || parsed.data.searchQuery || parsed.data.category
      ? await getDanawaRankedSnapshotResult({
          pcode,
          searchQuery: parsed.data.searchQuery,
          category: parsed.data.category,
          limit: parsed.data.limit ?? 30,
          forceRefresh: parsed.data.forceRefresh,
        }).catch(() =>
          ({
            snapshot: createPcodePlaceholderSnapshot({
              pcode,
              searchQuery: parsed.data.searchQuery,
              category: parsed.data.category,
              warning: "다나와 주요부품 랭킹 페이지를 읽지 못했습니다. 붙여넣기 또는 수동 입력을 사용해 주세요.",
            }),
            fromCache: false,
            cacheExpiresAt: new Date().toISOString(),
          })
        )
      : {
          snapshot: createPcodePlaceholderSnapshot({
            category: parsed.data.category,
            warning: "category, pcode 또는 searchQuery가 필요합니다.",
          }),
          fromCache: false,
          cacheExpiresAt: new Date().toISOString(),
        };

  return NextResponse.json({
    snapshot: result.snapshot,
    fromCache: result.fromCache,
    cacheExpiresAt: result.cacheExpiresAt,
    warnings: result.snapshot.warnings,
  });
}
