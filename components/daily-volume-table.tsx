import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DailyVolumeTableProps {
  dailyVolumes: { date: Date; volume: number }[]
}

export function DailyVolumeTable({ dailyVolumes }: DailyVolumeTableProps) {
  if (dailyVolumes.length === 0) {
    return <p className="text-center text-muted-foreground">Aucune donnée disponible</p>
  }

  return (
    <div className="overflow-auto max-h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Volume (m³)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dailyVolumes.map((item) => (
            <TableRow key={format(item.date, "yyyy-MM-dd")}>
              <TableCell>{format(item.date, "dd/MM/yyyy", { locale: fr })}</TableCell>
              <TableCell className="text-right font-medium">{item.volume.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
