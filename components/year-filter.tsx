"use client"

import { useData } from "@/contexts/data-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "lucide-react"

export function YearFilter() {
  const { selectedYear, setSelectedYear, availableYears } = useData()

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-[#967948]" />
      <Select value={selectedYear} onValueChange={setSelectedYear}>
        <SelectTrigger className="w-[160px] bg-white border-[#E5E0D8] text-[#2B2B2B]">
          <SelectValue placeholder="Selecione o ano" />
        </SelectTrigger>
        <SelectContent className="bg-white border-[#E5E0D8]">
          <SelectItem value="all">Histórico Geral</SelectItem>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year}>
              Temporada {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
