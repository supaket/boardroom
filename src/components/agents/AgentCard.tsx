"use client"

import { Badge } from "@/components/ui/badge"

const modelColors: Record<string, string> = {
  "Opus 4.6": "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "Sonnet 4.6": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "M2.7": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Local": "bg-green-500/20 text-green-300 border-green-500/30",
}

export function AgentCard({
  name, emoji, role, model, onClick,
}: {
  name: string; emoji: string; role: string; model: string; onClick: () => void
}) {
  const badgeClass = Object.entries(modelColors).find(([k]) => model.includes(k))?.[1] ?? modelColors["Opus 4.6"]

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all w-full text-left cursor-pointer group"
    >
      <span className="text-2xl group-hover:scale-110 transition-transform">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white/90">{name}</div>
        <div className="text-xs text-white/50 truncate">{role}</div>
      </div>
      <Badge variant="outline" className={`text-[10px] shrink-0 ${badgeClass}`}>{model}</Badge>
    </button>
  )
}
