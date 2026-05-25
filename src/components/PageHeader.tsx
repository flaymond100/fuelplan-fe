export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{title}</h1>
      {subtitle && <p className="mt-2 text-zinc-500">{subtitle}</p>}
    </div>
  );
}
