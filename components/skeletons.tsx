"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-[#C5A059]/30">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="py-4 px-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-[#E5E0D8]">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="py-4 px-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <Card className="bg-white border-[#E5E0D8]">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}

export function PodiumSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-white border-[#E5E0D8]">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gray-200 animate-pulse mb-4" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mx-auto mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mx-auto" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <Card className="bg-white border-[#E5E0D8]">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-12 mb-1" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

export function MatchCardSkeleton() {
  return (
    <Card className="bg-white border-[#E5E0D8]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-32" />
          </div>
          <div className="text-center px-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
          </div>
          <div className="flex-1 text-right">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24 ml-auto mb-2" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-32 ml-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
    </div>
  )
}

export function RankingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Card className="bg-white border-[#E5E0D8]">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-40" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={10} cols={8} />
        </CardContent>
      </Card>
    </div>
  )
}
