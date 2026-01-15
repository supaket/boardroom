"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KPIBar } from "@/components/layout/KPIBar"
import { TeamTab } from "@/components/tabs/TeamTab"
import { BATab } from "@/components/tabs/BATab"
import { ArenaTab } from "@/components/tabs/ArenaTab"
import { LiveArena } from "@/components/tabs/LiveArena"
import { AgentArena } from "@/components/tabs/AgentArena"
import { getStatsSummary, getStatsROI, getAgents } from "@/lib/api"
import type { StatsSummary, ROIStats, Agent } from "@/types"

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return String(n)
}

function Clock() {
  const [time, setTime] = useState("")
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleString("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="font-mono text-white/50 text-sm">{time} ICT</span>
}

export default function Home() {
  const [stats, setStats] = useState<StatsSummary | null>(null)
  const [roi, setRoi] = useState<ROIStats | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [online, setOnline] = useState(false)

  useEffect(() => {
    async function poll() {
      try {
        const [s, r] = await Promise.all([getStatsSummary(), getStatsROI()])
        setStats(s)
        setRoi(r)
        setOnline(true)
      } catch {
        setOnline(false)
      }
    }
    poll()
    const id = setInterval(poll, 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    getAgents().then(setAgents).catch(() => {})
  }, [])

  const totalTokens = stats?.tokensByProvider.reduce((s, p) => s + p.input + p.output, 0) ?? 0
  const totalSkills = agents.reduce((s, a) => s + a.skills_count, 0)
  const withPrompts = agents.filter(a => a.has_system_prompt).length

  const tabs = [
    { key: "boardroom", label: "🌟 Boardroom" },
    { key: "marketing", label: "📣 Marketing" },
    { key: "ba", label: "📋 BA" },
    { key: "dev", label: "💻 Dev" },
    { key: "qa", label: "🧪 QA" },
    { key: "ops", label: "🔧 Ops" },
    { key: "exec", label: "👔 Executive" },
    { key: "biz", label: "📑 Biz Ops" },
    { key: "arena", label: "⚔️ Arena" },
    { key: "live", label: "🌐 Live Arena" },
  ]

  const departments = [
    { name: "Marketing", agents: 4, savings: "~20h/mo", color: "bg-pink-500", width: "100%" },
    { name: "BA/PM", agents: 5, savings: "~60h/mo", color: "bg-purple-500", width: "100%" },
    { name: "Development", agents: 5, savings: "~120h/mo", color: "bg-blue-500", width: "100%" },
    { name: "QA", agents: 5, savings: "~80h/mo", color: "bg-green-500", width: "100%" },
    { name: "Operations", agents: 5, savings: "~100h/mo", color: "bg-amber-500", width: "100%" },
    { name: "Finance/HR/Legal", agents: 6, savings: "~60h/mo", color: "bg-cyan-500", width: "85%" },
    { name: "Executive/Product/CS", agents: 5, savings: "~40h/mo", color: "bg-rose-500", width: "70%" },
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="glass-bright p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              🌟 Enersys AI Boardroom
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${online ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-xs text-white/60">{online ? "Live" : "Offline"}</span>
              <Clock />
            </div>
          </div>
          <a href="/auth/logout" className="text-xs bg-white/10 hover:bg-red-500/30 text-white/60 hover:text-white px-3 py-1.5 rounded-lg transition">
            Logout
          </a>
        </div>

        <Tabs defaultValue="boardroom" className="space-y-4">
          <TabsList className="glass p-1 h-auto flex-wrap gap-1 bg-white/[0.06] w-full justify-start">
            {tabs.map(t => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="text-xs sm:text-sm data-[state=active]:bg-white/15 data-[state=active]:text-white text-white/50 rounded-lg px-3 py-1.5"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="boardroom" className="space-y-4">
            {/* Hero KPIs */}
            <KPIBar items={[
              { label: "Tasks Completed", value: String(stats?.totalTasks ?? 0), color: "text-cyan-400" },
              { label: "Hours Saved", value: `${roi?.today.hoursSaved ?? 0}h`, color: "text-green-400 savings-glow" },
              { label: "Active Agents", value: String(agents.length), color: "text-purple-400" },
              { label: "Total Skills", value: String(totalSkills), color: "text-amber-400" },
              { label: "Efficiency", value: `${roi?.today.roi ?? 0}%`, color: "text-rose-400" },
            ]} />

            {/* Main 3-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: ROI + Tokens + System */}
              <div className="lg:col-span-3 space-y-4">
                <div className="glass p-4 border border-green-500/20">
                  <h3 className="text-xs font-bold text-white/70 mb-2">⏱️ Productivity</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-white/50">Hours Saved Today</span><span className="font-mono text-green-400">{roi?.today.hoursSaved ?? 0}h</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Hours Saved/Week</span><span className="font-mono text-green-400">{roi?.week.hoursSaved ?? 0}h</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Hours Saved/Month</span><span className="font-mono text-green-400">{roi?.month.hoursSaved ?? 0}h</span></div>
                    <div className="border-t border-white/10 pt-1.5 flex justify-between">
                      <span className="text-white/70 font-bold">Mandays Saved</span>
                      <span className="font-mono font-black text-green-400">{Math.round((roi?.month.hoursSaved ?? 0) / 8)}d/mo</span>
                    </div>
                  </div>
                </div>

                <div className="glass p-4">
                  <h3 className="text-xs font-bold text-white/70 mb-2">📊 API Usage</h3>
                  <div className="space-y-2">
                    {stats?.tokensByProvider.map(p => {
                      const maxT = Math.max(...(stats?.tokensByProvider.map(x => x.input + x.output) ?? [1]))
                      const pct = ((p.input + p.output) / maxT * 100)
                      const colors: Record<string, string> = { anthropic: "bg-amber-400", minimax: "bg-blue-400", openai: "bg-green-400", ollama: "bg-purple-400" }
                      return (
                        <div key={p.provider}>
                          <div className="flex justify-between mb-0.5 text-[10px]">
                            <span className="text-white/60 capitalize">{p.provider}</span>
                            <span className="font-mono text-white/40">{p.calls} calls | {fmt(p.input + p.output)} tokens</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1"><div className={`${colors[p.provider] ?? "bg-gray-400"} h-1 rounded-full`} style={{ width: `${pct}%` }} /></div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="glass p-4">
                  <h3 className="text-xs font-bold text-white/70 mb-2">📊 Agent Census</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-white/50">Agents</span><span className="font-mono text-cyan-400 font-bold">{agents.length}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">System Prompts</span><span className="font-mono text-purple-400">{withPrompts}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Total Skills</span><span className="font-mono text-amber-400">{totalSkills}</span></div>
                  </div>
                </div>

                <div className="glass p-4">
                  <h3 className="text-xs font-bold text-white/70 mb-2">🔌 System</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-white/50">Gateway</span><span className={online ? "text-green-400" : "text-red-400"}>{online ? "✅ Online" : "❌ Offline"}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Tasks</span><span className="font-mono text-white/70">{stats?.totalTasks ?? 0}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Tokens</span><span className="font-mono text-white/70">{fmt(totalTokens)}</span></div>
                  </div>
                </div>
              </div>

              {/* Center: Agent Arena */}
              <div className="lg:col-span-6">
                <AgentArena />
              </div>

              {/* Right: Departments + Activity */}
              <div className="lg:col-span-3 space-y-4">
                <div className="glass p-4">
                  <h3 className="text-xs font-bold text-white/70 mb-2">🏢 Departments</h3>
                  <div className="space-y-2">
                    {departments.map(d => (
                      <div key={d.name}>
                        <div className="flex justify-between mb-0.5 text-[10px]">
                          <span className="text-white/60">{d.name} ({d.agents})</span>
                          <span className="font-mono text-white/40">{d.savings}</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5">
                          <div className={`${d.color} h-1.5 rounded-full`} style={{ width: d.width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ba">
            <BATab />
          </TabsContent>
          {["marketing", "dev", "qa", "ops", "exec", "biz"].map(key => (
            <TabsContent key={key} value={key}>
              <TeamTab teamKey={key} />
            </TabsContent>
          ))}

          <TabsContent value="arena">
            <ArenaTab />
          </TabsContent>

          <TabsContent value="live">
            <LiveArena />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
