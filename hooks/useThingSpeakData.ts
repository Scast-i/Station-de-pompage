"use client"

import { useState, useEffect } from "react"

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
        // Use a CORS proxy for the API call
        const proxyUrl = "https://api.allorigins.win/raw?url="
        const targetUrl = `https://api.thingspeak.com/channels/${channelId}/feeds.json?start=${start}&end=${end}`
        const response = await fetch(proxyUrl + encodeURIComponent(targetUrl))

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (!data.channel || !data.feeds) {
          throw new Error("Réponse de l'API invalide")
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
            if (feed[fieldKey] !== null && feed[fieldKey] !== undefined) {
              channelInfo.data[fieldKey].push({
                date: feed.created_at,
                value: Number.parseFloat(feed[fieldKey]),
              })
            }
          })
        })

        setChannelData(channelInfo)
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err)
        setError("Erreur lors de la récupération des données. Vérifiez votre connexion internet.")
      } finally {
        setIsLoading(false)
      }
    }

    if (channelId && start && end) {
      fetchData()
    }
  }, [channelId, start, end])

  return { channelData, isLoading, error }
}
