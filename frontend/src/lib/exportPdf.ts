import jsPDF from 'jspdf'
import type { AuditReport } from '../types/audit'

// ── Colors ─────────────────────────────────────────────────────────────────────

const C = {
  bg:       [20,  18,  16]  as [number,number,number],
  surface:  [28,  26,  23]  as [number,number,number],
  border:   [50,  46,  40]  as [number,number,number],
  text:     [240, 235, 225] as [number,number,number],
  muted:    [120, 114, 104] as [number,number,number],
  accent:   [201, 151, 58]  as [number,number,number],
  critical: [224, 75,  75]  as [number,number,number],
  high:     [239, 159, 39]  as [number,number,number],
  medium:   [201, 151, 58]  as [number,number,number],
  low:      [99,  153, 34]  as [number,number,number],
  info:     [55,  138, 221] as [number,number,number],
  green:    [99,  153, 34]  as [number,number,number],
}

function severityColor(sev: string): [number,number,number] {
  switch (sev.toLowerCase()) {
    case 'critical':      return C.critical
    case 'high':          return C.high
    case 'medium':        return C.medium
    case 'low':           return C.low
    case 'informational': return C.info
    default:              return C.muted
  }
}

function riskColor(risk: string): [number,number,number] {
  switch (risk) {
    case 'Critical': return C.critical
    case 'High':     return C.high
    case 'Medium':   return C.medium
    case 'Low':      return C.low
    default:         return C.green
  }
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

const PAGE_W    = 210
const PAGE_H    = 297
const MARGIN    = 18
const COL_W     = PAGE_W - MARGIN * 2
const LINE_SM   = 4.5
const LINE_MD   = 6
const LINE_LG   = 8

class Doc {
  pdf: jsPDF
  y: number

  constructor() {
    this.pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    this.y = MARGIN
    this.fillPage()
  }

  private fillPage() {
    this.pdf.setFillColor(...C.bg)
    this.pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')
  }

  needsPage(space = 20) {
    if (this.y + space > PAGE_H - MARGIN) {
      this.pdf.addPage()
      this.fillPage()
      this.y = MARGIN
    }
  }

  gap(mm: number) { this.y += mm }

  divider(alpha = 0.15) {
    this.pdf.setDrawColor(50, 46, 40)
    this.pdf.setLineWidth(0.2)
    this.pdf.line(MARGIN, this.y, PAGE_W - MARGIN, this.y)
    this.y += 4
  }

  text(
    str: string,
    x: number,
    size: number,
    color: [number,number,number],
    opts: { bold?: boolean; maxWidth?: number; align?: 'left'|'right'|'center' } = {}
  ) {
    this.pdf.setFontSize(size)
    this.pdf.setTextColor(...color)
    this.pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    const align = opts.align ?? 'left'
    if (opts.maxWidth) {
      const lines = this.pdf.splitTextToSize(str, opts.maxWidth)
      this.pdf.text(lines, x, this.y, { align })
      this.y += lines.length * (size * 0.45) + 1
    } else {
      this.pdf.text(str, x, this.y, { align })
      this.y += size * 0.45 + 1
    }
  }

  label(str: string) {
    this.text(str.toUpperCase(), MARGIN, 7, C.muted, { bold: true })
    this.y += 1
  }

  body(str: string, color: [number,number,number] = C.text) {
    this.needsPage(12)
    this.text(str, MARGIN, 8.5, color, { maxWidth: COL_W })
    this.y += 1
  }

  badge(str: string, color: [number,number,number], x: number, y: number) {
  const pad = 2.5
  this.pdf.setFontSize(7)
  const w = this.pdf.getTextWidth(str) + pad * 2
  this.pdf.setDrawColor(...color)
  this.pdf.setLineWidth(0.3)
  this.pdf.roundedRect(x, y - 3.5, w, 5, 1, 1, 'S')
  this.pdf.setTextColor(...color)
  this.pdf.setFont('helvetica', 'bold')
  this.pdf.text(str.toUpperCase(), x + pad, y)
  return w
}

  scoreBar(score: number, color: [number,number,number]) {
    const barH = 3
    const barW = COL_W
    // Track
    this.pdf.setFillColor(...C.surface)
    this.pdf.roundedRect(MARGIN, this.y, barW, barH, 1, 1, 'F')
    // Fill
    this.pdf.setFillColor(...color)
    this.pdf.roundedRect(MARGIN, this.y, (barW * score) / 100, barH, 1, 1, 'F')
    this.y += barH + 3
  }
}

// ── PDF builder ────────────────────────────────────────────────────────────────

export function exportAuditPDF(report: AuditReport, contractName: string): void {
  const doc = new Doc()
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const rc = riskColor(report.overall_risk)

  // ── PAGE 1: Summary ──────────────────────────────────────────────────────────

  // Header bar
  doc.pdf.setFillColor(...C.surface)
  doc.pdf.rect(0, 0, PAGE_W, 28, 'F')
  doc.y = 11
  doc.text('Loupe', MARGIN, 13, C.accent, { bold: true })
  doc.text('Security Audit Report', MARGIN, 8.5, C.muted)
  doc.text(date, PAGE_W - MARGIN, 10, C.muted, { align: 'right' })
  doc.y = 32

  // Contract name + risk
  doc.text(contractName, MARGIN, 16, C.text, { bold: true })
  doc.y -= 7
  doc.badge(report.overall_risk + ' Risk', rc, PAGE_W - MARGIN - 28, doc.y - 1)
  doc.y += 5
  doc.gap(2)

  // Score bar
  doc.pdf.setFontSize(8)
  doc.pdf.setTextColor(...C.muted)
  doc.pdf.text('Risk Score', MARGIN, doc.y)
  doc.pdf.setTextColor(...rc)
  doc.pdf.setFont('helvetica', 'bold')
  doc.pdf.text(`${report.risk_score} / 100`, PAGE_W - MARGIN, doc.y, { align: 'right' })
  doc.y += 4
  doc.scoreBar(report.risk_score, rc)

  doc.divider()

  // Summary
  doc.label('Contract Summary')
  doc.body(report.contract_summary, C.text)
  doc.gap(4)

  // Metadata table
  doc.label('Vulnerability Overview')
  const cols = [
    { label: 'Total',    val: report.audit_metadata.total_vulnerabilities, color: C.text },
    { label: 'Critical', val: report.audit_metadata.critical_count,        color: C.critical },
    { label: 'High',     val: report.audit_metadata.high_count,            color: C.high },
    { label: 'Medium',   val: report.audit_metadata.medium_count,          color: C.medium },
    { label: 'Low',      val: report.audit_metadata.low_count,             color: C.low },
  ]
  const cellW = COL_W / cols.length
  cols.forEach((col, i) => {
    const cx = MARGIN + i * cellW
    doc.pdf.setFillColor(...C.surface)
    doc.pdf.roundedRect(cx, doc.y, cellW - 2, 14, 1.5, 1.5, 'F')
    doc.pdf.setFontSize(14)
    doc.pdf.setFont('helvetica', 'bold')
    doc.pdf.setTextColor(...col.color)
    doc.pdf.text(String(col.val), cx + cellW / 2 - 1, doc.y + 8, { align: 'center' })
    doc.pdf.setFontSize(7)
    doc.pdf.setFont('helvetica', 'normal')
    doc.pdf.setTextColor(...C.muted)
    doc.pdf.text(col.label.toUpperCase(), cx + cellW / 2 - 1, doc.y + 12.5, { align: 'center' })
  })
  doc.y += 18

  // Positive findings
  if (report.positive_findings?.length) {
    doc.gap(2)
    doc.divider()
    doc.label('What the contract does well')
    report.positive_findings.forEach(f => {
      doc.needsPage(8)
      doc.pdf.setFontSize(8.5)
      doc.pdf.setTextColor(...C.green)
      doc.pdf.text('✓', MARGIN, doc.y)
      doc.pdf.setTextColor(...C.text)
      doc.pdf.setFont('helvetica', 'normal')
      const lines = doc.pdf.splitTextToSize(f, COL_W - 6)
      doc.pdf.text(lines, MARGIN + 5, doc.y)
      doc.y += lines.length * 4 + 1.5
    })
  }

  // ── PAGE 2+: Vulnerabilities ─────────────────────────────────────────────────

  if (report.vulnerabilities?.length) {
    doc.pdf.addPage()
    // @ts-ignore — internal method
    doc.pdf.setFillColor(...C.bg)
    doc.pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')
    doc.y = MARGIN

    doc.text('Vulnerabilities', MARGIN, 14, C.accent, { bold: true })
    doc.y += 3
    doc.divider()

    report.vulnerabilities.forEach((vuln, idx) => {
      doc.needsPage(48)

      const sc = severityColor(vuln.severity)

      // Vuln header
      const numStr = `${String(idx + 1).padStart(2, '0')}  `
      doc.pdf.setFontSize(9)
      doc.pdf.setFont('helvetica', 'bold')
      doc.pdf.setTextColor(...C.muted)
      doc.pdf.text(numStr, MARGIN, doc.y)
      const numW = doc.pdf.getTextWidth(numStr)
      doc.pdf.setTextColor(...C.text)
      doc.pdf.text(vuln.title, MARGIN + numW, doc.y)
      // Severity badge right
      doc.badge(vuln.severity, sc, PAGE_W - MARGIN - 22, doc.y - 1)
      doc.y += 5

      // Location
      doc.pdf.setFontSize(7.5)
      doc.pdf.setFont('helvetica', 'normal')
      doc.pdf.setTextColor(...C.muted)
      doc.pdf.text(vuln.location, MARGIN, doc.y)
      doc.y += 4.5

      // Category pill
      if (vuln.category) {
        doc.pdf.setFontSize(7)
        doc.pdf.setTextColor(...C.muted)
        doc.pdf.text(`[ ${vuln.category} ]`, MARGIN, doc.y)
        doc.y += 4
      }

      doc.y += 1

      // Sections
      const sections: { label: string; text: string; color: [number,number,number] }[] = [
        { label: 'Description',        text: vuln.description,     color: C.text },
        { label: 'Attack Scenario',    text: vuln.attack_scenario,  color: [220, 160, 160] },
        { label: 'Recommendation',     text: vuln.recommendation,   color: [160, 200, 140] },
      ]
      if (vuln.master_hacker_note) {
        sections.push({ label: 'Master Hacker Note', text: vuln.master_hacker_note, color: C.accent })
      }

      sections.forEach(s => {
        doc.needsPage(16)
        doc.pdf.setFontSize(7)
        doc.pdf.setFont('helvetica', 'bold')
        doc.pdf.setTextColor(...C.muted)
        doc.pdf.text(s.label.toUpperCase(), MARGIN, doc.y)
        doc.y += 3.5
        const lines = doc.pdf.splitTextToSize(s.text, COL_W)
        doc.pdf.setFontSize(8.5)
        doc.pdf.setFont('helvetica', 'normal')
        doc.pdf.setTextColor(...s.color)
        doc.pdf.text(lines, MARGIN, doc.y)
        doc.y += lines.length * 4 + 3
      })

      // Separator between vulns
      if (idx < report.vulnerabilities.length - 1) {
        doc.pdf.setDrawColor(...C.border)
        doc.pdf.setLineWidth(0.15)
        doc.pdf.line(MARGIN, doc.y, PAGE_W - MARGIN, doc.y)
        doc.y += 5
      }
    })
  }

  // ── Final page: Master Hacker Analysis ──────────────────────────────────────

  const p2 = report.phase2_findings
  if (p2) {
    doc.pdf.addPage()
    doc.pdf.setFillColor(...C.bg)
    doc.pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')
    doc.y = MARGIN

    doc.text('Master Hacker Analysis', MARGIN, 14, C.accent, { bold: true })
    doc.text('Adversarial simulation beyond standard scanners', MARGIN, 8, C.muted)
    doc.y += 3
    doc.divider()

    const p2sections: { label: string; items: string[] }[] = [
      { label: 'Assumptions Violated',    items: p2.assumptions_violated    ?? [] },
      { label: 'Edge Cases',              items: p2.edge_cases              ?? [] },
      { label: 'Combined Attack Vectors', items: p2.combined_attack_vectors ?? [] },
      { label: 'MEV Risks',              items: p2.mev_risks               ?? [] },
    ]

    p2sections.forEach(section => {
      if (!section.items.length) return
      doc.needsPage(16)
      doc.label(section.label)
      section.items.forEach(item => {
        doc.needsPage(10)
        doc.pdf.setFontSize(8.5)
        doc.pdf.setTextColor(...C.muted)
        doc.pdf.text('◆', MARGIN, doc.y)
        doc.pdf.setTextColor(...C.text)
        doc.pdf.setFont('helvetica', 'normal')
        const lines = doc.pdf.splitTextToSize(item, COL_W - 5)
        doc.pdf.text(lines, MARGIN + 4, doc.y)
        doc.y += lines.length * 4 + 1.5
      })
      doc.y += 3
    })

    // Overall assessment
    if (p2.overall_hacker_assessment) {
      doc.needsPage(24)
      doc.divider()
      doc.label('Overall Assessment')
      doc.y -= 2
      doc.body(p2.overall_hacker_assessment, [240, 220, 170])
    }
  }

  // ── Footer on all pages ──────────────────────────────────────────────────────

  const pageCount = doc.pdf.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.pdf.setPage(i)
    doc.pdf.setFontSize(7)
    doc.pdf.setTextColor(...C.muted)
    doc.pdf.text(`Loupe Security Audit  ·  ${contractName}  ·  ${date}`, MARGIN, PAGE_H - 8)
    doc.pdf.text(`${i} / ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' })
    doc.pdf.setDrawColor(...C.border)
    doc.pdf.setLineWidth(0.15)
    doc.pdf.line(MARGIN, PAGE_H - 11, PAGE_W - MARGIN, PAGE_H - 11)
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  const slug = contractName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  doc.pdf.save(`loupe-audit-${slug}.pdf`)
}