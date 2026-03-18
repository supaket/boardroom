"use client"

import { useEffect, useState } from "react"
import { getStatsMessages, getStatsAgents } from "@/lib/api"
import type { AgentTaskStats } from "@/types"

const AGENTS: Record<string, { emoji: string; color: string; model: string }> = {
  invoker:   { emoji: "🏛️", color: "from-violet-600 to-indigo-700", model: "Sonnet 4.6" },
  oracle:    { emoji: "⚔️", color: "from-rose-600 to-pink-700", model: "Opus 4.6" },
  coder:     { emoji: "💻", color: "from-cyan-600 to-blue-700", model: "Opus 4.6" },
  tinker:    { emoji: "🔧", color: "from-sky-600 to-cyan-700", model: "Qwen 3 14B" },
  rubick:    { emoji: "🪄", color: "from-fuchsia-600 to-purple-700", model: "Opus 4.6" },
  zeus:      { emoji: "⚡", color: "from-amber-500 to-orange-600", model: "GPT 5.4" },
  alchemist: { emoji: "⚗️", color: "from-emerald-600 to-green-700", model: "Qwen 3 14B" },
  dazzle:    { emoji: "✨", color: "from-pink-500 to-rose-600", model: "Sonnet 4.6" },
  bounty:    { emoji: "🎯", color: "from-orange-500 to-red-600", model: "M2.7" },
  closer:    { emoji: "🤝", color: "from-red-600 to-orange-700", model: "Opus 4.6" },
  secretary: { emoji: "📑", color: "from-sky-400 to-blue-500", model: "M2.7" },
}

interface Bubble { id: number; agentId: string; text: string; createdAt: number }
interface EventItem { from: string; to: string; message: string; time: string }

export function AgentArena() {
  const [agentStats, setAgentStats] = useState<Record<string, number>>({})
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [lastMsgIds, setLastMsgIds] = useState<Set<number>>(new Set())
  let bubbleId = 0

  useEffect(() => {
    getStatsAgents().then(agents => {
      const map: Record<string, number> = {}
      agents.forEach((a: AgentTaskStats) => { map[a.agent_id] = a.tasks })
      setAgentStats(map)
    }).catch(() => {})
    const id = setInterval(() => {
      getStatsAgents().then(agents => {
        const map: Record<string, number> = {}
        agents.forEach((a: AgentTaskStats) => { map[a.agent_id] = a.tasks })
        setAgentStats(map)
      }).catch(() => {})
    }, 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    async function pollMessages() {
      try {
        const msgs = await getStatsMessages(20) as any[]
        const newMsgs = msgs.filter(m => !lastMsgIds.has(m.id))
        if (newMsgs.length > 0) {
          setLastMsgIds(new Set(msgs.map(m => m.id)))
          newMsgs.forEach(m => {
            const from = m.direction === "incoming" ? "user" : (m.agent_id || "invoker")
            if (AGENTS[from]) {
              setBubbles(prev => [...prev.slice(-3), { id: bubbleId++, agentId: from, text: (m.content || "").slice(0, 50), createdAt: Date.now() }])
              setEvents(prev => [{
                from, to: "ceo",
                message: (m.content || "").slice(0, 80),
                time: m.timestamp ? new Date(m.timestamp + "Z").toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }) : "--",
              }, ...prev].slice(0, 20))
            }
          })
        }
      } catch {}
    }
    pollMessages()
    const id = setInterval(pollMessages, 15000)
    return () => clearInterval(id)
  }, [lastMsgIds])

  useEffect(() => {
    const id = setInterval(() => setBubbles(prev => prev.filter(b => Date.now() - b.createdAt < 5000)), 500)
    return () => clearInterval(id)
  }, [])

  const agentKeys = Object.keys(AGENTS)

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-white/90">🎯 Agent Network</h2>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
        </span>
      </div>

      <div className="relative aspect-square max-h-[420px] mx-auto flex items-center justify-center">
        {/* CEO Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-2xl flex items-center justify-center z-30 border-2 border-yellow-300/50" style={{ boxShadow: "0 0 30px rgba(251,191,36,0.3)" }}>
          <div className="text-center"><div className="text-lg sm:text-xl">👑</div><div className="text-[8px] sm:text-[10px] font-bold text-white">CEO</div></div>
        </div>

        {/* Agent Nodes */}
        {agentKeys.map((id, i) => {
          const cfg = AGENTS[id]
          const angle = (i / agentKeys.length) * Math.PI * 2 - Math.PI / 2
          const x = 50 + Math.cos(angle) * 38
          const y = 50 + Math.sin(angle) * 38
          const tasks = agentStats[id] ?? 0
          const bubble = bubbles.find(b => b.agentId === id)

          return (
            <div key={id} className="absolute z-20" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}>
              <div className={`w-14 h-14 sm:w-[72px] sm:h-[72px] bg-gradient-to-br ${cfg.color} rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center border border-white/20 transition-all hover:scale-110`}>
                <div className="text-center px-0.5">
                  <div className="text-base sm:text-lg">{cfg.emoji}</div>
                  <div className="text-[8px] sm:text-[9px] font-bold text-white capitalize leading-tight">{id}</div>
                </div>
                {tasks > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-[8px] font-extrabold flex items-center justify-center bg-gradient-to-r from-amber-500 to-red-500 text-white border border-black/30">{tasks}</div>
                )}
              </div>
              {bubble && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-violet-500/90 backdrop-blur text-white text-[9px] px-2 py-1 rounded-lg max-w-[140px] border border-white/20 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-1">
                  {bubble.text.slice(0, 40)}...
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Activity bar */}
      {events.length > 0 && (
        <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
          {events.slice(0, 5).map((e, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/50">
              <span>{AGENTS[e.from]?.emoji ?? "📱"}</span>
              <span className="text-white/70 capitalize">{e.from}</span>
              <span className="text-white/20">→</span>
              <span className="text-white/40 truncate flex-1">{e.message}</span>
              <span className="font-mono text-white/30 shrink-0">{e.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
