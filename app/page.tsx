"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { channels, type ChannelConfig } from "@/config/channels"
import { useThingSpeakData } from "@/hooks/useThingSpeakData"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Input } from "@/components/ui/input"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"]

export default function ThingSpeakVisualizer() {
  const [selectedChannel, setSelectedChannel] = useState<ChannelConfig>(channels[0])
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("00:00")
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [endTime, setEndTime] = useState("23:59")

  // Récupération des données ThingSpeak
  const { channelData, isLoading, error } = useThingSpeakData(
    selectedChannel.id,
    startDate ? `${format(startDate, "yyyy-MM-dd")}T${startTime}:00` : "",
    endDate ? `${format(endDate, "yyyy-MM-dd")}T${endTime}:59` : "",
  )

  const chartData = useMemo(() => {
    if (!channelData) return { labels: [], datasets: [] }

    // Correction de la logique de labels pour utiliser toutes les dates disponibles
    const allDates = new Set<string>()
    Object.values(channelData.data).forEach((fieldData) => {
      fieldData.forEach((item) => allDates.add(item.date))
    })

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    const labels = sortedDates.map((d) => format(new Date(d), "HH:mm", { locale: fr }))

    const datasets = Object.entries(channelData.fields).map(([fieldKey, fieldName], index) => {
      // Alignement des données sur les dates triées pour un affichage correct
      const dataMap = new Map(channelData.data[fieldKey].map((item) => [item.date, item.value]))

      return {
        label: fieldName,
        data: sortedDates.map((d) => dataMap.get(d) ?? null),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + "40",
        tension: 0.1,
        spanGaps: true,
      }
    })

    return { labels, datasets }
  }, [channelData])

  // Configuration du graphique
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: channelData ? `Station: ${channelData.name}` : "Sélectionnez une station",
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: "Valeurs" },
      },
    },
  }

  return (
    <div className="container mx-auto p-4 max-w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Monitoring Stations de Pompage</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Select
          value={selectedChannel.id.toString()}
          onValueChange={(value) => {
            const channel = channels.find((c) => c.id.toString() === value)!
            setSelectedChannel(channel)
          }}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Sélectionnez une station" />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id.toString()}>
                {channel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start bg-white">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Début"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={fr} />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-[100px] bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start bg-white">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : "Fin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={fr} />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-[100px] bg-white"
          />
        </div>
      </div>

      <div className="h-[65vh] bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        {isLoading && <div className="flex items-center justify-center h-full text-slate-500">Chargement...</div>}
        {error && <div className="flex items-center justify-center h-full text-red-500">{error}</div>}
        {!isLoading && !error && <Line options={chartOptions} data={chartData} />}
      </div>
    </div>
  )
}
