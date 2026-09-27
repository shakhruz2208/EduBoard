/**
 * Minimal CSV export — no dependencies. Values are escaped per RFC 4180
 * and a BOM is prepended so Excel opens Cyrillic/Uzbek text correctly.
 */

const escapeCell = (value) => {
  const s = String(value ?? '')
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const toCsv = (headers, rows) => {
  const lines = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))]
  return '\uFEFF' + lines.join('\r\n')
}

/** Trigger a browser download of a CSV file. */
export const downloadCsv = (filename, csv) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
