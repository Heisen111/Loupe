import axios, { AxiosError } from 'axios'
import type { AuditReport } from '../types/audit'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function streamAudit(
  input: string,
  model: string,
  onStatus: (msg: string) => void,
  onResult: (report: AuditReport) => void,
  onError: (err: string) => void,
): () => void {
  const url = `${BASE_URL}/audit/stream?input=${encodeURIComponent(input)}&model=${encodeURIComponent(model)}`
  const es = new EventSource(url)

  es.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data)
      if (parsed.type === 'status') onStatus(parsed.message)
      if (parsed.type === 'result') { onResult(parsed.data); es.close() }
      if (parsed.type === 'error')  { onError(parsed.message); es.close() }
    } catch {
      onError('Failed to parse server response')
      es.close()
    }
  }

  es.onerror = () => {
    onError('Connection lost. Please try again.')
    es.close()
  }

  return () => es.close()
}

export async function runAudit(input: string, model: string): Promise<AuditReport> {
  try {
    const response = await api.post<AuditReport>('/audit', { input, model })
    return response.data
  } catch (err) {
    const error = err as AxiosError<{ error?: string }>
    const message =
      error.response?.data?.error ||
      'Audit failed. Please try again.'
    throw new Error(message)
  }
}

export default api