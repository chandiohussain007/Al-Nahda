export interface SkeletonLoaderProps {
  /** Number of skeleton rows. */
  rows?: number;
  /** Row height class, e.g. `h-24` for card-shaped placeholders. */
  height?: string;
  className?: string;
}

/** Shimmering placeholder shown while content loads. */
export default function SkeletonLoader({ rows = 3, height = 'h-4', className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-md bg-sandstone/60 dark:bg-white/10 ${height}`}
          style={{ width: i % 2 === 0 ? '100%' : '85%' }}
        />
      ))}
    </div>
  );
}
