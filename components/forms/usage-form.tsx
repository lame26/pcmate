"use client";

import type { MonitorProfile } from "@/types/games";
import { useBuildStore } from "@/stores/build-store";

import { checkboxClassName, Field, selectClassName } from "./field";

const concurrentApps = [
  ["youtube", "유튜브/넷플릭스"],
  ["kakaotalk", "카카오톡"],
  ["discord", "디스코드"],
  ["music", "음악 스트리밍"],
  ["obs-recording", "OBS 녹화"],
  ["obs-streaming", "OBS 방송"],
];

const workApps = [
  ["vscode", "VS Code"],
  ["codex", "Codex/Cursor/Claude Code"],
  ["wsl", "WSL"],
  ["docker", "Docker"],
  ["figma", "Figma"],
  ["premiere", "Premiere/DaVinci"],
  ["blender", "Blender/CAD"],
  ["local-ai", "Stable Diffusion/로컬 LLM"],
];

export function UsageForm() {
  const usage = useBuildStore((state) => state.usage);
  const setMultitasking = useBuildStore((state) => state.setMultitasking);
  const toggleConcurrentApp = useBuildStore((state) => state.toggleConcurrentApp);
  const toggleWorkApp = useBuildStore((state) => state.toggleWorkApp);
  const setMonitors = useBuildStore((state) => state.setMonitors);
  const setUsageFlags = useBuildStore((state) => state.setUsageFlags);

  const monitor = usage.monitors[0] ?? { resolution: "FHD", refreshRateTier: "144-180", count: 1 };
  const updateMonitor = (patch: Partial<MonitorProfile>) => setMonitors([{ ...monitor, ...patch }]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="브라우저 탭">
          <select
            className={selectClassName}
            value={usage.multitasking.browserTabs}
            onChange={(event) =>
              setMultitasking({ browserTabs: event.target.value as typeof usage.multitasking.browserTabs })
            }
          >
            <option value="under-10">10개 이하</option>
            <option value="over-20">20개 이상</option>
            <option value="over-50">50개 이상</option>
          </select>
        </Field>
        <Field label="해상도">
          <select
            className={selectClassName}
            value={monitor.resolution}
            onChange={(event) => updateMonitor({ resolution: event.target.value as MonitorProfile["resolution"] })}
          >
            <option value="FHD">FHD</option>
            <option value="QHD">QHD</option>
            <option value="UWQHD">UWQHD 3440x1440</option>
            <option value="4K">4K</option>
          </select>
        </Field>
        <Field label="주사율">
          <select
            className={selectClassName}
            value={monitor.refreshRateTier}
            onChange={(event) =>
              updateMonitor({ refreshRateTier: event.target.value as MonitorProfile["refreshRateTier"] })
            }
          >
            <option value="60-75">60~75Hz</option>
            <option value="100-120">100~120Hz</option>
            <option value="144-180">144~180Hz</option>
            <option value="240-plus">240Hz 이상</option>
          </select>
        </Field>
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">동시 실행 앱</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {concurrentApps.map(([id, label]) => (
            <label key={id} className="flex items-center gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                className={checkboxClassName}
                checked={usage.multitasking.concurrentApps.includes(id)}
                onChange={() => toggleConcurrentApp(id)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">개발/작업 앱</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workApps.map(([id, label]) => (
            <label key={id} className="flex items-center gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                className={checkboxClassName}
                checked={usage.multitasking.workApps.includes(id)}
                onChange={() => toggleWorkApp(id)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-md border p-3">
          <input
            type="checkbox"
            className={checkboxClassName}
            checked={usage.usesVr}
            onChange={(event) => setUsageFlags({ usesVr: event.target.checked })}
          />
          <span className="text-sm">VR/메타퀘스트 사용</span>
        </label>
        <label className="flex items-center gap-3 rounded-md border p-3">
          <input
            type="checkbox"
            className={checkboxClassName}
            checked={usage.usesCaptureCard}
            onChange={(event) => setUsageFlags({ usesCaptureCard: event.target.checked })}
          />
          <span className="text-sm">캡처보드 사용</span>
        </label>
      </div>
    </div>
  );
}
