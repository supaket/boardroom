"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { getAgents, runAgent } from "@/lib/api"
import type { Agent } from "@/types"

interface AgentNode {
  id: string
  name: string
  emoji: string
  x: number
  y: number
  active: boolean
  speaking: boolean
  message: string
  color: string
}

interface CommLine {
  id: string
  from: string
  to: string
  timestamp: number
}

interface ChatMessage {
  agentId: string
  emoji: string
  name: string
  text: string
  timestamp: number
  replyTo?: string
}

const AGENT_COLORS: Record<string, string> = {
  analyst: "#8b5cf6", architect: "#6366f1", planner: "#3b82f6", estimator: "#f59e0b",
  scribe: "#10b981", frontend: "#ec4899", backend: "#06b6d4", dba: "#8b5cf6",
  devops: "#f97316", tester: "#84cc16", "qa-lead": "#14b8a6", automation: "#6366f1",
  security: "#ef4444", performance: "#eab308", uat: "#22c55e", sre: "#f43f5e",
  infra: "#0ea5e9", deployer: "#a855f7", support: "#f472b6", monitor: "#38bdf8",
  ceo: "#fbbf24", cfo: "#34d399", product: "#f87171", legal: "#818cf8",
  accountant: "#fb923c", invoker: "#a78bfa", dazzle: "#f9a8d4", closer: "#fb7185",
  bounty: "#fdba74", secretary: "#67e8f9",
}

const scenarios = [
  {
    name: "New Project Kickoff",
    description: "BA team analyzes requirements, estimates cost, and plans timeline",
    agents: ["analyst", "architect", "estimator", "planner", "scribe"],
    flow: [
      { from: "analyst", to: "architect", prompt: "วิเคราะห์ scope สำหรับโปรเจกต์ CRM ใหม่ของ Enersys Thailand สรุปสั้นๆ 3 บรรทัด" },
      { from: "architect", to: "estimator", prompt: "จาก scope ที่ได้ ออกแบบ tech stack สั้นๆ: frontend, backend, database 3 บรรทัด" },
      { from: "estimator", to: "planner", prompt: "ประเมิน budget สำหรับโปรเจกต์ CRM: manday และค่าใช้จ่ายรวม สรุป 3 บรรทัด" },
      { from: "planner", to: "scribe", prompt: "วาง timeline 3 phases สำหรับโปรเจกต์ CRM สรุปสั้นๆ 3 บรรทัด" },
      { from: "scribe", to: "analyst", prompt: "สรุป MoM: scope, tech stack, budget, timeline ของโปรเจกต์ CRM สั้นๆ 3 บรรทัด" },
    ],
  },
  {
    name: "Production Incident",
    description: "Ops team responds to a production outage",
    agents: ["sre", "monitor", "deployer", "support", "dba"],
    flow: [
      { from: "monitor", to: "sre", prompt: "Alert: API response time > 5s, error rate 15% สรุปสถานการณ์สั้นๆ 3 บรรทัด" },
      { from: "sre", to: "dba", prompt: "ตรวจสอบ database performance เบื้องต้น: connections, slow queries, disk usage สรุป 3 บรรทัด" },
      { from: "dba", to: "deployer", prompt: "พบ slow query ใน orders table ต้อง deploy hotfix เพื่อเพิ่ม index สรุปแผน 3 บรรทัด" },
      { from: "deployer", to: "support", prompt: "Deploy hotfix สำเร็จ อธิบายสิ่งที่เปลี่ยนแปลงสั้นๆ 3 บรรทัด" },
      { from: "support", to: "monitor", prompt: "แจ้งลูกค้าว่าปัญหาแก้ไขแล้ว สรุป status update สั้นๆ 3 บรรทัด" },
    ],
  },
  {
    name: "Sales Pipeline",
    description: "Marketing captures lead, sales closes the deal",
    agents: ["dazzle", "bounty", "closer", "accountant", "legal"],
    flow: [
      { from: "dazzle", to: "bounty", prompt: "มี lead ใหม่จาก Facebook สนใจ UPS สำหรับโรงงาน สรุปข้อมูล lead สั้นๆ 3 บรรทัด" },
      { from: "bounty", to: "closer", prompt: "Lead score 85/100 พร้อมปิดการขาย budget ลูกค้า 500K สรุป strategy สั้นๆ 3 บรรทัด" },
      { from: "closer", to: "legal", prompt: "ลูกค้าตกลง ต้องการ service agreement สำหรับ UPS installation 500K THB สรุปสั้นๆ 3 บรรทัด" },
      { from: "legal", to: "accountant", prompt: "สัญญาลงนามแล้ว ต้องออก invoice งวดแรก 50% = 250K THB สรุปสั้นๆ 3 บรรทัด" },
      { from: "accountant", to: "dazzle", prompt: "Invoice ส่งแล้ว deal closed ฿500K สรุป success story สั้นๆ สำหรับ social media 3 บรรทัด" },
    ],
  },
  {
    name: "Sprint Delivery",
    description: "Dev team builds, QA tests, DevOps deploys",
    agents: ["frontend", "backend", "tester", "qa-lead", "deployer"],
    flow: [
      { from: "frontend", to: "backend", prompt: "สร้าง UI components สำหรับ dashboard เสร็จแล้ว ต้องการ API endpoints อะไรบ้าง สรุป 3 บรรทัด" },
      { from: "backend", to: "tester", prompt: "API endpoints พร้อมแล้ว 5 endpoints ต้อง test อะไรบ้าง สรุป 3 บรรทัด" },
      { from: "tester", to: "qa-lead", prompt: "Test results: 48 passed, 2 failed สรุป findings สั้นๆ 3 บรรทัด" },
      { from: "qa-lead", to: "deployer", prompt: "QA approved release, 2 minor bugs fixed, ready to deploy สรุป 3 บรรทัด" },
      { from: "deployer", to: "frontend", prompt: "Deployed to production สำเร็จ v2.1.0 สรุป release notes สั้นๆ 3 บรรทัด" },
    ],
  },
]

export function LiveArena() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<AgentNode[]>([])
  const [lines, setLines] = useState<CommLine[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [running, setRunning] = useState(false)
  const [activeScenario, setActiveScenario] = useState<number | null>(null)
  const [allAgents, setAllAgents] = useState<Agent[]>([])
  const animRef = useRef<number>(0)

  useEffect(() => {
    getAgents().then(setAllAgents).catch(() => {})
  }, [])

  const setupNodes = useCallback((agentIds: string[]) => {
    const cx = 300
    const cy = 200
    const radius = 140
    const newNodes: AgentNode[] = agentIds.map((id, i) => {
      const angle = (i / agentIds.length) * Math.PI * 2 - Math.PI / 2
      const agent = allAgents.find(a => a.id === id)
      return {
        id,
        name: agent?.name ?? id,
        emoji: agent?.emoji ?? "🤖",
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        active: false,
        speaking: false,
        message: "",
        color: AGENT_COLORS[id] ?? "#8b5cf6",
      }
    })
    setNodes(newNodes)
    setLines([])
    setMessages([])
  }, [allAgents])

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let frame = 0
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connection lines with animation
      lines.forEach(line => {
        const fromNode = nodes.find(n => n.id === line.from)
        const toNode = nodes.find(n => n.id === line.to)
        if (!fromNode || !toNode) return

        const age = (Date.now() - line.timestamp) / 1000
        const alpha = Math.max(0, 1 - age / 3)

        // Animated data particles along the line
        const progress = (age * 2) % 1
        const px = fromNode.x + (toNode.x - fromNode.x) * progress
        const py = fromNode.y + (toNode.y - fromNode.y) * progress

        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        ctx.lineTo(toNode.x, toNode.y)
        ctx.strokeStyle = `rgba(139, 92, 246, ${alpha * 0.4})`
        ctx.lineWidth = 2
        ctx.stroke()

        // Particle
        if (alpha > 0.1) {
          ctx.beginPath()
          ctx.arc(px, py, 4, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`
          ctx.fill()

          ctx.beginPath()
          ctx.arc(px, py, 8, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha * 0.3})`
          ctx.fill()
        }
      })

      // Draw agent nodes
      nodes.forEach(node => {
        // Glow for active/speaking
        if (node.active || node.speaking) {
          const glowRadius = 35 + Math.sin(frame * 0.05) * 5
          const gradient = ctx.createRadialGradient(node.x, node.y, 20, node.x, node.y, glowRadius)
          gradient.addColorStop(0, node.speaking ? "rgba(74, 222, 128, 0.3)" : "rgba(139, 92, 246, 0.2)")
          gradient.addColorStop(1, "transparent")
          ctx.beginPath()
          ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
        }

        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, 24, 0, Math.PI * 2)
        ctx.fillStyle = node.speaking ? "rgba(74, 222, 128, 0.15)" : "rgba(255, 255, 255, 0.06)"
        ctx.fill()
        ctx.strokeStyle = node.speaking ? "rgba(74, 222, 128, 0.6)" : node.active ? "rgba(139, 92, 246, 0.6)" : "rgba(255, 255, 255, 0.1)"
        ctx.lineWidth = 2
        ctx.stroke()

        // Name
        ctx.font = "11px Inter, sans-serif"
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
        ctx.textAlign = "center"
        ctx.fillText(node.name, node.x, node.y + 40)
      })

      frame++
      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [nodes, lines])

  async function runScenario(idx: number) {
    const scenario = scenarios[idx]
    setActiveScenario(idx)
    setRunning(true)
    setupNodes(scenario.agents)

    await new Promise(r => setTimeout(r, 500))

    for (const step of scenario.flow) {
      // Activate sender
      setNodes(prev => prev.map(n => ({ ...n, active: n.id === step.from, speaking: n.id === step.from })))

      // Add connection line
      const lineId = `${step.from}-${step.to}-${Date.now()}`
      setLines(prev => [...prev, { id: lineId, from: step.from, to: step.to, timestamp: Date.now() }])

      // Call agent
      try {
        const data = await runAgent(step.prompt, step.from, `arena-live-${step.from}`)
        const text = data.status === "ok" ? (data.text ?? "...").slice(0, 200) : "Error"

        const fromAgent = allAgents.find(a => a.id === step.from)
        setMessages(prev => [...prev, {
          agentId: step.from,
          emoji: fromAgent?.emoji ?? "🤖",
          name: fromAgent?.name ?? step.from,
          text,
          timestamp: Date.now(),
          replyTo: step.to,
        }])

        // Show speaking on receiver
        setNodes(prev => prev.map(n => ({
          ...n,
          speaking: n.id === step.to,
          active: n.id === step.from || n.id === step.to,
          message: n.id === step.from ? text.slice(0, 50) : n.message,
        })))
      } catch {
        setMessages(prev => [...prev, {
          agentId: step.from,
          emoji: "❌",
          name: step.from,
          text: "Agent call failed",
          timestamp: Date.now(),
        }])
      }

      await new Promise(r => setTimeout(r, 1000))
    }

    // Reset all nodes
    setNodes(prev => prev.map(n => ({ ...n, active: false, speaking: false })))
    setRunning(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Scenarios */}
      <div className="lg:col-span-3 space-y-4">
        <div className="glass p-5">
          <h3 className="text-sm font-bold text-white/80 mb-3">🎬 Scenarios</h3>
          <div className="space-y-2">
            {scenarios.map((s, i) => (
              <button
                key={i}
                onClick={() => !running && runScenario(i)}
                disabled={running}
                className={`w-full text-left rounded-lg p-3 text-xs transition border ${
                  activeScenario === i
                    ? "bg-violet-500/20 border-violet-500/30"
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                } ${running ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="font-semibold text-white/90">{s.name}</div>
                <div className="text-white/40 mt-1">{s.description}</div>
                <div className="flex gap-1 mt-2">
                  {s.agents.map(id => {
                    const a = allAgents.find(x => x.id === id)
                    return <span key={id} title={a?.name ?? id}>{a?.emoji ?? "🤖"}</span>
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>

        {running && (
          <div className="glass p-4 text-center">
            <div className="animate-pulse text-violet-400 text-sm font-semibold">⚡ Live Communication</div>
            <div className="text-[10px] text-white/40 mt-1">Agents are collaborating...</div>
          </div>
        )}
      </div>

      {/* Center: Canvas */}
      <div className="lg:col-span-5">
        <div className="glass p-4 relative">
          <h3 className="text-sm font-bold text-white/80 mb-2">🌐 Agent Network</h3>
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full rounded-xl bg-black/20"
            style={{ aspectRatio: "3/2" }}
          />
          {/* Emoji overlay on canvas */}
          {nodes.map(node => (
            <div
              key={node.id}
              className="absolute pointer-events-none text-2xl"
              style={{
                left: `${(node.x / 600) * 100}%`,
                top: `${(node.y / 400) * 100 + 7}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {node.emoji}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Chat log */}
      <div className="lg:col-span-4">
        <div className="glass p-5 h-full">
          <h3 className="text-sm font-bold text-white/80 mb-3">💬 Communication Log</h3>
          <ScrollArea className="h-[450px]">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-xs">
                Select a scenario to start the live communication
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{msg.emoji}</span>
                      <span className="text-xs font-semibold text-white/90">{msg.name}</span>
                      {msg.replyTo && (
                        <>
                          <span className="text-white/30">→</span>
                          <span className="text-xs text-white/50">
                            {allAgents.find(a => a.id === msg.replyTo)?.emoji} {allAgents.find(a => a.id === msg.replyTo)?.name}
                          </span>
                        </>
                      )}
                      <span className="ml-auto text-[10px] text-white/30">
                        {new Date(msg.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-xs text-white/60 whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
