"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { AgentDetail } from "@/types"

export function AgentDetailDialog({
  agentId, open, onClose,
}: {
  agentId: string | null; open: boolean; onClose: () => void
}) {
  const [agent, setAgent] = useState<AgentDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!agentId || !open) return
    setLoading(true)
    fetch(`/agents/${agentId}`)
      .then(r => r.json())
      .then(setAgent)
      .catch(() => setAgent(null))
      .finally(() => setLoading(false))
  }, [agentId, open])

  const modelName = agent?.model.split("/").pop()?.replace(/-20\d+.*/, "") ?? ""

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl bg-slate-900/95 backdrop-blur-2xl border-white/10 text-white max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-4xl">{agent?.emoji ?? "🤖"}</span>
            <div className="flex-1">
              <div className="text-lg">{agent?.name ?? agentId}</div>
              <div className="text-xs text-white/50 font-normal">{agent?.title}</div>
            </div>
            <Badge variant="outline" className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              {modelName}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-white/40">Loading...</div>
        ) : agent ? (
          <ScrollArea className="max-h-[60vh] pr-4">
            {agent.creature && (
              <p className="text-xs text-white/40 italic mb-3">{agent.creature}</p>
            )}
            {agent.vibe && (
              <div className="text-xs text-white/60 p-2.5 rounded-lg bg-white/5 mb-4">
                💡 {agent.vibe}
              </div>
            )}

            {agent.system_prompt && (
              <>
                <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">System Prompt</h4>
                <pre className="bg-white/5 rounded-lg p-3 text-xs text-white/70 whitespace-pre-wrap font-mono border border-white/10 mb-4 max-h-52 overflow-y-auto">
                  {agent.system_prompt}
                </pre>
              </>
            )}

            {agent.skills.length > 0 && (
              <>
                <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                  Skills ({agent.skills.length})
                </h4>
                <div className="space-y-1.5 mb-4">
                  {agent.skills.map(s => (
                    <div key={s.name} className="flex gap-2 p-2 rounded-lg bg-white/5">
                      <code className="text-purple-400 text-[11px] font-bold shrink-0">/{s.name}</code>
                      <span className="text-white/60 text-[11px]">{s.description}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {agent.responsibilities && (
              <>
                <Separator className="bg-white/10 my-3" />
                <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Responsibilities</h4>
                <pre className="text-xs text-white/60 whitespace-pre-wrap">{agent.responsibilities}</pre>
              </>
            )}
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-red-400">Failed to load agent</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
