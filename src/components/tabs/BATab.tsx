"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getProjects, createProject, getProjectPipeline, startPipeline, submitPipelineFeedback, cancelPipeline } from "@/lib/api"
import type { Project, PipelineRun, PipelineStep, PipelineFeedback } from "@/types"

const STAGE_AGENTS: Record<number, { name: string; emoji: string }> = {
  1: { name: "Naga Siren", emoji: "\ud83d\udc0d" },
  2: { name: "Architect", emoji: "\ud83c\udfd7\ufe0f" },
  3: { name: "Planner", emoji: "\ud83d\udccb" },
  4: { name: "Estimator", emoji: "\ud83d\udcb0" },
  5: { name: "Silencer", emoji: "\u270d\ufe0f" },
  6: { name: "Phantom Assassin", emoji: "\ud83d\udde1\ufe0f" },
  7: { name: "System", emoji: "\ud83d\udce4" },
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Done",
  archived: "Archived",
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-white/10 text-white/50",
    active: "bg-cyan-500/20 text-cyan-400",
    completed: "bg-green-500/20 text-green-400",
    archived: "bg-white/5 text-white/30",
    running: "bg-blue-500/20 text-blue-400",
    checkpoint: "bg-yellow-500/20 text-yellow-400",
    failed: "bg-red-500/20 text-red-400",
    pending: "bg-white/10 text-white/50",
    paused: "bg-orange-500/20 text-orange-400",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${colors[status] ?? colors.draft}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function StepStatusIcon({ status }: { status: PipelineStep["status"] }) {
  switch (status) {
    case "completed":
      return <span className="text-green-400 text-sm">\u2713</span>
    case "running":
      return <span className="text-blue-400 text-sm animate-pulse">\u25cf</span>
    case "failed":
      return <span className="text-red-400 text-sm">\u2717</span>
    case "skipped":
      return <span className="text-white/30 text-sm">\u2014</span>
    default:
      return <span className="text-white/20 text-sm">\u25cb</span>
  }
}

function formatDuration(secs: number | null): string {
  if (secs == null) return ""
  if (secs < 60) return `${Math.round(secs)}s`
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return `${m}m ${s}s`
}

export function BATab() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [pipeline, setPipeline] = useState<{ run: PipelineRun | null; steps: PipelineStep[]; feedback: PipelineFeedback[] } | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [selectedStep, setSelectedStep] = useState<number | null>(null)

  const [newName, setNewName] = useState("")
  const [newClient, setNewClient] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newReqs, setNewReqs] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects()
      setProjects(data)
    } catch {
      // silently fail, projects may not be available yet
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Load pipeline for selected project
  const loadPipeline = useCallback(async (projectId: number) => {
    try {
      const data = await getProjectPipeline(projectId)
      setPipeline({
        run: data.run,
        steps: data.steps ?? [],
        feedback: data.feedback ?? [],
      })
    } catch {
      setPipeline(null)
    }
  }, [])

  useEffect(() => {
    if (selectedProject != null) {
      loadPipeline(selectedProject)
    } else {
      setPipeline(null)
    }
  }, [selectedProject, loadPipeline])

  // Auto-poll while running
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (selectedProject != null && pipeline?.run?.status === "running") {
      pollRef.current = setInterval(() => {
        loadPipeline(selectedProject)
      }, 3000)
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [selectedProject, pipeline?.run?.status, loadPipeline])

  // Create project and start pipeline
  const handleCreateProject = async () => {
    if (!newName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const project = await createProject({
        name: newName.trim(),
        client_name: newClient.trim() || undefined,
        description: newDesc.trim() || undefined,
      })
      if (newReqs.trim()) {
        await startPipeline(project.id, newReqs.trim())
      }
      setNewName("")
      setNewClient("")
      setNewDesc("")
      setNewReqs("")
      setShowNewProject(false)
      await loadProjects()
      setSelectedProject(project.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  // Submit feedback
  const handleFeedback = async (action: "approve" | "revise" | "reject") => {
    if (!pipeline?.run) return
    setSubmittingFeedback(true)
    try {
      await submitPipelineFeedback(pipeline.run.id, feedbackText, action)
      setFeedbackText("")
      if (selectedProject != null) {
        await loadPipeline(selectedProject)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit feedback")
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // Cancel pipeline
  const handleCancel = async () => {
    if (!pipeline?.run) return
    try {
      await cancelPipeline(pipeline.run.id)
      if (selectedProject != null) {
        await loadPipeline(selectedProject)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel pipeline")
    }
  }

  // Get output for selected step or current
  const activeStep = selectedStep != null
    ? pipeline?.steps.find(s => s.stage === selectedStep)
    : pipeline?.steps.find(s => s.status === "running") ?? pipeline?.steps.filter(s => s.status === "completed").pop()

  const selectedProjectData = projects.find(p => p.id === selectedProject)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left Column: Project List */}
      <div className="lg:col-span-3 space-y-4">
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white/80">\ud83d\udccb Projects</h3>
            <button
              onClick={() => setShowNewProject(!showNewProject)}
              className="text-xs px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              {showNewProject ? "Cancel" : "+ New"}
            </button>
          </div>

          {/* New Project Form */}
          {showNewProject && (
            <div className="bg-white/5 rounded-xl p-3 mb-3 space-y-2">
              <input
                type="text"
                placeholder="Project name *"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full bg-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <input
                type="text"
                placeholder="Client name"
                value={newClient}
                onChange={e => setNewClient(e.target.value)}
                className="w-full bg-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <input
                type="text"
                placeholder="Description"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full bg-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <textarea
                placeholder="Requirements (starts pipeline automatically)"
                value={newReqs}
                onChange={e => setNewReqs(e.target.value)}
                rows={3}
                className="w-full bg-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
              />
              {error && (
                <div className="text-[10px] text-red-400">{error}</div>
              )}
              <button
                onClick={handleCreateProject}
                disabled={loading || !newName.trim()}
                className="w-full text-xs px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? "Creating..." : "Create & Start Pipeline"}
              </button>
            </div>
          )}

          {/* Project List */}
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {projects.length === 0 && (
              <div className="text-center py-8">
                <div className="text-2xl mb-2">\ud83d\udcc2</div>
                <div className="text-xs text-white/30">No projects yet</div>
              </div>
            )}
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProject(p.id)
                  setSelectedStep(null)
                }}
                className={`w-full text-left rounded-lg p-3 transition-colors ${
                  selectedProject === p.id
                    ? "bg-cyan-500/15 border border-cyan-500/30"
                    : "bg-white/5 hover:bg-white/10 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white/80 truncate">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                {p.client_name && (
                  <div className="text-[10px] text-white/40 truncate">{p.client_name}</div>
                )}
                <div className="text-[10px] text-white/30 mt-1 font-mono">
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center Column: Pipeline Visualizer */}
      <div className="lg:col-span-6 space-y-4">
        {!selectedProject ? (
          <div className="glass p-5">
            <div className="text-center py-16">
              <div className="text-4xl mb-3">\ud83d\ude80</div>
              <div className="text-sm text-white/40">Select a project to view its pipeline</div>
              <div className="text-[10px] text-white/20 mt-1">Or create a new one from the left panel</div>
            </div>
          </div>
        ) : (
          <>
            {/* Project Header */}
            <div className="glass p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white/80">
                  {selectedProjectData?.name ?? "Project"}
                </h3>
                <div className="flex items-center gap-2">
                  {pipeline?.run && (
                    <StatusBadge status={pipeline.run.status} />
                  )}
                  {pipeline?.run?.status === "running" && (
                    <button
                      onClick={handleCancel}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              {selectedProjectData?.client_name && (
                <div className="text-xs text-white/40">Client: {selectedProjectData.client_name}</div>
              )}
              {pipeline?.run && (
                <div className="text-[10px] text-white/30 mt-1 font-mono">
                  Stage {pipeline.run.current_stage}/{pipeline.run.total_stages}
                  {pipeline.run.started_at && ` \u00b7 Started ${new Date(pipeline.run.started_at).toLocaleTimeString()}`}
                  {pipeline.run.completed_at && ` \u00b7 Done ${new Date(pipeline.run.completed_at).toLocaleTimeString()}`}
                </div>
              )}
            </div>

            {/* Pipeline Stepper */}
            {pipeline?.steps && pipeline.steps.length > 0 ? (
              <div className="glass p-5">
                <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">Pipeline Stages</h4>
                <div className="space-y-1">
                  {pipeline.steps.map((step, i) => {
                    const agent = STAGE_AGENTS[step.stage] ?? { name: step.agent_id, emoji: "\ud83e\udd16" }
                    const isSelected = selectedStep === step.stage
                    return (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStep(step.stage)}
                        className={`w-full text-left rounded-lg p-3 transition-colors ${
                          isSelected
                            ? "bg-purple-500/15 border border-purple-500/30"
                            : step.status === "running"
                            ? "bg-blue-500/10 border border-blue-500/20"
                            : "bg-white/5 hover:bg-white/8 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Stage number */}
                          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            step.status === "completed" ? "bg-green-500/20 text-green-400"
                            : step.status === "running" ? "bg-blue-500/20 text-blue-400"
                            : step.status === "failed" ? "bg-red-500/20 text-red-400"
                            : "bg-white/10 text-white/30"
                          }`}>
                            {step.stage}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{agent.emoji}</span>
                              <span className="text-xs font-semibold text-white/80 truncate">{step.stage_name}</span>
                              <StepStatusIcon status={step.status} />
                            </div>
                            <div className="text-[10px] text-white/40 mt-0.5">
                              {agent.name}
                              {step.duration_secs != null && (
                                <span className="ml-2 font-mono text-white/30">{formatDuration(step.duration_secs)}</span>
                              )}
                            </div>
                          </div>

                          {/* Running indicator */}
                          {step.status === "running" && (
                            <div className="text-[10px] text-blue-400 animate-pulse flex-shrink-0">
                              Agent working
                              <span className="inline-block animate-bounce ml-0.5">...</span>
                            </div>
                          )}
                        </div>

                        {step.status === "failed" && step.error_message && (
                          <div className="mt-2 text-[10px] text-red-400/80 bg-red-500/10 rounded px-2 py-1 truncate">
                            {step.error_message}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : pipeline && !pipeline.run ? (
              <div className="glass p-5">
                <div className="text-center py-8">
                  <div className="text-2xl mb-2">\u23f3</div>
                  <div className="text-xs text-white/40">No pipeline run for this project</div>
                  <div className="text-[10px] text-white/20 mt-1">Create a new project with requirements to start one</div>
                </div>
              </div>
            ) : null}

            {/* Checkpoint Feedback */}
            {pipeline?.run?.status === "checkpoint" && (
              <div className="glass-bright p-5 border border-yellow-500/30">
                <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3">
                  \u23f8 Checkpoint \u2014 Stage {pipeline.run.current_stage} completed
                </h4>
                <div className="text-xs text-white/50 mb-3">
                  Review the output and provide feedback before the pipeline continues.
                </div>
                <textarea
                  placeholder="Enter your feedback (optional for approve)..."
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  rows={3}
                  className="w-full bg-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-yellow-500/50 resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedback("approve")}
                    disabled={submittingFeedback}
                    className="flex-1 text-xs px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-40 font-semibold"
                  >
                    {submittingFeedback ? "..." : "\u2705 Approve & Continue"}
                  </button>
                  <button
                    onClick={() => handleFeedback("revise")}
                    disabled={submittingFeedback || !feedbackText.trim()}
                    className="flex-1 text-xs px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-40 font-semibold"
                  >
                    {submittingFeedback ? "..." : "\ud83d\udd04 Revise"}
                  </button>
                  <button
                    onClick={() => handleFeedback("reject")}
                    disabled={submittingFeedback}
                    className="flex-1 text-xs px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40 font-semibold"
                  >
                    {submittingFeedback ? "..." : "\u274c Reject"}
                  </button>
                </div>
                {error && (
                  <div className="text-[10px] text-red-400 mt-2">{error}</div>
                )}
              </div>
            )}

            {/* Feedback History */}
            {pipeline?.feedback && pipeline.feedback.length > 0 && (
              <div className="glass p-5">
                <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Feedback History</h4>
                <div className="space-y-2">
                  {pipeline.feedback.map(fb => (
                    <div key={fb.id} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-white/40">Stage {fb.stage}</span>
                        <StatusBadge status={fb.action} />
                      </div>
                      {fb.feedback_text && (
                        <div className="text-xs text-white/60 mt-1">{fb.feedback_text}</div>
                      )}
                      <div className="text-[10px] text-white/20 mt-1 font-mono">
                        {new Date(fb.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Column: Output Preview */}
      <div className="lg:col-span-3 space-y-4">
        <div className="glass p-5">
          <h3 className="text-sm font-bold text-white/80 mb-3">\ud83d\udcdd Output Preview</h3>

          {!selectedProject ? (
            <div className="text-center py-12">
              <div className="text-2xl mb-2">\ud83d\udcc4</div>
              <div className="text-xs text-white/30">Select a project and stage</div>
            </div>
          ) : activeStep?.output_text ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">{STAGE_AGENTS[activeStep.stage]?.emoji ?? "\ud83e\udd16"}</span>
                <span className="text-xs font-semibold text-purple-400">{activeStep.stage_name}</span>
                <StepStatusIcon status={activeStep.status} />
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                <pre className="bg-black/30 rounded-lg p-4 text-xs text-white/80 whitespace-pre-wrap font-mono border border-white/10 leading-relaxed">
                  {activeStep.output_text}
                </pre>
              </div>
            </>
          ) : activeStep ? (
            <div className="text-center py-12">
              <div className="text-2xl mb-2">
                {activeStep.status === "running" ? "\u23f3" : "\ud83d\udccb"}
              </div>
              <div className="text-xs text-white/30">
                {activeStep.status === "running"
                  ? "Agent is working on this stage..."
                  : activeStep.status === "pending"
                  ? "Stage not started yet"
                  : "No output available"}
              </div>
            </div>
          ) : pipeline?.run?.status === "completed" ? (
            // Show all outputs as expandable sections
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {pipeline.steps.filter(s => s.output_text).map(step => (
                <details key={step.id} className="bg-white/5 rounded-lg">
                  <summary className="px-3 py-2 cursor-pointer text-xs text-white/70 hover:text-white/90 transition-colors">
                    <span className="ml-1">
                      {STAGE_AGENTS[step.stage]?.emoji ?? "\ud83e\udd16"}{" "}
                      {step.stage_name}
                      {step.duration_secs != null && (
                        <span className="ml-2 font-mono text-white/30 text-[10px]">{formatDuration(step.duration_secs)}</span>
                      )}
                    </span>
                  </summary>
                  <div className="px-3 pb-3">
                    <pre className="bg-black/30 rounded-lg p-3 text-[10px] text-white/70 whitespace-pre-wrap font-mono border border-white/10 leading-relaxed max-h-[200px] overflow-y-auto">
                      {step.output_text}
                    </pre>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-2xl mb-2">\ud83d\udcc4</div>
              <div className="text-xs text-white/30">Click a stage to see its output</div>
            </div>
          )}
        </div>

        {/* Pipeline Info Card */}
        {pipeline?.run && (
          <div className="glass p-5">
            <h3 className="text-sm font-bold text-white/80 mb-3">\u2139\ufe0f Pipeline Info</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Run ID</span>
                <span className="font-mono text-white/70">#{pipeline.run.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Status</span>
                <StatusBadge status={pipeline.run.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Progress</span>
                <span className="font-mono text-cyan-400">
                  {pipeline.steps.filter(s => s.status === "completed").length}/{pipeline.run.total_stages}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Total Time</span>
                <span className="font-mono text-white/70">
                  {formatDuration(pipeline.steps.reduce((sum, s) => sum + (s.duration_secs ?? 0), 0)) || "\u2014"}
                </span>
              </div>
              {pipeline.run.error_message && (
                <div className="mt-2 text-[10px] text-red-400 bg-red-500/10 rounded-lg p-2">
                  {pipeline.run.error_message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
