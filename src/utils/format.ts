export function formatShotSeconds(ms: number): string {
  return String(Math.ceil(ms / 1000));
}

export function formatMinutesSeconds(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
