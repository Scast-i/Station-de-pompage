import { useEffect, useMemo } from "react";
import { ChannelConfig, ProcessedData } from "@/config/channels";

interface FlowCalculationResult {
  processedData: ProcessedData[];
  averageQEntree: number;
  totalQSortie: number;
  volumeIndex: number;
}

export const useFlowCalculations = (
  data: any[],
  channel: ChannelConfig,
  resetTrigger: number
): FlowCalculationResult => {
  // Mémoïsation des données d'entrée
  const memoizedData = useMemo(() => data, [JSON.stringify(data)]);

  // Calculs principaux mémoïsés
  const result = useMemo(() => {
    let Q_entree = 0;
    let lastQEntree = 0;
    let totalQEntreeSum = 0;
    let risingCount = 0;
    let volumeAccumulator = 0;
    let timeWindow = 0;
    let lastLevel: number | null = null;
    let lastTrend: 'rising' | 'falling' | null = null;
    const processedData: ProcessedData[] = [];
    let currentRisingPeriod: { start: Date; end: Date; total: number } | null = null;

    const reset = () => {
      Q_entree = 0;
      lastQEntree = 0;
      totalQEntreeSum = 0;
      risingCount = 0;
      volumeAccumulator = 0;
      timeWindow = 0;
      lastLevel = null;
      lastTrend = null;
      currentRisingPeriod = null;
      processedData.length = 0;
    };

    reset();

    if (!channel.enableFlowCalculation || !channel.surface) {
      return {
        processedData: [],
        averageQEntree: 0,
        totalQSortie: 0,
        volumeIndex: 0
      };
    }

    memoizedData.forEach((current, index) => {
      // ... (le code de traitement existant)
    });

    return {
      processedData,
      averageQEntree: risingCount > 0 ? totalQEntreeSum / risingCount : 0,
      totalQSortie: volumeAccumulator,
      volumeIndex: timeWindow > 0 ? volumeAccumulator / timeWindow : 0
    };
  }, [memoizedData, channel, resetTrigger]); // Dépendances claires

  return result;
};
