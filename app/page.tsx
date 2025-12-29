"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Activity, Droplet, TrendingUp } from "lucide-react"
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
  Filler,
} from "chart.js"
import { Input } from "@/components/ui/input"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const colors = {
  primary: "rgba(20, 184, 166, 1)",
  primaryGlow: "rgba(20, 184, 166, 0.2)",
  secondary: "rgba(96, 165, 250, 1)",
  secondaryGlow: "rgba(96, 165, 250, 0.2)",
  warning: "rgba(251, 191, 36, 1)",
}

export default function ThingSpeakVisualizer() {
  const [selectedChannel, setSelectedChannel] = useState<ChannelConfig>(channels[0])
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("00:00")
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [endTime, setEndTime] = useState("23:59")

  const { channelData, isLoading, error } = useThingSpeakData(
    selectedChannel.id,
    startDate ? `${format(startDate, "yyyy-MM-dd")}T${startTime}:00` : "",
    endDate ? `${format(endDate, "yyyy-MM-dd")}T${endTime}:59` : "",
  )

  const chartData = useMemo(() => {
    if (!channelData) return { labels: [], datasets: [] }

    const allDates = new Set<string>()
    Object.values(channelData.data).forEach((fieldData) => {
      fieldData.forEach((item) => allDates.add(item.date))
    })

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    const labels = sortedDates.map((d) => format(new Date(d), "HH:mm", { locale: fr }))

    const datasets = Object.entries(channelData.fields).map(([fieldKey, fieldName], index) => {
      const dataMap = new Map(channelData.data[fieldKey].map((item) => [item.date, item.value]))

      return {
        label: fieldName,
        data: sortedDates.map((d) => dataMap.get(d) ?? null),
        borderColor: index === 0 ? colors.primary : colors.secondary,
        backgroundColor: index === 0 ? colors.primaryGlow : colors.secondaryGlow,
        tension: 0.4,
        spanGaps: true,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      }
    })

    return { labels, datasets }
  }, [channelData])

  const metrics = useMemo(() => {
    if (!channelData) return { currentLevel: 0, avgLevel: 0, maxLevel: 0 }

    const firstField = Object.keys(channelData.data)[0]
    const data = channelData.data[firstField] || []

    const values = data.map((d) => d.value)
    const currentLevel = values[values.length - 1] || 0
    const avgLevel = values.reduce((a, b) => a + b, 0) / values.length || 0
    const maxLevel = Math.max(...values, 0)

    return { currentLevel, avgLevel, maxLevel }
  }, [channelData])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: "rgb(209, 213, 219)",
          font: { size: 12, family: "Inter" },
          padding: 16,
          usePointStyle: true,
        },
      },
      title: { display: false },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(30, 41, 59, 0.95)",
        titleColor: "rgb(209, 213, 219)",
        bodyColor: "rgb(209, 213, 219)",
        borderColor: "rgba(20, 184, 166, 0.3)",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
          drawBorder: false,
        },
        ticks: {
          color: "rgb(148, 163, 184)",
          font: { size: 11 },
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
          drawBorder: false,
        },
        ticks: {
          color: "rgb(148, 163, 184)",
          font: { size: 11 },
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Droplet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Station de Pompage</h1>
                <p className="text-sm text-muted-foreground">Surveillance en Temps Réel</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Activity className="w-3 h-3 mr-1" />
              En Ligne
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Contrôles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={selectedChannel.id.toString()}
                onValueChange={(value) => {
                  const channel = channels.find((c) => c.id.toString() === value)!
                  setSelectedChannel(channel)
                }}
              >
                <SelectTrigger className="bg-background">
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
                    <Button variant="outline" className="w-full justify-start bg-background">
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
                  className="w-[100px] bg-background"
                />
              </div>

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-background">
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
                  className="w-[100px] bg-background"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Niveau Actuel</CardTitle>
              <Droplet className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metrics.currentLevel.toFixed(2)} m</div>
              <p className="text-xs text-muted-foreground mt-1">Dernière mesure</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Niveau Moyen</CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metrics.avgLevel.toFixed(2)} m</div>
              <p className="text-xs text-muted-foreground mt-1">Sur la période sélectionnée</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Niveau Maximum</CardTitle>
              <Activity className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metrics.maxLevel.toFixed(2)} m</div>
              <p className="text-xs text-muted-foreground mt-1">Pic enregistré</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">
              {channelData ? `Station: ${channelData.name}` : "Graphique des Niveaux"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px]">
              {isLoading && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Chargement des données...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-destructive font-medium">{error}</p>
                    <p className="text-sm text-muted-foreground mt-2">Veuillez réessayer ultérieurement</p>
                  </div>
                </div>
              )}
              {!isLoading && !error && <Line options={chartOptions} data={chartData} />}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
