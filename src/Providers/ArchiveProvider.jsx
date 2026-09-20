import { createContext, useContext, useEffect, useMemo, useState } from "react"

/**
 * Archive settings + runtime mode.
 *
 * - `weeklyReport`: when ON (default), each finished week produces a summary
 *   in the archive view (who submitted, how many, quiz averages). When OFF
 *   the archive shows only the raw list.
 * - `archiveMode`: live toggle for the dashboard's right panel — when ON the
 *   "Submitted assignments" panel switches to the weekly report / archive.
 *
 * Both persist in localStorage so a refresh keeps the teacher's preference.
 */
const ArchiveContext = createContext(null)

const LS_WEEKLY = "archive.weeklyReport"
const LS_MODE = "archive.mode"

const readFlag = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v === "1"
  } catch { return fallback }
}

export const ArchiveProvider = ({ children }) => {
  const [weeklyReport, setWeeklyReportState] = useState(() => readFlag(LS_WEEKLY, true))
  const [archiveMode, setArchiveModeState] = useState(() => readFlag(LS_MODE, false))

  useEffect(() => {
    try { localStorage.setItem(LS_WEEKLY, weeklyReport ? "1" : "0") } catch { /* ignore */ }
  }, [weeklyReport])

  useEffect(() => {
    try { localStorage.setItem(LS_MODE, archiveMode ? "1" : "0") } catch { /* ignore */ }
  }, [archiveMode])

  const value = useMemo(() => ({
    weeklyReport,
    setWeeklyReport: setWeeklyReportState,
    archiveMode,
    setArchiveMode: setArchiveModeState,
  }), [weeklyReport, archiveMode])

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>
}

export const useArchiveSettings = () => {
  const ctx = useContext(ArchiveContext)
  if (!ctx) {
    // Defensive default so a missing provider never crashes a page.
    return {
      weeklyReport: true,
      setWeeklyReport: () => {},
      archiveMode: false,
      setArchiveMode: () => {},
    }
  }
  return ctx
}
