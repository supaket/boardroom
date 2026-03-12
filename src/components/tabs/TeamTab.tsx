"use client"

import { useState, useEffect } from "react"
import { teams } from "@/lib/teams"
import { AgentCard } from "@/components/agents/AgentCard"
import { AgentDetailDialog } from "@/components/agents/AgentDetailDialog"
import { QuickCommands } from "@/components/layout/QuickCommands"
import { getStatsAgents } from "@/lib/api"
import type { AgentTaskStats } from "@/types"

const teamROI: Record<string, { roles: { name: string; hours: number }[]; totalHours: number }> = {
  marketing: { roles: [{ name: "Content Creation", hours: 12 }, { name: "Lead Management", hours: 8 }], totalHours: 20 },
  ba: { roles: [{ name: "Requirements Analysis", hours: 20 }, { name: "Proposal Writing", hours: 15 }, { name: "Documentation", hours: 25 }], totalHours: 60 },
  dev: { roles: [{ name: "Coding & Review", hours: 50 }, { name: "API Design", hours: 20 }, { name: "DB Operations", hours: 15 }, { name: "CI/CD", hours: 15 }, { name: "Testing", hours: 20 }], totalHours: 120 },
  qa: { roles: [{ name: "Test Planning", hours: 15 }, { name: "Test Automation", hours: 25 }, { name: "Security Testing", hours: 15 }, { name: "Performance Testing", hours: 10 }, { name: "UAT", hours: 15 }], totalHours: 80 },
  ops: { roles: [{ name: "Incident Response", hours: 20 }, { name: "Infrastructure", hours: 30 }, { name: "Deployment", hours: 20 }, { name: "Support", hours: 15 }, { name: "Monitoring", hours: 15 }], totalHours: 100 },
  exec: { roles: [{ name: "Briefings", hours: 10 }, { name: "Decision Support", hours: 15 }, { name: "Product Planning", hours: 15 }], totalHours: 40 },
  biz: { roles: [{ name: "Invoicing", hours: 10 }, { name: "HR Admin", hours: 10 }, { name: "Legal Review", hours: 10 }, { name: "Client Management", hours: 15 }, { name: "Recruitment", hours: 15 }], totalHours: 60 },
}

export function TeamTab({ teamKey }: { teamKey: string }) {
  const team = teams[teamKey]
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [agentActivity, setAgentActivity] = useState<AgentTaskStats[]>([])
  const [cmdOutput, setCmdOutput] = useState<{ text: string; agent: string; cmd: string } | null>(null)

  useEffect(() => {
    getStatsAgents().then(setAgentActivity).catch(() => {})
  }, [])

  if (!team) return <div className="text-white/40 text-center py-12">Team not found</div>

  const roi = teamROI[teamKey]
  const totalHours = roi?.totalHours ?? 0
  const totalMandays = Math.round(totalHours / 8)
  const teamAgentIds = team.agents.map(a => a.id)
  const teamActivity = agentActivity.filter(a => teamAgentIds.includes(a.agent_id))
  const totalTeamTasks = teamActivity.reduce((s, a) => s + a.tasks, 0)

  return (
    <>
      <AgentDetailDialog agentId={selectedAgent} open={!!selectedAgent} onClose={() => setSelectedAgent(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Agent List + Commands */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass p-5">
            <h3 className="text-sm font-bold text-white/80 mb-3">
              {team.emoji} {team.title} Team
            </h3>
            <div className="space-y-2">
              {team.agents.map((a) => (
                <AgentCard
                  key={a.id}
                  name={a.name}
                  emoji={a.emoji}
                  role={a.role}
                  model={a.model}
                  onClick={() => setSelectedAgent(a.id)}
                />
              ))}
            </div>
          </div>
          <QuickCommands
            commands={team.commands}
            title={`${team.title} Tools`}
            onResult={(text, agent, cmd) => setCmdOutput({ text, agent, cmd })}
          />
        </div>

        {/* Center: Stats + Activity */}
        <div className="lg:col-span-5 space-y-4">
          {/* Team KPIs */}
          <div className="glass p-5">
            <h3 className="text-sm font-bold text-white/80 mb-4">📊 Team Dashboard</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-cyan-400">{team.agents.length}</div>
                <div className="text-[10px] text-white/50 uppercase">Agents</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-purple-400">{team.commands.length}</div>
                <div className="text-[10px] text-white/50 uppercase">Commands</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-green-400">{totalTeamTasks}</div>
                <div className="text-[10px] text-white/50 uppercase">Tasks Today</div>
              </div>
            </div>

            {/* Agent Activity Bars */}
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Agent Workload</h4>
            <div className="space-y-2">
              {team.agents.map(a => {
                const activity = teamActivity.find(ta => ta.agent_id === a.id)
                const tasks = activity?.tasks ?? 0
                const maxTasks = Math.max(...teamActivity.map(t => t.tasks), 1)
                const pct = (tasks / maxTasks) * 100
                return (
                  <div key={a.id}>
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="text-white/70">{a.emoji} {a.name}</span>
                      <span className="font-mono text-white/50">{tasks} tasks</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Agent Output */}
          <div className="glass p-5">
            <h3 className="text-sm font-bold text-white/80 mb-3">📝 Agent Output</h3>
            {cmdOutput ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-violet-400">{cmdOutput.agent}</span>
                  <span className="text-white/30 text-xs">→</span>
                  <code className="text-xs text-purple-400">{cmdOutput.cmd}</code>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <pre className="bg-black/30 rounded-lg p-4 text-xs text-white/80 whitespace-pre-wrap font-mono border border-white/10 leading-relaxed">
                    {cmdOutput.text}
                  </pre>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">💬</div>
                <div className="text-xs text-white/30">Click a quick command to see agent output here</div>
                <div className="text-[10px] text-white/20 mt-1">Commands are in the left panel</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: ROI + Info */}
        <div className="lg:col-span-3 space-y-4">
          {/* Hours Saved Card */}
          <div className="glass p-5 border border-green-500/20">
            <h3 className="text-sm font-bold text-white/80 mb-3">⏱️ Hours Saved/Month</h3>
            <div className="space-y-2 text-sm">
              {roi?.roles.map(r => (
                <div key={r.name} className="flex justify-between">
                  <span className="text-white/50 text-xs">{r.name}</span>
                  <span className="font-mono text-green-400 text-xs">{r.hours}h</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="text-white/70 font-bold text-xs">Total Hours</span>
                <span className="font-mono font-bold text-green-400">{totalHours}h/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-xs">Mandays Equiv</span>
                <span className="font-mono text-cyan-400 text-xs">{totalMandays} days/mo</span>
              </div>
            </div>
          </div>

          {/* Team Info */}
          <div className="glass p-5">
            <h3 className="text-sm font-bold text-white/80 mb-3">ℹ️ Team Info</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Primary Model</span>
                <span className="text-violet-400">Opus 4.6</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Agent Count</span>
                <span className="text-white/70">{team.agents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Quick Commands</span>
                <span className="text-white/70">{team.commands.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Tasks Today</span>
                <span className="text-white/70">{totalTeamTasks}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="glass p-5">
            <h3 className="text-sm font-bold text-white/80 mb-3">🔗 Quick Links</h3>
            <div className="space-y-1.5">
              {team.commands.slice(0, 4).map(cmd => (
                <div key={cmd.name} className="flex items-center gap-2 text-xs">
                  <code className="text-purple-400">{cmd.name}</code>
                  <span className="text-white/30">→</span>
                  <span className="text-white/50 truncate">{cmd.agent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
