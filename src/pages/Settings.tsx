import ComingSoon from '../components/ComingSoon';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Account, password, notifications, and preferences." />
      <ComingSoon
        title="Settings coming soon"
        description="Change your email, password, and notification preferences here."
      />
    </div>
  );
}
