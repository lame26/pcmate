"use client";

import { useState } from "react";
import { Clipboard, FileJson, TerminalSquare, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PartCategory } from "@/types/parts";
import type { ParseSpecRequest, ParseSpecResponse } from "@/types/spec";
import { useBuildStore } from "@/stores/build-store";

import { checkboxClassName, Field, inputClassName, selectClassName } from "./field";

const reusableParts: { id: PartCategory; label: string }[] = [
  { id: "ssd", label: "기존 SSD 재사용" },
  { id: "case", label: "기존 케이스 재사용" },
  { id: "psu", label: "기존 파워 재사용" },
];

const textareaClassName =
  "min-h-40 resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

const powershellJsonCommand = `$spec = [ordered]@{
  Processor = Get-CimInstance Win32_Processor | Select-Object -First 1 Name
  VideoController = Get-CimInstance Win32_VideoController | Select-Object Name
  PhysicalMemory = Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity, Speed, SMBIOSMemoryType, Manufacturer, PartNumber
  BaseBoard = Get-CimInstance Win32_BaseBoard | Select-Object Manufacturer, Product
  PhysicalDisk = Get-PhysicalDisk | Select-Object FriendlyName, Size, MediaType, BusType
}
$spec | ConvertTo-Json -Depth 4`;

export function SpecForm() {
  const currentSpec = useBuildStore((state) => state.currentSpec);
  const patchCurrentSpec = useBuildStore((state) => state.patchCurrentSpec);
  const setRam = useBuildStore((state) => state.setRam);
  const setPsu = useBuildStore((state) => state.setPsu);
  const setStorage = useBuildStore((state) => state.setStorage);
  const toggleReusablePart = useBuildStore((state) => state.toggleReusablePart);

  const [parseFormat, setParseFormat] = useState<ParseSpecRequest["format"]>("auto");
  const [rawSpec, setRawSpec] = useState("");
  const [parseResult, setParseResult] = useState<ParseSpecResponse | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);

  const storage = currentSpec.storage?.[0];

  async function handleParseSpec() {
    setIsParsing(true);

    try {
      const response = await fetch("/api/spec/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: parseFormat, raw: rawSpec }),
      });
      const result = (await response.json()) as ParseSpecResponse;

      setParseResult(result);

      if (response.ok) {
        patchCurrentSpec(result.spec);
      }
    } catch {
      setParseResult({
        spec: {},
        confidence: "low",
        warnings: ["파싱 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."],
      });
    } finally {
      setIsParsing(false);
    }
  }

  async function handleCopyCommand() {
    await navigator.clipboard.writeText(powershellJsonCommand);
    setCopiedGuide(true);
    window.setTimeout(() => setCopiedGuide(false), 1800);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="CPU">
          <input
            className={inputClassName}
            value={currentSpec.cpu ?? ""}
            placeholder="예: Intel i7-8700K"
            onChange={(event) => patchCurrentSpec({ cpu: event.target.value })}
          />
        </Field>
        <Field label="GPU">
          <input
            className={inputClassName}
            value={currentSpec.gpu ?? ""}
            placeholder="예: GTX 1080"
            onChange={(event) => patchCurrentSpec({ gpu: event.target.value })}
          />
        </Field>
        <Field label="RAM 용량">
          <input
            className={inputClassName}
            inputMode="numeric"
            value={currentSpec.ram?.totalGb ?? ""}
            placeholder="예: 16"
            onChange={(event) =>
              setRam({ ...currentSpec.ram, totalGb: Number(event.target.value) || undefined })
            }
          />
        </Field>
        <Field label="RAM 타입">
          <select
            className={selectClassName}
            value={currentSpec.ram?.type ?? "unknown"}
            onChange={(event) =>
              setRam({ ...currentSpec.ram, type: event.target.value as NonNullable<typeof currentSpec.ram>["type"] })
            }
          >
            <option value="unknown">모름</option>
            <option value="DDR4">DDR4</option>
            <option value="DDR5">DDR5</option>
          </select>
        </Field>
        <Field label="메인보드">
          <input
            className={inputClassName}
            value={currentSpec.motherboard ?? ""}
            placeholder="예: MSI Z370"
            onChange={(event) => patchCurrentSpec({ motherboard: event.target.value })}
          />
        </Field>
        <Field label="파워 용량">
          <input
            className={inputClassName}
            inputMode="numeric"
            value={currentSpec.psu?.wattage ?? ""}
            placeholder="예: 650"
            onChange={(event) =>
              setPsu({ ...currentSpec.psu, wattage: Number(event.target.value) || undefined })
            }
          />
        </Field>
        <Field label="저장장치">
          <input
            className={inputClassName}
            value={storage?.name ?? ""}
            placeholder="예: Samsung 970 EVO 1TB"
            onChange={(event) => setStorage([{ ...storage, name: event.target.value }])}
          />
        </Field>
        <Field label="VR 기기">
          <input
            className={inputClassName}
            value={currentSpec.vrDevice ?? ""}
            placeholder="예: Meta Quest 3"
            onChange={(event) => patchCurrentSpec({ vrDevice: event.target.value })}
          />
        </Field>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">기존 부품 재사용</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {reusableParts.map((part) => (
            <label key={part.id} className="flex items-center gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                className={checkboxClassName}
                checked={currentSpec.reusablePartIds.includes(part.id)}
                onChange={() => toggleReusablePart(part.id)}
              />
              <span className="text-sm">{part.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 rounded-md border bg-muted/20 p-4">
        <details className="group rounded-md border bg-background">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium marker:hidden">
            <span className="flex items-center gap-2">
              <TerminalSquare className="size-4 text-muted-foreground" aria-hidden="true" />
              PowerShell 결과 가져오는 방법
            </span>
            <span className="text-xs text-muted-foreground group-open:hidden">열기</span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">닫기</span>
          </summary>
          <div className="grid gap-4 border-t px-4 py-4">
            <ol className="grid gap-2 text-sm leading-6 text-muted-foreground">
              <li>1. 아래 명령어를 복사해 Windows PowerShell에 붙여넣고 실행합니다.</li>
              <li>2. 출력된 JSON 전체를 복사합니다.</li>
              <li>3. 아래 입력칸에 붙여넣고 형식은 자동 감지 또는 JSON으로 둔 뒤 사양 채우기를 누릅니다.</li>
            </ol>
            <div className="overflow-hidden rounded-md border bg-muted/30">
              <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
                <span className="font-mono text-xs text-muted-foreground">PowerShell</span>
                <Button type="button" variant="outline" size="sm" onClick={handleCopyCommand}>
                  <Clipboard data-icon="inline-start" />
                  {copiedGuide ? "복사됨" : "명령어 복사"}
                </Button>
              </div>
              <pre className="max-h-64 overflow-auto p-3 font-mono text-xs leading-5">
                <code>{powershellJsonCommand}</code>
              </pre>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              JSON 출력이 가장 안정적입니다. 기존에 복사해 둔 일반 텍스트 결과도 붙여넣을 수 있지만 일부 항목은 수동 확인이 필요할 수 있습니다.
            </p>
          </div>
        </details>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Field label="PowerShell 결과 형식">
            <select
              className={selectClassName}
              value={parseFormat}
              onChange={(event) => setParseFormat(event.target.value as ParseSpecRequest["format"])}
            >
              <option value="auto">자동 감지</option>
              <option value="json">JSON</option>
              <option value="text">일반 텍스트</option>
            </select>
          </Field>
          <Button type="button" onClick={handleParseSpec} disabled={isParsing || !rawSpec.trim()} className="h-10">
            <WandSparkles data-icon="inline-start" />
            {isParsing ? "분석 중" : "사양 채우기"}
          </Button>
        </div>

        <Field label="PowerShell 결과 붙여넣기">
          <textarea
            className={textareaClassName}
            value={rawSpec}
            placeholder='예: {"Processor":{"Name":"AMD Ryzen 5 5600"},"VideoController":[{"Name":"NVIDIA GeForce RTX 4060"}]}'
            onChange={(event) => setRawSpec(event.target.value)}
          />
        </Field>

        {parseResult ? (
          <div className="grid gap-3 rounded-md border bg-background p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <FileJson className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">파싱 신뢰도</span>
              <span className="rounded-md border px-2 py-0.5 text-xs uppercase">{parseResult.confidence}</span>
            </div>
            {parseResult.warnings.length ? (
              <ul className="grid gap-1 text-muted-foreground">
                {parseResult.warnings.map((warning) => (
                  <li key={warning}>- {warning}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">주요 사양을 입력값에 반영했습니다.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
