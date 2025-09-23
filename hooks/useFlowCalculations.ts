"use client"

import { useMemo } from "react"
import type { ChannelConfig, ProcessedData } from "@/config/channels"

interface FlowCalculationResult {
  processedData: ProcessedData[]
  averageQEntree: number
  totalQSortie: number
  volumeIndex: number
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

export const useFlowCalculations = (data: any[], channel: ChannelConfig): FlowCalculationResult => {
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

    // Apply filtering if enabled
    const levels = data.map((item) => item.value / 100) // Conversion cm -> m
    const filteredLevels =
      channel.enableFiltering && channel.filterWindowSize ? movingAverage(levels, channel.filterWindowSize) : levels

    // Use filteredLevels for all subsequent calculations
    filteredLevels.forEach((currentLevel, index) => {
      if (index === 0) {
        processedData.push({
          date: new Date(data[index].date),
          level: currentLevel,
          filteredLevel: channel.enableFiltering ? currentLevel : undefined,
          Q_entree: 0,
          Q_sortie: 0,
          volumeIndex: 0,
        })
        return
      }

      const currentDate = new Date(data[index].date)
      const prevLevel = filteredLevels[index - 1]
      const deltaLevel = currentLevel - prevLevel
      const deltaTimeHours = (currentDate.getTime() - new Date(data[index - 1].date).getTime()) / 3600000

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
        Q_sortie = lastQEntree - (deltaLevel * channel.surface) / deltaTimeHours
        volumeAccumulator += Q_sortie * deltaTimeHours
        totalTime += deltaTimeHours
        lastTrend = "falling"
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

    return {
      processedData,
      averageQEntree: risingSampleCount > 0 ? totalQEntreeSum / risingSampleCount : 0,
      totalQSortie: volumeAccumulator,
      volumeIndex: volumeAccumulator,
    }
  }, [data, channel.enableFlowCalculation, channel.surface, channel.enableFiltering, channel.filterWindowSize])
}
