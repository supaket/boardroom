"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AgentCard } from "@/components/agents/AgentCard"
import { AgentDetailDialog } from "@/components/agents/AgentDetailDialog"
import { getAgents, runAgent } from "@/lib/api"
import type { Agent } from "@/types"

interface ArenaMatch {
  id: string
  prompt: string
  agents: { id: string; name: string; emoji: string }[]
  results: { agentId: string; text: string; time: number }[]
  status: "idle" | "running" | "done"
}

export function ArenaTab() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [agentA, setAgentA] = useState("")
  const [agentB, setAgentB] = useState("")
  const [prompt, setPrompt] = useState("")
  const [match, setMatch] = useState<ArenaMatch | null>(null)
  const [history, setHistory] = useState<ArenaMatch[]>([])

  useEffect(() => {
    getAgents().then(setAgents).catch(() => {})
  }, [])

  const agentsWithPrompts = agents.filter(a => a.has_system_prompt)

  async function startMatch() {
    if (!agentA || !agentB || !prompt) return

    const a = agents.find(x => x.id === agentA)!
    const b = agents.find(x => x.id === agentB)!

    const newMatch: ArenaMatch = {
      id: Date.now().toString(),
      prompt,
      agents: [
        { id: a.id, name: a.name, emoji: a.emoji },
        { id: b.id, name: b.name, emoji: b.emoji },
      ],
      results: [],
      status: "running",
    }
    setMatch(newMatch)

    const results: ArenaMatch["results"] = []

    const promises = [agentA, agentB].map(async (agentId) => {
      const start = Date.now()
      try {
        const data = await runAgent(prompt, agentId, `arena-${agentId}-${newMatch.id}`)
        const text = data.status === "ok" ? (data.text ?? JSON.stringify(data.result, null, 2)) : `Error: ${data.message}`
        results.push({ agentId, text, time: Date.now() - start })
      } catch (e) {
        results.push({ agentId, text: `Failed: ${e instanceof Error ? e.message : "Unknown"}`, time: Date.now() - start })
      }
      setMatch(prev => prev ? { ...prev, results: [...results] } : null)
    })

    await Promise.all(promises)
    const doneMatch = { ...newMatch, results, status: "done" as const }
    setMatch(doneMatch)
    setHistory(prev => [doneMatch, ...prev].slice(0, 10))
  }

  const presets = [
    { label: "Scope Analysis", prompt: "วิเคราะห์ scope สำหรับระบบ CRM ของ Enersys Thailand แยก functional/non-functional requirements", a: "analyst", b: "architect" },
    { label: "Budget vs Timeline", prompt: "ประเมินโปรเจกต์ ERP Migration: budget 500K THB, 3 เดือน, ทีม 3 คน เป็นไปได้ไหม?", a: "estimator", b: "planner" },
    { label: "Security vs Speed", prompt: "ออกแบบ authentication system สำหรับ web app ที่ต้องการทั้ง security สูง และ user experience ดี", a: "security", b: "frontend" },
    { label: "Code Review Battle", prompt: "Review FastAPI endpoint นี้: @app.post('/users') async def create(data: dict): db.execute(f'INSERT INTO users VALUES ({data})')", a: "backend", b: "security" },
    { label: "Test Strategy", prompt: "วางแผน test strategy สำหรับ payment gateway integration เน้น reliability", a: "qa-lead", b: "automation" },
    { label: "Deploy Strategy", prompt: "วางแผน deploy ระบบใหม่ไป production โดยไม่ downtime มี 500 active users", a: "deployer", b: "sre" },
  ]

  return (
    <>
      <AgentDetailDialog agentId={selectedAgent} open={!!selectedAgent} onClose={() => setSelectedAgent(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Setup */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass p-5">
            <h3 className="text-sm font-bold text-white/80 mb-3">⚔️ Agent Arena</h3>
            <p className="text-xs text-white/40 mb-4">
              Pick 2 agents, give them the same prompt, compare their responses side-by-side.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Agent A</label>
                <select
                  value={agentA}
                  onChange={e => setAgentA(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
                >
                  <option value="">Select agent...</option>
                  {agentsWithPrompts.map(a => (
                    <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
                  ))}
                </select>
              </div>

              <div className="text-center text-white/30 text-xs font-bold">VS</div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Agent B</label>
                <select
                  value={agentB}
                  onChange={e => setAgentB(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
                >
                  <option value="">Select agent...</option>
                  {agentsWithPrompts.map(a => (
                    <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Enter a challenge for both agents..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 placeholder:text-white/30 resize-none"
                />
              </div>

              <Button
                onClick={startMatch}
                disabled={!agentA || !agentB || !prompt || match?.status === "running"}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white"
              >
                {match?.status === "running" ? "⏳ Running..." : "⚔️ Start Match"}
              </Button>
            </div>
          </div>

          {/* Presets */}
          <div className="glass p-5">
            <h3 className="text-sm font-bold text-white/80 mb-3">🎮 Preset Matches</h3>
            <div className="space-y-2">
              {presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => { setAgentA(p.a); setAgentB(p.b); setPrompt(p.prompt) }}
                  className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-2.5 text-xs transition border border-white/5"
                >
                  <div className="font-semibold text-white/80">{p.label}</div>
                  <div className="text-white/40 mt-0.5 truncate">{p.prompt.slice(0, 60)}...</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-8 space-y-4">
          {match ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {match.agents.map((agent, i) => {
                const result = match.results.find(r => r.agentId === agent.id)
                return (
                  <div key={agent.id} className="glass p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{agent.emoji}</span>
                      <div>
                        <div className="text-sm font-bold text-white/90">{agent.name}</div>
                        {result && (
                          <div className="text-[10px] text-white/40">{(result.time / 1000).toFixed(1)}s</div>
                        )}
                      </div>
                      {i === 0 && <Badge className="ml-auto bg-blue-500/20 text-blue-300 border-blue-500/30">A</Badge>}
                      {i === 1 && <Badge className="ml-auto bg-rose-500/20 text-rose-300 border-rose-500/30">B</Badge>}
                    </div>
                    <ScrollArea className="max-h-[500px]">
                      {result ? (
                        <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono bg-white/5 rounded-lg p-3 border border-white/10">
                          {result.text}
                        </pre>
                      ) : (
                        <div className="text-center py-12 text-white/30 animate-pulse">
                          ⏳ Waiting for response...
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="glass p-12 text-center">
              <div className="text-4xl mb-4">⚔️</div>
              <div className="text-white/40 text-sm">Select 2 agents and a prompt to start a match</div>
              <div className="text-white/30 text-xs mt-2">Or pick a preset from the left panel</div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="glass p-5">
              <h3 className="text-sm font-bold text-white/80 mb-3">📜 Match History</h3>
              <div className="space-y-2">
                {history.map(m => (
                  <div key={m.id} className="bg-white/5 rounded-lg p-2 text-xs flex items-center gap-2">
                    <span>{m.agents[0].emoji} vs {m.agents[1].emoji}</span>
                    <span className="text-white/50 truncate flex-1">{m.prompt.slice(0, 50)}...</span>
                    <span className="text-white/30 shrink-0">
                      {m.results.map(r => `${(r.time / 1000).toFixed(1)}s`).join(" / ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
