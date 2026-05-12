import { NextResponse } from "next/server";
import { z } from "zod";

import { parsePowerShellSpec } from "@/lib/spec/powershell-parser";

const parseSpecRequestSchema = z.object({
  format: z.enum(["json", "text", "auto"]).default("auto"),
  raw: z.string().max(120_000),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseSpecRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        spec: {},
        confidence: "low",
        warnings: ["요청 형식이 올바르지 않습니다. format과 raw 값을 확인해 주세요."],
      },
      { status: 400 }
    );
  }

  return NextResponse.json(parsePowerShellSpec(parsed.data));
}
