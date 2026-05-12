"use client";

import { useBuildStore } from "@/stores/build-store";
import type { UserPreferences } from "@/types/games";

import { checkboxClassName, Field, inputClassName, selectClassName } from "./field";

export function PreferencesForm() {
  const profile = useBuildStore((state) => state.profile);
  const preferences = useBuildStore((state) => state.usage.preferences);
  const setBudget = useBuildStore((state) => state.setBudget);
  const setPreferences = useBuildStore((state) => state.setPreferences);
  const setPreferenceReuse = useBuildStore((state) => state.setPreferenceReuse);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="총 예산" description="선택 입력입니다. 비워두면 적정 티어 기준으로 추천합니다.">
          <input
            className={inputClassName}
            inputMode="numeric"
            value={profile.budget?.totalKrw ?? ""}
            placeholder="예: 2500000"
            onChange={(event) => setBudget(Number(event.target.value) || undefined, profile.budget?.flexible ?? true)}
          />
        </Field>
        <Field label="예산 유연성">
          <select
            className={selectClassName}
            value={profile.budget?.flexible === false ? "fixed" : "flexible"}
            onChange={(event) => setBudget(profile.budget?.totalKrw, event.target.value === "flexible")}
          >
            <option value="flexible">조금 초과 가능</option>
            <option value="fixed">상한 엄격</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PreferenceSelect
          label="색상"
          value={preferences.color}
          onChange={(color) => setPreferences({ color })}
          options={[
            ["any", "상관없음"],
            ["black", "블랙"],
            ["white", "화이트"],
          ]}
        />
        <PreferenceSelect
          label="쿨링"
          value={preferences.cooling}
          onChange={(cooling) => setPreferences({ cooling })}
          options={[
            ["any", "상관없음"],
            ["air", "공랭 선호"],
            ["liquid", "수랭 선호"],
          ]}
        />
        <PreferenceSelect
          label="RGB"
          value={preferences.rgb}
          onChange={(rgb) => setPreferences({ rgb })}
          options={[
            ["any", "상관없음"],
            ["prefer", "RGB 선호"],
            ["avoid", "RGB 싫음"],
          ]}
        />
        <PreferenceSelect
          label="케이스 크기"
          value={preferences.caseSize}
          onChange={(caseSize) => setPreferences({ caseSize })}
          options={[
            ["any", "상관없음"],
            ["mini", "미니타워"],
            ["mid", "미들타워"],
            ["avoid-big", "빅타워 제외"],
          ]}
        />
        <PreferenceSelect
          label="소음"
          value={preferences.noise}
          onChange={(noise) => setPreferences({ noise })}
          options={[
            ["any", "상관없음"],
            ["quiet", "조용한 편"],
          ]}
        />
        <PreferenceSelect
          label="GPU 브랜드"
          value={preferences.gpuVendor}
          onChange={(gpuVendor) => setPreferences({ gpuVendor })}
          options={[
            ["any", "상관없음"],
            ["nvidia", "NVIDIA 선호"],
            ["radeon-ok", "Radeon 가능"],
          ]}
        />
      </div>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">재사용 선호</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["ssd", "기존 SSD 재사용"],
            ["case", "기존 케이스 재사용"],
            ["psu", "기존 파워 재사용"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                className={checkboxClassName}
                checked={preferences.reuse[key as keyof UserPreferences["reuse"]]}
                onChange={(event) =>
                  setPreferenceReuse({ [key]: event.target.checked } as Partial<UserPreferences["reuse"]>)
                }
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function PreferenceSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <select className={selectClassName} value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </Field>
  );
}
