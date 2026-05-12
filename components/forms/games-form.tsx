"use client";

import { useMemo, useState } from "react";

import { games } from "@/data/games";
import { useBuildStore, useBuildStoreHasHydrated } from "@/stores/build-store";
import type { SelectedGame } from "@/types/games";

import { checkboxClassName, inputClassName, selectClassName } from "./field";

const frequencyLabels: Record<SelectedGame["frequency"], string> = {
  rare: "가끔",
  normal: "보통",
  often: "자주",
  main: "주력",
};

const optionLabels: Record<SelectedGame["optionTarget"], string> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
  ultra: "울트라",
};

export function GamesForm() {
  const [query, setQuery] = useState("");
  const hasHydrated = useBuildStoreHasHydrated();
  const selectedGames = useBuildStore((state) => state.usage.selectedGames);
  const setSelectedGame = useBuildStore((state) => state.setSelectedGame);
  const removeSelectedGame = useBuildStore((state) => state.removeSelectedGame);

  const filteredGames = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return games;

    return games.filter((game) =>
      [game.name, ...game.aliases].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [query]);

  const selectedById = new Map(selectedGames.map((game) => [game.gameId, game]));

  if (!hasHydrated) {
    return (
      <div className="rounded-md border border-dashed bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
        저장된 게임 선택을 불러오는 중입니다.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <input
        className={inputClassName}
        value={query}
        placeholder="게임 검색"
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="grid gap-2">
        {filteredGames.map((game) => {
          const selected = selectedById.get(game.id);
          const isSelected = Boolean(selected);

          return (
            <div key={game.id} className="rounded-md border px-3 py-2">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <label className="flex min-h-10 items-center gap-3">
                  <input
                    type="checkbox"
                    className={checkboxClassName}
                    checked={isSelected}
                    onChange={() =>
                      isSelected
                        ? removeSelectedGame(game.id)
                        : setSelectedGame({ gameId: game.id, frequency: "normal", optionTarget: "high" })
                    }
                  />
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{game.name}</span>
                    {game.demandType === "estimated" ? (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">예상치</span>
                    ) : null}
                    {game.vrGame ? (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">VR</span>
                    ) : null}
                  </span>
                </label>

                {selected ? (
                  <div className="grid gap-2 sm:grid-cols-2 md:w-64">
                    <select
                      className={selectClassName}
                      value={selected.frequency}
                      onChange={(event) =>
                        setSelectedGame({ ...selected, frequency: event.target.value as SelectedGame["frequency"] })
                      }
                    >
                      {Object.entries(frequencyLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      className={selectClassName}
                      value={selected.optionTarget}
                      onChange={(event) =>
                        setSelectedGame({ ...selected, optionTarget: event.target.value as SelectedGame["optionTarget"] })
                      }
                    >
                      {Object.entries(optionLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
