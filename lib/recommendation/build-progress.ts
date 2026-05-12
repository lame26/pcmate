import { getBuilderCategories } from "@/lib/recommendation/candidates";
import type { PartCategory } from "@/types/parts";

export const requiredBuildCategories: PartCategory[] = getBuilderCategories();

export function getMissingRequiredCategories(selectedPartIds: Partial<Record<PartCategory, string>>) {
  return requiredBuildCategories.filter((category) => !selectedPartIds[category]);
}

export function canOpenSummary(selectedPartIds: Partial<Record<PartCategory, string>>) {
  return getMissingRequiredCategories(selectedPartIds).length === 0;
}

export function getNextCategory(currentCategory: PartCategory, selectedPartIds: Partial<Record<PartCategory, string>>) {
  const currentIndex = requiredBuildCategories.indexOf(currentCategory);
  const afterCurrent = requiredBuildCategories.slice(currentIndex + 1);
  const beforeOrCurrent = requiredBuildCategories.slice(0, currentIndex + 1);

  return [...afterCurrent, ...beforeOrCurrent].find((category) => !selectedPartIds[category]) ?? afterCurrent[0] ?? requiredBuildCategories[0];
}

export function getPreviousCategory(currentCategory: PartCategory) {
  const currentIndex = requiredBuildCategories.indexOf(currentCategory);
  return requiredBuildCategories[Math.max(0, currentIndex - 1)];
}

export function getCategoryStep(category: PartCategory) {
  return requiredBuildCategories.indexOf(category) + 1;
}
