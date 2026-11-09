'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { cn } from 'cn'; // Pastikan path import ini benar di proyek Anda, biasanya '@/lib/utils'

function Progress({ className, children, value, indicatorClassName, ...props }) {
  return (
    <ProgressPrimitive.Root value={value} data-slot="progress" className={cn('flex flex-wrap gap-3', className)} {...props}>
      {children}
      <ProgressTrack>
        {/* Teruskan value dan indicatorClassName ke ProgressIndicator */}
        <ProgressIndicator value={value} indicatorClassName={indicatorClassName} />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

function ProgressTrack({ className, ...props }) {
  return <ProgressPrimitive.Track className={cn('relative flex h-0.5 w-full items-center overflow-x-hidden rounded-none bg-muted', className)} data-slot="progress-track" {...props} />;
}

// Tambahkan value dan indicatorClassName pada parameter props
function ProgressIndicator({ className, value, indicatorClassName, ...props }) {
  return (
    <ProgressPrimitive.Indicator
      // Perbaiki operator matematika dengan menambahkan minus (-)
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      data-slot="progress-indicator"
      className={cn('h-full w-full flex-1 bg-primary transition-all', indicatorClassName, className)}
      {...props}
    />
  );
}

function ProgressLabel({ className, ...props }) {
  return <ProgressPrimitive.Label className={cn('text-xs font-semibold tracking-wide uppercase', className)} data-slot="progress-label" {...props} />;
}

function ProgressValue({ className, ...props }) {
  return <ProgressPrimitive.Value className={cn('ml-auto text-sm text-muted-foreground tabular-nums', className)} data-slot="progress-value" {...props} />;
}

export { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue };
