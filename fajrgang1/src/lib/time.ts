export function formatRemainingAr(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return "انتهت";

  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0
      ? `يتبقى ${days} يوم و ${hours} ساعة`
      : `يتبقى ${days} يوم`;
  }
  if (hours > 0) {
    return minutes > 0
      ? `يتبقى ${hours} ساعة و ${minutes} دقيقة`
      : `يتبقى ${hours} ساعة`;
  }
  if (minutes <= 1) return "يتبقى أقل من دقيقة";
  return `يتبقى ${minutes} دقيقة`;
}

export function remainingRatio(createdAt: string, expiresAt: string): number {
  const start = new Date(createdAt).getTime();
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  if (end <= start) return 0;
  return Math.max(0, Math.min(1, (end - now) / (end - start)));
}

export function durationHoursLabel(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} دقيقة`;
  if (hours === 1) return "ساعة واحدة";
  if (hours === 24) return "يوم واحد";
  if (hours === 72) return "3 أيام";
  if (hours === 168) return "أسبوع";
  if (hours % 24 === 0) return `${hours / 24} أيام`;
  return `${hours} ساعة`;
}

export const NOTE_DURATION_OPTIONS = [
  { hours: 1, label: "ساعة" },
  { hours: 6, label: "6 ساعات" },
  { hours: 12, label: "12 ساعة" },
  { hours: 24, label: "يوم" },
  { hours: 72, label: "3 أيام" },
  { hours: 168, label: "أسبوع" },
] as const;
