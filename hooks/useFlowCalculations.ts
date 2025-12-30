"use client"

import { useMemo } from "react"
import type { Channel, ProcessedData } from "@/config/channels"
import { format } from "date-fns"

interface FlowCalculationResult {
  processedData: ProcessedData[]
  averageQEntree: number
  totalQSortie: number
  volumeIndex: number
  dailyVolumes: { date: Date; volume: number }[]
}

function movingAverage(data: number[], windowSize: number): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const end = i + 1
    const window = data.slice(start, end)
    const average = window.reduce((sum, val) => sum + val, 0) / window.length
    result.push(average)
  }
  return result
}

function calculatePumpFlow(channel: Channel, pumpStates: number[]): number {
  if (!channel.usePumpFlow || !channel.pumps) return 0

  return channel.pumps.reduce((total, pump, index) => {
    // Make sure we don't go out of bounds
    if (index < pumpStates.length) {
      return total + (pumpStates[index] === 1 ? pump.flowRate : 0)
    }
    return total
  }, 0)
}

export const useFlowCalculations = (data: any[], channel: Channel): FlowCalculationResult => {
  return useMemo(() => {
    if (!channel.enableFlowCalculation || !channel.surface || data.length === 0) {
      return {
        processedData: data.map((item) => ({
          date: new Date(item.date),
          level: item.value / 100, // Conversion cm -> m
          Q_entree: 0,
          Q_sortie: 0,
          volumeIndex: 0,
        })),
        averageQEntree: 0,
        totalQSortie: 0,
        volumeIndex: 0,
        dailyVolumes: [],
      }
    }

    let Q_entree = 0
    let lastQEntree = 0
    let totalQEntreeSum = 0
    let risingSampleCount = 0
    let volumeAccumulator = 0
    let totalTime = 0
    let lastTrend: "rising" | "falling" | null = null
    const processedData: ProcessedData[] = []

    // Pour le calcul du volume journalier - utilisons une Map pour garantir l'unicité des jours
    const dailyVolumeMap = new Map<string, number>()

    // Apply filtering if enabled
    const levels = data.map((item) => item.value / 100) // Conversion cm -> m
    const filteredLevels =
      channel.enableFiltering && channel.filterWindowSize ? movingAverage(levels, channel.filterWindowSize) : levels

    // Use filteredLevels for all subsequent calculations
    filteredLevels.forEach((currentLevel, index) => {
      const currentDate = new Date(data[index].date)

      // Formatage de la date sans l'heure pour regrouper par jour
      const dayKey = format(currentDate, "yyyy-MM-dd")

      if (index === 0) {
        processedData.push({
          date: currentDate,
          level: currentLevel,
          filteredLevel: channel.enableFiltering ? currentLevel : undefined,
          Q_entree: 0,
          Q_sortie: 0,
          volumeIndex: 0,
        })
        return
      }

      const prevLevel = filteredLevels[index - 1]
      const deltaLevel = currentLevel - prevLevel
      const prevDate = new Date(data[index - 1].date)
      const deltaTimeHours = (currentDate.getTime() - prevDate.getTime()) / 3600000

      if (deltaTimeHours <= 0) {
        processedData.push({
          date: currentDate,
          level: currentLevel,
          filteredLevel: channel.enableFiltering ? currentLevel : undefined,
          Q_entree: 0,
          Q_sortie: 0,
          volumeIndex: volumeAccumulator,
        })
        return
      }

      const currentTrend = deltaLevel > 0 ? "rising" : "falling"

      if (currentTrend === "rising") {
        Q_entree = (deltaLevel * channel.surface) / deltaTimeHours
        totalQEntreeSum += Q_entree
        risingSampleCount++
        lastQEntree = Q_entree
        lastTrend = "rising"
      } else {
        Q_entree = 0
      }

      let Q_sortie = 0
      if (currentTrend === "falling") {
        Q_sortie = Math.max(0, lastQEntree - (deltaLevel * channel.surface) / deltaTimeHours)
        const volumeForInterval = Q_sortie * deltaTimeHours
        volumeAccumulator += volumeForInterval
        totalTime += deltaTimeHours
        lastTrend = "falling"

        // Calcul du volume journalier - ajout du volume à la journée correspondante
        if (volumeForInterval > 0) {
          dailyVolumeMap.set(dayKey, (dailyVolumeMap.get(dayKey) || 0) + volumeForInterval)
        }
      }

      processedData.push({
        date: currentDate,
        level: currentLevel,
        filteredLevel: channel.enableFiltering ? currentLevel : undefined,
        Q_entree,
        Q_sortie,
        volumeIndex: volumeAccumulator,
      })
    })

    // Convertir la Map en tableau pour l'affichage
    const dailyVolumes = Array.from(dailyVolumeMap.entries())
      .map(([dateStr, volume]) => ({
        date: new Date(dateStr),
        volume,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    return {
      processedData,
      averageQEntree: risingSampleCount > 0 ? totalQEntreeSum / risingSampleCount : 0,
      totalQSortie: volumeAccumulator,
      volumeIndex: volumeAccumulator,
      dailyVolumes,
    }
  }, [data, channel.enableFlowCalculation, channel.surface, channel.enableFiltering, channel.filterWindowSize])
}
