import { useEffect, useState } from 'react';

const STEPS = [
  'Reading your athlete profile…',
  'Analysing the route & elevation…',
  'Mapping the climbs and descents…',
  'Checking race-day weather…',
  'Calculating carb & fluid targets…',
  'Timing caffeine and supplements…',
  'Consulting the AI nutritionist…',
  'Building your day-by-day plan…',
  'Almost there — plating it up…',
];

export default function GeneratingOverlay() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Spread the steps across ~2 min, then hold on the last message
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 12000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-zinc-200 bg-white px-8 py-10 text-center shadow-2xl">
        {/* Spinner: dual orbiting rings with a pulsing core */}
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
          <div
            className="absolute inset-2 animate-spin rounded-full border-4 border-orange-100 border-b-orange-500"
            style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="h-3 w-3 animate-pulse rounded-full bg-linear-to-br from-amber-400 to-orange-600" />
          </div>
        </div>

        <h2 className="mt-6 text-lg font-bold tracking-tight text-zinc-900">Building your plan</h2>

        <p key={step} className="animate-fade-in mt-2 min-h-10 text-sm text-zinc-500">
          {STEPS[step]}
        </p>

        {/* Progress dots */}
        <div className="mt-5 flex gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= step ? 'w-5 bg-amber-500' : 'w-1.5 bg-zinc-200'
              }`}
            />
          ))}
        </div>

        <p className="mt-6 text-xs text-zinc-400">This can take up to 2 minutes — hang tight.</p>
      </div>
    </div>
  );
}
