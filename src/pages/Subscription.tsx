import ComingSoon from '../components/ComingSoon';
import PageHeader from '../components/PageHeader';

export default function Subscription() {
  return (
    <div>
      <PageHeader
        title="Subscription"
        subtitle="Manage your plan, billing, and one-off plan credits."
      />
      <div className="mt-8">
        <ComingSoon
          title="Billing coming soon"
          description="Stripe checkout, current subscription status, and plan-credit balance live here."
        />
      </div>
    </div>
  );
}
