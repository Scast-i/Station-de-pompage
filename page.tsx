"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { channels } from "../config/channels"
import { useThingSpeakData } from "../hooks/useThingSpeakData"
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

export default function ThingSpeakVisualizer() {
  const [selectedChannel, setSelectedChannel] = useState(channels[0].id)
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("00:00")
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [endTime, setEndTime] = useState("23:59")
  const [instantFlowField, setInstantFlowField] = useState("field6")
  const [flowIndexField, setFlowIndexField] = useState("field5")

  const { channelData, isLoading, error } = useThingSpeakData(
    selectedChannel,
    startDate ? `${format(startDate, "yyyy-MM-dd")}T${startTime}:00` : "",
    endDate ? `${format(endDate, "yyyy-MM-dd")}T${endTime}:59` : "",
  )

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: channelData ? `Données pour ${channelData.name}` : "Chargement...",
      },
    },
  }

  const chartData = channelData
    ? {
        labels: channelData.data[Object.keys(channelData.data)[0]].map((item) =>
          format(new Date(item.date), "dd/MM/yyyy HH:mm"),
        ),
        datasets: Object.entries(channelData.fields).map(([fieldKey, fieldName]) => ({
          label: fieldName,
          data: channelData.data[fieldKey].map((item) => item.value),
          borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
          backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.5)`,
        })),
      }
    : { labels: [], datasets: [] }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Station de Pompage</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Select onValueChange={(value) => setSelectedChannel(Number.parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez une chaîne" />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id.toString()}>
                {channel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-[280px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Date de début</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-[150px]" />
        </div>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn("w-[280px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Date de fin</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-[150px]" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Select onValueChange={setInstantFlowField} defaultValue={instantFlowField}>
          <SelectTrigger>
            <SelectValue placeholder="Champ pour débit instantané" />
          </SelectTrigger>
          <SelectContent>
            {channelData &&
              Object.entries(channelData.fields).map(([fieldKey, fieldName]) => (
                <SelectItem key={fieldKey} value={fieldKey}>
                  {fieldName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setFlowIndexField} defaultValue={flowIndexField}>
          <SelectTrigger>
            <SelectValue placeholder="Champ pour index débit" />
          </SelectTrigger>
          <SelectContent>
            {channelData &&
              Object.entries(channelData.fields).map(([fieldKey, fieldName]) => (
                <SelectItem key={fieldKey} value={fieldKey}>
                  {fieldName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading && <p>Chargement des données...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {channelData && (
        <>
          <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Débit instantané</h2>
              <p className="text-2xl font-bold">
                {channelData.data[instantFlowField][channelData.data[instantFlowField].length - 1].value.toFixed(2)}{" "}
                m³/h
              </p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Index débit</h2>
              <p className="text-2xl font-bold">
                {channelData.data[flowIndexField][channelData.data[flowIndexField].length - 1].value.toFixed(2)} m³
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Line options={chartOptions} data={chartData} />
          </div>
        </>
      )}
    </div>
  )
}

