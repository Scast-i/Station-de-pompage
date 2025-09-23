"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, TrendingUp, TrendingDown, BarChart, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { channels, type ChannelConfig } from "@/config/channels"
import { useThingSpeakData } from "@/hooks/useThingSpeakData"
import { useFlowCalculations } from "@/hooks/useFlowCalculations"
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
    startDate ? `${format(startDate, "yyyy-MM-dd", { locale: fr })}T${startTime}:00` : "",
    endDate ? `${format(endDate, "yyyy-MM-dd", { locale: fr })}T${endTime}:59` : "",
  )

  // Calculs des débits
  const { processedData, averageQEntree, totalQSortie, volumeIndex } = useFlowCalculations(
    channelData?.data.field1 || [],
    selectedChannel,
  )

  const chartData = useMemo(() => {
    if (!channelData) return { labels: [], datasets: [] }

    const labels =
      channelData.data[Object.keys(channelData.data)[0]]?.map((item) =>
        format(new Date(item.date), "dd/MM/yyyy HH:mm", { locale: fr }),
      ) || []

    const datasets = [
      ...Object.entries(channelData.fields).flatMap(([fieldKey, fieldName], index) => {
        if (fieldKey === "field1") {
          // Niveau
          return [
            {
              label: "Niveau brut",
              data: channelData.data[fieldKey].map((item) => item.value / 100),
              borderColor: colors[index % colors.length],
              backgroundColor: colors[index % colors.length] + "80",
              yAxisID: "y_level",
            },
            ...(selectedChannel.enableFiltering
              ? [
                  {
                    label: "Niveau filtré",
                    data: processedData.map((d) => d.filteredLevel),
                    borderColor: "rgba(255, 99, 132, 1)",
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderDash: [5, 5],
                    yAxisID: "y_level",
                  },
                ]
              : []),
          ]
        } else {
          // Autres champs
          return {
            label: fieldName,
            data: channelData.data[fieldKey].map((item) => item.value),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + "80",
            yAxisID: "y",
          }
        }
      }),
      ...(selectedChannel.enableFlowCalculation
        ? [
            {
              label: "Débit Entrée (Qe)",
              data: processedData.map((d) => d.Q_entree),
              borderColor: "#3b82f6",
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              yAxisID: "y",
            },
            {
              label: "Débit Sortie (Qs)",
              data: processedData.map((d) => d.Q_sortie),
              borderColor: "#ef4444",
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              yAxisID: "y",
            },
          ]
        : []),
    ]

    return { labels, datasets }
  }, [channelData, processedData, selectedChannel.enableFlowCalculation])

  // Configuration du graphique
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: channelData ? `Données pour ${channelData.name}` : "Chargement...",
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        position: "right",
        title: {
          display: true,
          text: "Débit (m³/h)",
        },
      },
      y_level: {
        position: "left",
        title: {
          display: true,
          text: "Niveau (m)",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  return (
    <div className="container mx-auto p-4 max-w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-4">Station de Pompage - Vision</h1>

      {/* Sélection des paramètres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Select
          value={selectedChannel.id.toString()}
          onValueChange={(value) => {
            const channel = channels.find((c) => c.id.toString() === value)!
            setSelectedChannel(channel)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez une chaîne" />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id.toString()}>
                <div className="flex items-center gap-2">
                  <span>{channel.name}</span>
                  {channel.enableFlowCalculation && (
                    <span className="text-xs text-green-600">({channel.surface}m²)</span>
                  )}
                  {channel.enableFiltering && <span className="text-xs text-blue-600">(Filtré)</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sélection date/heure début */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: fr }) : <span>Date de début</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={fr} />
            </PopoverContent>
          </Popover>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-[100px]" />
        </div>

        {/* Sélection date/heure fin */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: fr }) : <span>Date de fin</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={fr} />
            </PopoverContent>
          </Popover>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-[100px]" />
        </div>
      </div>

      {/* Indicateurs de débit */}
      {selectedChannel.enableFlowCalculation && channelData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-800">Débit Entrée Moyen</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{averageQEntree.toFixed(2)} m³/h</p>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-semibold text-red-800">Débit Instantané</h3>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {processedData.length > 0 ? processedData[processedData.length - 1].Q_sortie.toFixed(2) : "N/A"} m³/h
            </p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <BarChart className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-semibold text-green-800">Index de Volume</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{volumeIndex.toFixed(2)} m³</p>
          </div>
        </div>
      )}

      {/* Graphique principal */}
      <div className="mt-4 h-[50vh] md:h-[60vh] bg-white p-4 rounded-lg border">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Chargement des données...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
              <p className="text-sm mt-2">Vérifiez votre connexion internet et réessayez.</p>
            </div>
          </div>
        )}
        {!isLoading && !error && channelData && <Line options={chartOptions} data={chartData} />}
        {!isLoading && !error && !channelData && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Aucune donnée disponible pour cette période.</p>
          </div>
        )}
      </div>
    </div>
  )
}
