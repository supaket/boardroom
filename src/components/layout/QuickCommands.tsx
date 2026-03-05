"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { runAgent } from "@/lib/api"
import type { QuickCommand } from "@/types"

export function QuickCommands({ commands, title = "Quick Commands", onResult }: {
  commands: QuickCommand[]
  title?: string
  onResult?: (result: string, agent: string, cmd: string) => void
}) {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeCmd, setActiveCmd] = useState("")
  const [activeAgent, setActiveAgent] = useState("")

  async function run(cmd: QuickCommand) {
    setLoading(true)
    setActiveCmd(cmd.name)
    setActiveAgent(cmd.agent)
    setResult(`⏳ Running ${cmd.name} via ${cmd.agent}...`)
    onResult?.(`⏳ Running ${cmd.name} via ${cmd.agent}...`, cmd.agent, cmd.name)
    try {
      const data = await runAgent(cmd.prompt, cmd.agent, `web-${cmd.name}`)
      const text = data.status === "ok" ? (data.text ?? JSON.stringify(data.result, null, 2)) : `Error: ${data.message}`
      setResult(text)
      onResult?.(text, cmd.agent, cmd.name)
    } catch (e) {
      const err = `Failed: ${e instanceof Error ? e.message : "Unknown error"}`
      setResult(err)
      onResult?.(err, cmd.agent, cmd.name)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass p-5">
      <h3 className="text-sm font-bold text-white/80 mb-3">⚡ {title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {commands.map((cmd) => (
          <Button
            key={cmd.name}
            variant="ghost"
            size="sm"
            onClick={() => run(cmd)}
            disabled={loading}
            className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs h-auto py-2 justify-center"
          >
            {loading && activeCmd === cmd.name ? "⏳..." : cmd.name}
          </Button>
        ))}
      </div>
      {/* Inline result for when no onResult handler */}
      {result && !onResult && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span className="text-violet-400 font-semibold">{activeAgent}</span>
            <span className="text-white/30">→</span>
            <span className="text-white/50">{activeCmd}</span>
            {loading && <span className="ml-auto animate-pulse text-amber-400">Running...</span>}
          </div>
          <ScrollArea className="max-h-72">
            <pre className="bg-white/5 rounded-lg p-3 text-xs text-white/70 whitespace-pre-wrap font-mono border border-white/10">
              {result}
            </pre>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
