'use client';

import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Toggle({ on, onChange, label }) {
  return (
    <button
      role="switch"
      type="button"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        on ? 'bg-brand' : 'bg-gray-300'
      )}
    >
      <span className={cn('pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out', on ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  );
}

export function Row({ icon: Icon, title, sub, right, onClick, expanded }) {
  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-foreground/70" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-foreground">{title}</span>
        {sub && <span className="block text-sm text-muted-foreground">{sub}</span>}
      </span>
      {right ?? (onClick && (expanded === undefined ? <ChevronRight className="h-5 w-5 text-muted-foreground/60" /> : <ChevronDown className={cn('h-5 w-5 text-muted-foreground/60 transition-transform', expanded && 'rotate-180')} />))}
    </>
  );
  const cls = 'flex w-full items-center gap-3 border-t border-border px-5 py-3.5 text-left';
  return onClick ? (
    <button onClick={onClick} aria-expanded={expanded} className={cn(cls, 'hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-none')}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}