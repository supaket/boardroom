export interface Agent {
  id: string
  name: string
  title: string
  emoji: string
  vibe: string
  creature: string
  model: string
  workspace: string
  has_identity: boolean
  has_system_prompt: boolean
  skills_count: number
}

export interface AgentDetail extends Agent {
  system_prompt: string
  skills: Skill[]
  responsibilities: string
  raw_identity: string
}

export interface Skill {
  name: string
  description: string
}

export interface StatsSummary {
  period: string
  tokensByProvider: ProviderStats[]
  tasksByAgent: AgentTaskStats[]
  totalTasks: number
  totalCostUSD: number
  totalCostTHB: number
  messages: { direction: string; count: number }[]
}

export interface ProviderStats {
  provider: string
  input: number
  output: number
  cost: number
  calls: number
}

export interface AgentTaskStats {
  agent_id: string
  tasks: number
  tokens: number
  duration: number
}

export interface ROIStats {
  today: { tasks: number; aiCostTHB: number; humanCost: number; savings: number; hoursSaved: number; roi: number }
  week: { tasks: number; aiCostTHB: number; humanCost: number; savings: number; hoursSaved: number; roi: number }
  month: { tasks: number; aiCostTHB: number; humanCost: number; savings: number; hoursSaved: number; roi: number }
}

export interface Project {
  id: number
  name: string
  description: string | null
  status: string
  owner_email: string | null
  client_name: string | null
  created_at: string
  updated_at: string
  proposal_count?: number
  total_budget?: number
  milestone_count?: number
}

export interface QuickCommand {
  name: string
  prompt: string
  agent: string
}

export interface PipelineRun {
  id: number
  project_id: number
  status: 'pending' | 'running' | 'checkpoint' | 'paused' | 'completed' | 'failed'
  current_stage: number
  total_stages: number
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
}

export interface PipelineStep {
  id: number
  run_id: number
  stage: number
  stage_name: string
  agent_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  input_summary: string | null
  output_data: Record<string, unknown> | null
  output_text: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  duration_secs: number | null
}

export interface PipelineFeedback {
  id: number
  run_id: number
  stage: number
  feedback_text: string
  action: 'approve' | 'revise' | 'reject'
  created_by: string | null
  created_at: string
}

export type TeamConfig = {
  title: string
  emoji: string
  agents: { id: string; name: string; emoji: string; role: string; model: string }[]
  commands: QuickCommand[]
}
