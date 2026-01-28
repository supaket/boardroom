async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function postJSON<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

// Stats
export const getStatsSummary = () => fetchJSON<import("@/types").StatsSummary>("/api/plugins/stats/summary?period=today")
export const getStatsROI = () => fetchJSON<import("@/types").ROIStats>("/api/plugins/stats/roi")
export const getStatsAgents = () => fetchJSON<import("@/types").AgentTaskStats[]>("/api/plugins/stats/agents")
export const getStatsMessages = (limit = 20) => fetchJSON<Record<string, unknown>[]>(`/api/plugins/stats/messages?limit=${limit}`)

// Agents
export const getAgents = () => fetchJSON<import("@/types").Agent[]>("/agents")
export const getAgentDetail = (id: string) => fetchJSON<import("@/types").AgentDetail>(`/agents/${id}`)

// Projects
export const getProjects = () => fetchJSON<import("@/types").Project[]>("/ba/projects")
export const getProjectDashboard = (id: number) => fetchJSON<Record<string, unknown>>(`/ba/projects/${id}/dashboard`)
export const createProject = (data: { name: string; description?: string; client_name?: string }) =>
  postJSON<import("@/types").Project>("/ba/projects", data)

// Run agent
export async function runAgent(message: string, agent: string, sessionId: string): Promise<{ status: string; text?: string; result?: unknown; message?: string }> {
  return postJSON("/run-agent", { message, agent, session_id: sessionId })
}

// Pipeline
export const startPipeline = (projectId: number, requirements: string) =>
  postJSON<import("@/types").PipelineRun>(`/ba/pipeline/start/${projectId}`, { requirements })
export const getProjectPipeline = (projectId: number) =>
  fetchJSON<{ run: import("@/types").PipelineRun | null; steps?: import("@/types").PipelineStep[]; feedback?: import("@/types").PipelineFeedback[] }>(`/ba/pipeline/project/${projectId}`)
export const getPipelineDetail = (runId: number) =>
  fetchJSON<{ run: import("@/types").PipelineRun; steps: import("@/types").PipelineStep[]; feedback: import("@/types").PipelineFeedback[] }>(`/ba/pipeline/${runId}`)
export const getPipelineSteps = (runId: number) =>
  fetchJSON<import("@/types").PipelineStep[]>(`/ba/pipeline/${runId}/steps`)
export const submitPipelineFeedback = (runId: number, feedbackText: string, action: string) =>
  postJSON<import("@/types").PipelineFeedback>(`/ba/pipeline/${runId}/feedback`, { feedback_text: feedbackText, action })
export const cancelPipeline = (runId: number) =>
  postJSON<{ status: string }>(`/ba/pipeline/${runId}/cancel`, {})
