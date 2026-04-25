import axios, { AxiosError } from 'axios'
import type { AuditReport } from '../types/audit'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
})

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