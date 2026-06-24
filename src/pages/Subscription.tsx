import ComingSoon from '../components/ComingSoon';
import PageHeader from '../components/PageHeader';

export default function Subscription() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        subtitle="Manage your plan, billing, and one-off plan credits."
      />
      <ComingSoon
        title="Billing coming soon"
        description="Stripe checkout, current subscription status, and plan-credit balance live here."
      />
    </div>
  );
}
