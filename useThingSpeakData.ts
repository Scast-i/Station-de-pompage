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
        const response = await fetch(
          `https://api.thingspeak.com/channels/${channelId}/feeds.json?start=${start}&end=${end}`,
        )
        const data = await response.json()

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

        setChannelData(channelInfo)
      } catch (err) {
        setError("Erreur lors de la récupération des données")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [channelId, start, end])

  return { channelData, isLoading, error }
}

