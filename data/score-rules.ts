export const scoreRules = {
  recommendationWeights: {
    performanceFitScore: 0.35,
    priceScore: 0.25,
    compatibilityScore: 0.2,
    preferenceScore: 0.1,
    classificationScore: 0.1,
  },
  gameFrequencyWeights: {
    rare: 0.8,
    normal: 1,
    often: 1.2,
    main: 1.4,
  },
  optionTargetTierAdjustments: {
    low: -1,
    medium: 0,
    high: 0.5,
    ultra: 1,
  },
  monitorGpuTierAdjustments: {
    FHD: 0,
    QHD: 1,
    UWQHD: 1.5,
    "4K": 2,
  },
  refreshRateTierAdjustments: {
    "60-75": 0,
    "100-120": 0.5,
    "144-180": 1,
    "240-plus": 1.5,
  },
} as const;
