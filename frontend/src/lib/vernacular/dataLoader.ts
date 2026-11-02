/**
 * Vernacular Data Loader
 * Loads and validates the curated exemplars, concept groups, and stress tests.
 * Caches parsed records in module scope.
 */

import {
  VernacularData,
  ExemplarEntry,
  StatuteRecord,
  ConceptGroup,
  CombinationRule,
  SafeBlocker,
  RegressionCases,
  StressTestCase,
} from "./types";

import exemplarsJson from "./data/vernacular_exemplars.json";
import conceptGroupsJson from "./data/vernacular_concept_groups.json";
import stressTestsJson from "./data/vernacular_stress_tests.json";

let cachedData: VernacularData | null = null;

export function loadVernacularData(): VernacularData {
  if (cachedData) {
    return cachedData;
  }

  const exemplars = (exemplarsJson.entries || []) as ExemplarEntry[];
  const statutes = (exemplarsJson.statutes || []) as StatuteRecord[];
  const conceptGroups = (conceptGroupsJson.groups || []) as ConceptGroup[];
  const combinationRules = (conceptGroupsJson.combination_rules || []) as CombinationRule[];
  const safeBlockers = (conceptGroupsJson.safe_blockers || []) as SafeBlocker[];
  const cannotOverrideGroups = new Set<string>(conceptGroupsJson.cannot_override_groups || []);
  const restrictedBrands = (conceptGroupsJson.restricted_brands || {}) as Record<string, string[]>;
  const regressionCases = (conceptGroupsJson.regression_cases || {
    must_not_fire: [],
    must_fire: [],
    note: "",
  }) as RegressionCases;
  const stressTests = (stressTestsJson.tests || []) as StressTestCase[];

  cachedData = {
    exemplars,
    statutes,
    conceptGroups,
    combinationRules,
    safeBlockers,
    cannotOverrideGroups,
    restrictedBrands,
    regressionCases,
    stressTests,
  };

  return cachedData;
}

export function getStatute(statuteId: string): StatuteRecord | undefined {
  const data = loadVernacularData();
  return data.statutes.find((s) => s.statute_id === statuteId);
}

export function getExemplars(): ExemplarEntry[] {
  return loadVernacularData().exemplars;
}

export function getConceptGroups(): ConceptGroup[] {
  return loadVernacularData().conceptGroups;
}

export function getCombinationRules(): CombinationRule[] {
  return loadVernacularData().combinationRules;
}

export function getSafeBlockers(): SafeBlocker[] {
  return loadVernacularData().safeBlockers;
}

export function getCannotOverrideGroups(): Set<string> {
  return loadVernacularData().cannotOverrideGroups;
}

export function getRestrictedBrands(): Record<string, string[]> {
  return loadVernacularData().restrictedBrands;
}

