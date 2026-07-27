import jsPDF from 'jspdf'

const severityLabel = { high: 'High', medium: 'Medium', low: 'Low' }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

/**
 * Builds and downloads a PDF snapshot of the current dashboard: the
 * institutional pulse (admins only), the same KPI numbers shown on the
 * page, and the open alerts / recent notifications lists. Uses whatever
 * data the Dashboard already has loaded via react-query, so it always
 * matches what the user is looking at -- no extra API round trip.
 */
export function exportDashboardReport({
  user,
  isAdmin,
  pulse,
  courses,
  unresolvedAlerts,
  flaggedStudents,
  highSeverityCount,
  unreadCount,
  notifications
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 48
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 56

  const heading = (text, size = 12) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    doc.setTextColor(20, 18, 15)
    doc.text(text, marginX, y)
    y += size * 0.9
  }

  const line = (text, opts = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.setFontSize(opts.size || 10.5)
    doc.setTextColor(...(opts.color || [60, 56, 50]))
    doc.text(text, marginX + (opts.indent || 0), y)
    y += (opts.size || 10.5) * 1.35
  }

  const rule = () => {
    y += 4
    doc.setDrawColor(214, 208, 198)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += 18
  }

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(20, 18, 15)
  doc.text('EduPulse', marginX, y)
  y += 20
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(110, 104, 94)
  const subtitle = user?.institution_name
    ? `Institutional report — ${user.institution_name}`
    : 'Institutional report'
  doc.text(subtitle, marginX, y)
  y += 14
  doc.setFontSize(9.5)
  doc.text(`Generated ${formatDate(new Date().toISOString())} by ${user?.first_name || ''} ${user?.last_name || ''}`.trim(), marginX, y)
  y += 26
  rule()

  // Institutional pulse (admins only -- same gating as the dashboard hero)
  if (isAdmin) {
    heading('Institutional Pulse')
    y += 4
    line(`Pulse score: ${pulse?.pulse ?? '—'}`, { bold: true })
    line(`Attendance rate: ${pulse?.attendance_rate != null ? `${pulse.attendance_rate}%` : '—'}`)
    line(`Average grade: ${pulse?.grade_average ?? '—'}`)
    y += 8
    rule()
  }

  // KPI summary
  heading('Summary')
  y += 4
  line(`${isAdmin ? 'Active courses' : 'My courses'}: ${courses?.length ?? 0}`)
  if (isAdmin) {
    line(`Flagged students (open alert): ${flaggedStudents ?? 0}`)
    line(`High-risk alerts: ${highSeverityCount ?? 0}`)
  }
  line(`Unread notifications: ${unreadCount ?? 0}`)
  y += 8
  rule()

  // Open alerts
  heading(`Open Alerts (${unresolvedAlerts?.length ?? 0})`)
  y += 4
  if (!unresolvedAlerts?.length) {
    line('No open alerts.', { color: [140, 134, 124] })
  } else {
    unresolvedAlerts.slice(0, 25).forEach(a => {
      if (y > 760) { doc.addPage(); y = 56 }
      line(`[${severityLabel[a.severity] || a.severity}] ${a.student_name || 'Unknown student'} — ${a.course_name || a.alert_type.replace('_', ' ')}`)
    })
    if (unresolvedAlerts.length > 25) {
      line(`…and ${unresolvedAlerts.length - 25} more.`, { color: [140, 134, 124] })
    }
  }
  y += 8
  rule()

  // Recent notifications
  heading(`Recent Notifications (${notifications?.length ?? 0})`)
  y += 4
  if (!notifications?.length) {
    line('No notifications.', { color: [140, 134, 124] })
  } else {
    notifications.slice(0, 15).forEach(n => {
      if (y > 760) { doc.addPage(); y = 56 }
      line(`${n.title}: ${n.message}`)
    })
    if (notifications.length > 15) {
      line(`…and ${notifications.length - 15} more.`, { color: [140, 134, 124] })
    }
  }

  const stamp = new Date().toISOString().slice(0, 10)
  const who = (user?.institution_name || 'edupulse').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  doc.save(`edupulse-report-${who}-${stamp}.pdf`)
}
