/**
 * Coloured status pill shared by the admin, student and teacher dashboards.
 * Accepts `TeacherStatus`, `EnrollmentStatus` and other free-form statuses.
 */
export default function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="badge">—</span>;

  const tone =
    status === 'APPROVED' || status === 'ACTIVE'
      ? 'ok'
      : status === 'PENDING'
        ? 'warn'
        : status === 'REJECTED' || status === 'CANCELLED'
          ? 'err'
          : '';

  return <span className={`badge ${tone}`}>{status}</span>;
}
