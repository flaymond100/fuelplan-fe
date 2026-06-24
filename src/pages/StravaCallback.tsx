import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, errorStatus } from '../lib/api';
import { useInvalidateStravaStatus } from '../hooks/useStravaStatus';

export default function StravaCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const invalidate = useInvalidateStravaStatus();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get('code');
    const error = params.get('error');

    if (error || !code) {
      toast.error('Strava connection was cancelled.');
      navigate('/app/profile/edit', { replace: true });
      return;
    }

    api
      .post<{ athleteName: string }>('/api/integrations/strava/callback', { code })
      .then(({ athleteName }) => {
        invalidate();
        toast.success(`Connected to Strava as ${athleteName}`);
        navigate('/app/profile/edit', { replace: true });
      })
      .catch((err) => {
        const status = errorStatus(err);
        toast.error(
          status === 401
            ? 'Session expired — please log in again.'
            : 'Could not connect Strava. Please try again.',
        );
        navigate('/app/profile/edit', { replace: true });
      });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-64 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-brand-500" />
        <p className="mt-4 text-sm text-zinc-500">Connecting to Strava…</p>
      </div>
    </div>
  );
}
