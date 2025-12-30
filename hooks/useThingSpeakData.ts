"use client"

import { useState, useEffect } from "react"
import { format, addDays, parseISO, differenceInDays } from "date-fns"

interface ChannelData {
  name: string
  fields: { [key: string]: string }
  data: { [key: string]: { date: string; value: number }[] }
}

export function useThingSpeakData(channelId: number, start: string, end: string) {
  const [channelData, setChannelData] = useState<ChannelData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Vérifier si les dates sont valides
        if (!start || !end) {
          throw new Error("Dates de début et de fin requises")
        }

        const startDate = parseISO(start)
        const endDate = parseISO(end)

        // Calculer la différence en jours
        const daysDifference = differenceInDays(endDate, startDate)

        // Si la période est supérieure à 7 jours, nous devons faire plusieurs requêtes
        const maxDaysPerRequest = 7
        const requests = []

        if (daysDifference <= maxDaysPerRequest) {
          // Une seule requête suffit
          requests.push(fetchThingSpeakData(channelId, start, end))
        } else {
          // Diviser en plusieurs requêtes
          let currentStart = startDate
          let currentEnd = addDays(currentStart, maxDaysPerRequest)

          while (currentStart < endDate) {
            // S'assurer que la date de fin ne dépasse pas la date de fin demandée
            if (currentEnd > endDate) {
              currentEnd = endDate
            }

            const formattedStart = format(currentStart, "yyyy-MM-dd'T'HH:mm:ss")
            const formattedEnd = format(currentEnd, "yyyy-MM-dd'T'HH:mm:ss")

            requests.push(fetchThingSpeakData(channelId, formattedStart, formattedEnd))

            // Préparer la prochaine itération
            currentStart = addDays(currentEnd, 1)
            currentEnd = addDays(currentStart, maxDaysPerRequest)
          }
        }

        // Exécuter toutes les requêtes
        const results = await Promise.all(requests)

        // Fusionner les résultats
        const mergedData = mergeChannelData(results)
        setChannelData(mergedData)
      } catch (err) {
        setError("Erreur lors de la récupération des données")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [channelId, start, end])

  return { channelData, isLoading, error }
}

// Fonction pour récupérer les données de ThingSpeak
async function fetchThingSpeakData(channelId: number, start: string, end: string): Promise<ChannelData | null> {
  const response = await fetch(`https://api.thingspeak.com/channels/${channelId}/feeds.json?start=${start}&end=${end}`)
  const data = await response.json()

  if (!data.channel || !data.feeds) {
    return null
  }

  const channelInfo: ChannelData = {
    name: data.channel.name,
    fields: {},
    data: {},
  }

  // Extract field names
  for (let i = 1; i <= 8; i++) {
    const fieldName = data.channel[`field${i}`]
    if (fieldName) {
      channelInfo.fields[`field${i}`] = fieldName
      channelInfo.data[`field${i}`] = []
    }
  }

  // Extract data for each field
  data.feeds.forEach((feed: any) => {
    Object.keys(channelInfo.fields).forEach((fieldKey) => {
      if (feed[fieldKey] !== null) {
        channelInfo.data[fieldKey].push({
          date: feed.created_at,
          value: Number.parseFloat(feed[fieldKey]),
        })
      }
    })
  })

  return channelInfo
}

// Fonction pour fusionner les données de plusieurs requêtes
function mergeChannelData(dataArray: (ChannelData | null)[]): ChannelData | null {
  // Filtrer les résultats null
  const validData = dataArray.filter((data) => data !== null) as ChannelData[]

  if (validData.length === 0) {
    return null
  }

  // Utiliser le premier ensemble de données comme base
  const mergedData: ChannelData = {
    name: validData[0].name,
    fields: { ...validData[0].fields },
    data: {},
  }

  // Initialiser les tableaux de données
  Object.keys(mergedData.fields).forEach((fieldKey) => {
    mergedData.data[fieldKey] = []
  })

  // Fusionner les données de tous les ensembles
  validData.forEach((data) => {
    Object.keys(data.fields).forEach((fieldKey) => {
      if (mergedData.data[fieldKey]) {
        // Ajouter les données au tableau fusionné
        mergedData.data[fieldKey] = [...mergedData.data[fieldKey], ...data.data[fieldKey]]
      }
    })
  })

  // Trier les données par date pour chaque champ
  Object.keys(mergedData.data).forEach((fieldKey) => {
    mergedData.data[fieldKey].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    // Éliminer les doublons potentiels (même timestamp)
    const uniqueData: { date: string; value: number }[] = []
    const dateSet = new Set<string>()

    mergedData.data[fieldKey].forEach((item) => {
      if (!dateSet.has(item.date)) {
        dateSet.add(item.date)
        uniqueData.push(item)
      }
    })

    mergedData.data[fieldKey] = uniqueData
  })

  return mergedData
}
