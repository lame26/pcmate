"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { BuildMode, UserProfile } from "@/types/build";
import type {
  MonitorProfile,
  MultitaskingProfile,
  SelectedGame,
  UsageProfile,
  UserPreferences,
} from "@/types/games";
import type { PartCategory } from "@/types/parts";
import type { PriceSnapshot } from "@/types/pricing";
import type { CurrentPcSpec } from "@/types/spec";

type BuildStoreState = {
  schemaVersion: 1;
  profile: UserProfile;
  currentSpec: CurrentPcSpec;
  usage: UsageProfile;
  priceSnapshots: PriceSnapshot[];
  selectedPartIds: Partial<Record<PartCategory, string>>;
  updatedAt?: string;
  setBuildMode: (buildMode: BuildMode) => void;
  setBudget: (totalKrw?: number, flexible?: boolean) => void;
  toggleCardProvider: (providerId: string) => void;
  toggleMembership: (providerId: string) => void;
  patchCurrentSpec: (patch: Partial<CurrentPcSpec>) => void;
  setRam: (ram: CurrentPcSpec["ram"]) => void;
  setPsu: (psu: CurrentPcSpec["psu"]) => void;
  setStorage: (storage: NonNullable<CurrentPcSpec["storage"]>) => void;
  toggleReusablePart: (partId: CurrentPcSpec["reusablePartIds"][number]) => void;
  setSelectedGame: (game: SelectedGame) => void;
  removeSelectedGame: (gameId: string) => void;
  setMultitasking: (patch: Partial<MultitaskingProfile>) => void;
  toggleConcurrentApp: (appId: string) => void;
  toggleWorkApp: (appId: string) => void;
  setMonitors: (monitors: MonitorProfile[]) => void;
  setUsageFlags: (patch: Pick<Partial<UsageProfile>, "usesVr" | "usesCaptureCard">) => void;
  setPreferences: (patch: Partial<UserPreferences>) => void;
  setPreferenceReuse: (patch: Partial<UserPreferences["reuse"]>) => void;
  upsertPriceSnapshot: (snapshot: PriceSnapshot) => void;
  removePriceSnapshot: (snapshotId: string) => void;
  selectPart: (category: PartCategory, partId: string) => void;
  clearSelectedPart: (category: PartCategory) => void;
  reset: () => void;
};

const now = () => new Date().toISOString();

const defaultMonitor: MonitorProfile = {
  resolution: "FHD",
  refreshRateTier: "60-75",
  count: 1,
};

const defaultPreferences: UserPreferences = {
  color: "any",
  cooling: "any",
  rgb: "any",
  caseSize: "any",
  noise: "any",
  gpuVendor: "any",
  reuse: {
    ssd: false,
    case: false,
    psu: false,
  },
};

const initialState = {
  schemaVersion: 1 as const,
  profile: {
    id: "local-profile",
    buildMode: "full-build" as const,
    selectedCardProviderIds: [],
    selectedMembershipIds: [],
    createdAt: now(),
    updatedAt: now(),
  },
  currentSpec: {
    monitors: [defaultMonitor],
    reusablePartIds: [],
    warnings: [],
  },
  usage: {
    selectedGames: [],
    customRequirements: [],
    multitasking: {
      browserTabs: "under-10" as const,
      concurrentApps: [],
      workApps: [],
      usesObsRecording: false,
      usesObsStreaming: false,
      usesLocalAi: false,
    },
    monitors: [defaultMonitor],
    usesVr: false,
    usesCaptureCard: false,
    preferences: defaultPreferences,
  },
  priceSnapshots: [],
  selectedPartIds: {},
  updatedAt: undefined,
};

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export const useBuildStore = create<BuildStoreState>()(
  persist(
    (set) => ({
      ...initialState,
      setBuildMode: (buildMode) =>
        set((state) => ({
          profile: { ...state.profile, buildMode, updatedAt: now() },
          updatedAt: now(),
        })),
      setBudget: (totalKrw, flexible = true) =>
        set((state) => ({
          profile: {
            ...state.profile,
            budget: totalKrw ? { totalKrw, flexible } : undefined,
            updatedAt: now(),
          },
          updatedAt: now(),
        })),
      toggleCardProvider: (providerId) =>
        set((state) => ({
          profile: {
            ...state.profile,
            selectedCardProviderIds: toggleValue(state.profile.selectedCardProviderIds, providerId),
            updatedAt: now(),
          },
          updatedAt: now(),
        })),
      toggleMembership: (providerId) =>
        set((state) => ({
          profile: {
            ...state.profile,
            selectedMembershipIds: toggleValue(state.profile.selectedMembershipIds, providerId),
            updatedAt: now(),
          },
          updatedAt: now(),
        })),
      patchCurrentSpec: (patch) =>
        set((state) => ({
          currentSpec: { ...state.currentSpec, ...patch },
          updatedAt: now(),
        })),
      setRam: (ram) =>
        set((state) => ({
          currentSpec: { ...state.currentSpec, ram },
          updatedAt: now(),
        })),
      setPsu: (psu) =>
        set((state) => ({
          currentSpec: { ...state.currentSpec, psu },
          updatedAt: now(),
        })),
      setStorage: (storage) =>
        set((state) => ({
          currentSpec: { ...state.currentSpec, storage },
          updatedAt: now(),
        })),
      toggleReusablePart: (partId) =>
        set((state) => ({
          currentSpec: {
            ...state.currentSpec,
            reusablePartIds: toggleValue(state.currentSpec.reusablePartIds, partId) as CurrentPcSpec["reusablePartIds"],
          },
          updatedAt: now(),
        })),
      setSelectedGame: (game) =>
        set((state) => {
          const selectedGames = state.usage.selectedGames.some((item) => item.gameId === game.gameId)
            ? state.usage.selectedGames.map((item) => (item.gameId === game.gameId ? game : item))
            : [...state.usage.selectedGames, game];

          return {
            usage: { ...state.usage, selectedGames },
            updatedAt: now(),
          };
        }),
      removeSelectedGame: (gameId) =>
        set((state) => ({
          usage: {
            ...state.usage,
            selectedGames: state.usage.selectedGames.filter((item) => item.gameId !== gameId),
          },
          updatedAt: now(),
        })),
      setMultitasking: (patch) =>
        set((state) => ({
          usage: {
            ...state.usage,
            multitasking: { ...state.usage.multitasking, ...patch },
          },
          updatedAt: now(),
        })),
      toggleConcurrentApp: (appId) =>
        set((state) => ({
          usage: {
            ...state.usage,
            multitasking: {
              ...state.usage.multitasking,
              concurrentApps: toggleValue(state.usage.multitasking.concurrentApps, appId),
            },
          },
          updatedAt: now(),
        })),
      toggleWorkApp: (appId) =>
        set((state) => ({
          usage: {
            ...state.usage,
            multitasking: {
              ...state.usage.multitasking,
              workApps: toggleValue(state.usage.multitasking.workApps, appId),
            },
          },
          updatedAt: now(),
        })),
      setMonitors: (monitors) =>
        set((state) => ({
          currentSpec: { ...state.currentSpec, monitors },
          usage: { ...state.usage, monitors },
          updatedAt: now(),
        })),
      setUsageFlags: (patch) =>
        set((state) => ({
          usage: { ...state.usage, ...patch },
          updatedAt: now(),
        })),
      setPreferences: (patch) =>
        set((state) => ({
          usage: {
            ...state.usage,
            preferences: { ...state.usage.preferences, ...patch },
          },
          updatedAt: now(),
        })),
      setPreferenceReuse: (patch) =>
        set((state) => ({
          usage: {
            ...state.usage,
            preferences: {
              ...state.usage.preferences,
              reuse: { ...state.usage.preferences.reuse, ...patch },
            },
          },
          updatedAt: now(),
        })),
      upsertPriceSnapshot: (snapshot) =>
        set((state) => ({
          priceSnapshots: [
            snapshot,
            ...state.priceSnapshots.filter((item) => item.id !== snapshot.id).slice(0, 19),
          ],
          updatedAt: now(),
        })),
      removePriceSnapshot: (snapshotId) =>
        set((state) => ({
          priceSnapshots: state.priceSnapshots.filter((snapshot) => snapshot.id !== snapshotId),
          updatedAt: now(),
        })),
      selectPart: (category, partId) =>
        set((state) => ({
          selectedPartIds: { ...state.selectedPartIds, [category]: partId },
          updatedAt: now(),
        })),
      clearSelectedPart: (category) =>
        set((state) => {
          const selectedPartIds = { ...state.selectedPartIds };
          delete selectedPartIds[category];

          return {
            selectedPartIds,
            updatedAt: now(),
          };
        }),
      reset: () => set({ ...initialState, updatedAt: now() }),
    }),
    {
      name: "pcmate.build.v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
