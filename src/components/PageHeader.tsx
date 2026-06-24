import type { ReactNode } from 'react';

export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{title}</h1>
        {subtitle && <p className="mt-2 text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
