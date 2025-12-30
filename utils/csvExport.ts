import type { ProcessedData } from "@/config/channels"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function convertToCSV(data: ProcessedData[]): string {
  if (data.length === 0) return ""

  // Définir les en-têtes du CSV
  const headers = [
    "Date",
    "Heure",
    "Niveau (m)",
    "Niveau filtré (m)",
    "Débit Entrée (m³/h)",
    "Débit Sortie (m³/h)",
    "Volume cumulé (m³)",
  ]

  // Créer la ligne d'en-tête
  let csvContent = headers.join(";") + "\n"

  // Ajouter les données
  data.forEach((row) => {
    const date = format(row.date, "dd/MM/yyyy", { locale: fr })
    const time = format(row.date, "HH:mm:ss", { locale: fr })
    const level = row.level.toFixed(3)
    const filteredLevel = row.filteredLevel ? row.filteredLevel.toFixed(3) : ""
    const qEntree = row.Q_entree.toFixed(2)
    const qSortie = row.Q_sortie.toFixed(2)
    const volumeIndex = row.volumeIndex.toFixed(2)

    const csvRow = [date, time, level, filteredLevel, qEntree, qSortie, volumeIndex].join(";")
    csvContent += csvRow + "\n"
  })

  return csvContent
}

export function downloadCSV(data: ProcessedData[], filename: string): void {
  const csvContent = convertToCSV(data)

  // Créer un Blob avec le contenu CSV
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  // Créer un lien de téléchargement
  const link = document.createElement("a")

  // Créer une URL pour le Blob
  const url = URL.createObjectURL(blob)

  // Configurer le lien
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  // Ajouter le lien au DOM
  document.body.appendChild(link)

  // Cliquer sur le lien pour déclencher le téléchargement
  link.click()

  // Nettoyer
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
