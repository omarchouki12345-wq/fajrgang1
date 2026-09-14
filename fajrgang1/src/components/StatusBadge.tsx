const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "قيد المراجعة", className: "badge-pending" },
  ACTIVE: { label: "نشط", className: "badge-active" },
  PAUSED: { label: "موقوف", className: "badge-paused" },
  REMOVED: { label: "محذوف", className: "badge-removed" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusLabels[status] || { label: status, className: "" };
  return (
    <span className={`badge ${config.className}`}>{config.label}</span>
  );
}
