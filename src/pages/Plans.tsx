import ComingSoon from '../components/ComingSoon';
import PageHeader from '../components/PageHeader';

export default function Plans() {
  return (
    <div>
      <PageHeader title="My plans" subtitle="Every plan you generate lives here." />
      <div className="mt-8">
        <ComingSoon
          title="No plans yet"
          description="Plans you generate will appear here. Create your first one from the New plan page."
        />
      </div>
    </div>
  );
}
