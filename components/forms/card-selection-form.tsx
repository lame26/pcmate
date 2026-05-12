"use client";

import { cardProviders } from "@/data/cards";
import { useBuildStore } from "@/stores/build-store";

import { checkboxClassName } from "./field";

export function CardSelectionForm() {
  const profile = useBuildStore((state) => state.profile);
  const setBuildMode = useBuildStore((state) => state.setBuildMode);
  const toggleCardProvider = useBuildStore((state) => state.toggleCardProvider);
  const toggleMembership = useBuildStore((state) => state.toggleMembership);

  const cards = cardProviders.filter((provider) => provider.type === "card");
  const memberships = cardProviders.filter((provider) => provider.type !== "card");

  return (
    <div className="grid gap-6">
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">견적 모드</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["full-build", "새 PC 전체 견적", "MVP 기본 흐름입니다."],
            ["upgrade", "기존 PC 일부 업그레이드", "입력은 저장하되 추천은 전체 견적 우선입니다."],
          ].map(([value, label, description]) => (
            <label key={value} className="rounded-lg border p-4">
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  className={checkboxClassName}
                  checked={profile.buildMode === value}
                  onChange={() => setBuildMode(value as typeof profile.buildMode)}
                />
                <span className="font-medium">{label}</span>
              </span>
              <span className="mt-2 block text-sm text-muted-foreground">{description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">보유 카드</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((provider) => (
            <label key={provider.id} className="flex items-center gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                className={checkboxClassName}
                checked={profile.selectedCardProviderIds.includes(provider.id)}
                onChange={() => toggleCardProvider(provider.id)}
              />
              <span className="text-sm">{provider.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">멤버십/간편결제</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((provider) => (
            <label key={provider.id} className="flex items-center gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                className={checkboxClassName}
                checked={profile.selectedMembershipIds.includes(provider.id)}
                onChange={() => toggleMembership(provider.id)}
              />
              <span className="text-sm">{provider.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
