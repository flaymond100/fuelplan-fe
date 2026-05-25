import ComingSoon from '../components/ComingSoon';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Account, password, notifications, and preferences." />
      <div className="mt-8">
        <ComingSoon
          title="Settings coming soon"
          description="Change your email, password, and notification preferences here."
        />
      </div>
    </div>
  );
}
