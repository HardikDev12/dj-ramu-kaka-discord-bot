'use client';

import { cn } from '@/lib/utils';

export function PageLoader({ label = 'Loading...', fullScreen = false }) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center',
        fullScreen ? 'min-h-screen bg-[#0e0e0e]' : 'min-h-[45vh]'
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-end gap-1" aria-hidden>
          {[12, 22, 16, 28, 14, 24, 18, 10].map((h, i) => (
            <span
              key={`${h}-${i}`}
              className="loader-bar block w-1.5 rounded-full bg-gradient-to-t from-[#ffa84f] to-[#fdd400]"
              style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#adaaaa]">{label}</p>
      </div>
      <style jsx>{`
        .loader-bar {
          animation: pulse 0.9s ease-in-out infinite;
          transform-origin: bottom center;
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scaleY(0.6);
            opacity: 0.65;
          }
          50% {
            transform: scaleY(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
