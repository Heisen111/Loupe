export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'informational'

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Minimal'

export interface Vulnerability {
  id: string
  title: string
  severity: Severity
  category: string
  location: string
  description: string
  attack_scenario: string
  recommendation: string
  master_hacker_note: string
}

export interface Phase2Findings {
  assumptions_violated: string[]
  edge_cases: string[]
  combined_attack_vectors: string[]
  mev_risks: string[]
  overall_hacker_assessment: string
}

export interface AuditMetadata {
  total_vulnerabilities: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  informational_count: number
}

export interface Attestation {
  tx_hash: string
  chain: string
  timestamp: string
}

export interface AuditReport {
  overall_risk: RiskLevel
  risk_score: number                   // 0–100
  contract_summary: string
  vulnerabilities: Vulnerability[]
  phase2_findings: Phase2Findings
  positive_findings: string[]
  audit_metadata: AuditMetadata
  attestation?: Attestation
}

// Input shapes

export type AuditInputMode = 'address' | 'code'

export interface AuditRequest {
  mode: AuditInputMode
  address?: string
  source_code?: string
  chain_id?: number
}

// Streaming SSE event payload

export type SSEStatus =
  | 'fetching_contract'
  | 'running_phase1'
  | 'running_phase2'
  | 'generating_exploits'
  | 'attesting'
  | 'complete'
  | 'error'

export interface SSEEvent {
  status: SSEStatus
  message: string
  progress: number             // 0–100, forward-only
  data?: Partial<AuditReport>
  error?: string
}