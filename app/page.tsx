"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, differenceInDays } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, TrendingUp, TrendingDown, BarChart, Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { channels, type Channel } from "@/config/channels"
import { useThingSpeakData } from "@/hooks/useThingSpeakData"
import { useFlowCalculations } from "@/hooks/useFlowCalculations"
import { downloadCSV } from "@/utils/csvExport"
import { DailyVolumeTable } from "@/components/daily-volume-table"
import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"]

export default function ThingSpeakVisualizer() {
  const [selectedChannel, setSelectedChannel] = useState<Channel>(channels[0])
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("00:00")
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [endTime, setEndTime] = useState("23:59")
  const [instantFlowField, setInstantFlowField] = useState("field6")
  const [flowIndexField, setFlowIndexField] = useState("field5")
  const [activeTab, setActiveTab] = useState("graphique")

  // Calculer la différence en jours pour l'indicateur
  const daysDifference = useMemo(() => {
    if (!startDate || !endDate) return 0
    return differenceInDays(endDate, startDate) + 1
  }, [startDate, endDate])

  // Récupération des données ThingSpeak
  const { channelData, isLoading, error } = useThingSpeakData(
    selectedChannel.id,
    startDate ? `${format(startDate, "yyyy-MM-dd", { locale: fr })}T${startTime}:00` : "",
    endDate ? `${format(endDate, "yyyy-MM-dd", { locale: fr })}T${endTime}:59` : "",
  )

  // Calculs des débits
  const { processedData, averageQEntree, totalQSortie, volumeIndex, dailyVolumes } = useFlowCalculations(
    channelData?.data.field1 || [],
    selectedChannel,
  )

  // Fonction pour télécharger les données en CSV
  const handleDownloadCSV = () => {
    if (processedData.length === 0) return

    const filename = `${selectedChannel.name}_${format(new Date(), "yyyy-MM-dd_HH-mm", { locale: fr })}.csv`
    downloadCSV(processedData, filename)
  }

  // Fonction pour télécharger les volumes journaliers en CSV
  const handleDownloadDailyVolumesCSV = () => {
    if (dailyVolumes.length === 0) return

    const csvContent =
      "Date;Volume (m³)\n" +
      dailyVolumes
        .map((item) => `${format(item.date, "dd/MM/yyyy", { locale: fr })};${item.volume.toFixed(2)}`)
        .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${selectedChannel.name}_volumes_journaliers.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

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
  }, [channelData, processedData, selectedChannel.enableFiltering, selectedChannel.enableFlowCalculation])

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

  // Données pour le graphique des volumes journaliers
  const dailyVolumeChartData = useMemo(() => {
    // Limiter le nombre de jours affichés si nécessaire pour éviter la surcharge du graphique
    const maxBarsToShow = 31 // Limiter à 31 jours maximum pour la lisibilité

    let volumesToShow = [...dailyVolumes]
    if (volumesToShow.length > maxBarsToShow) {
      volumesToShow = volumesToShow.slice(Math.max(0, volumesToShow.length - maxBarsToShow))
    }

    return {
      labels: volumesToShow.map((item) => format(item.date, "dd/MM", { locale: fr })),
      datasets: [
        {
          label: "Volume journalier (m³)",
          data: volumesToShow.map((item) => item.volume),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    }
  }, [dailyVolumes])

  const dailyVolumeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Volumes journaliers",
      },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            if (items.length > 0) {
              const index = items[0].dataIndex
              const date = dailyVolumes[index]?.date
              return date ? format(date, "dd/MM/yyyy", { locale: fr }) : ""
            }
            return ""
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Volume (m³)",
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  }

  // Calcul de statistiques sur les volumes journaliers
  const volumeStats = useMemo(() => {
    if (dailyVolumes.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0 }
    }

    const total = dailyVolumes.reduce((sum, item) => sum + item.volume, 0)
    const average = total / dailyVolumes.length
    const max = Math.max(...dailyVolumes.map((item) => item.volume))
    const min = Math.min(...dailyVolumes.map((item) => item.volume))

    return { total, average, max, min }
  }, [dailyVolumes])

  return (
    <div className="container mx-auto p-4 max-w-full overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-4">Station de Pompage - Vision </h1>

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
                  {channel.usePumpFlow && <span className="text-xs text-purple-600">(Pompes)</span>}
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

      {/* Indicateur de période */}
      {daysDifference > 7 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              Période sélectionnée: <strong>{daysDifference} jours</strong>. Les données seront chargées par tranches de
              7 jours.
            </p>
          </div>
        </div>
      )}

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin mr-2" />
          <p className="text-blue-800">
            Chargement des données en cours... {daysDifference > 7 ? `(${Math.ceil(daysDifference / 7)} requêtes)` : ""}
          </p>
        </div>
      )}

      {/* Indicateurs de débit et bouton d'export */}
      {selectedChannel.enableFlowCalculation && channelData && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col justify-center items-center">
            <Button
              onClick={handleDownloadCSV}
              disabled={processedData.length === 0 || isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              Exporter CSV
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">{processedData.length} points de données</p>
          </div>
        </div>
      )}

      {/* Information sur les pompes si applicable */}
      {selectedChannel.usePumpFlow && selectedChannel.pumps && channelData && !isLoading && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">État des pompes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {selectedChannel.pumps.map((pump, index) => {
              const fieldKey = `field${index + 2}`
              const pumpState =
                channelData.data[fieldKey] && channelData.data[fieldKey].length > 0
                  ? channelData.data[fieldKey][channelData.data[fieldKey].length - 1].value
                  : 0

              return (
                <div key={pump.id} className="flex items-center justify-between p-2 border rounded">
                  <span>
                    Pompe {pump.id} ({pump.flowRate} m³/h):
                  </span>
                  <span className={pumpState === 1 ? "text-green-600 font-bold" : "text-red-600"}>
                    {pumpState === 1 ? "Marche" : "Arrêt"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Onglets pour graphique et volumes journaliers */}
      {selectedChannel.enableFlowCalculation && !isLoading && !error && (
        <Tabs defaultValue="graphique" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="graphique">Graphique</TabsTrigger>
            <TabsTrigger value="volumes">Volumes Journaliers</TabsTrigger>
          </TabsList>
          <TabsContent value="graphique" className="mt-2">
            <div className="h-[50vh] md:h-[60vh] bg-white p-4 rounded-lg border">
              <Line options={chartOptions} data={chartData} />
            </div>
          </TabsContent>
          <TabsContent value="volumes" className="mt-2">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Volumes journaliers</h3>
                <Button
                  onClick={handleDownloadDailyVolumesCSV}
                  disabled={dailyVolumes.length === 0}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exporter CSV
                </Button>
              </div>

              {dailyVolumes.length > 0 ? (
                <>
                  {/* Statistiques des volumes journaliers */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-xs font-semibold text-blue-800">Volume Total</h4>
                      <p className="text-xl font-bold text-blue-600">{volumeStats.total.toFixed(2)} m³</p>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-xs font-semibold text-green-800">Volume Moyen</h4>
                      <p className="text-xl font-bold text-green-600">{volumeStats.average.toFixed(2)} m³/jour</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="text-xs font-semibold text-amber-800">Volume Max</h4>
                      <p className="text-xl font-bold text-amber-600">{volumeStats.max.toFixed(2)} m³</p>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="text-xs font-semibold text-purple-800">Volume Min</h4>
                      <p className="text-xl font-bold text-purple-600">{volumeStats.min.toFixed(2)} m³</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-[400px]">
                      <Bar options={dailyVolumeChartOptions} data={dailyVolumeChartData} />
                      {dailyVolumes.length > 31 && (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Affichage limité aux {Math.min(31, dailyVolumes.length)} derniers jours pour la lisibilité
                        </p>
                      )}
                    </div>
                    <div>
                      <DailyVolumeTable dailyVolumes={dailyVolumes} />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center py-8 text-muted-foreground">Aucune donnée de volume journalier disponible</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Graphique principal (affiché uniquement si les onglets ne sont pas disponibles) */}
      {(!selectedChannel.enableFlowCalculation || isLoading || error) && (
        <div className="mt-4 h-[50vh] md:h-[60vh] bg-white p-4 rounded-lg border">
          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
              <p className="text-center">
                Chargement des données...
                {daysDifference > 7 && (
                  <span className="block text-sm text-gray-500 mt-2">
                    Période de {daysDifference} jours - Traitement par tranches de 7 jours
                  </span>
                )}
              </p>
            </div>
          )}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {!isLoading && !error && <Line options={chartOptions} data={chartData} />}
        </div>
      )}
    </div>
  )
}
