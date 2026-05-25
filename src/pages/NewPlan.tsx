import ComingSoon from '../components/ComingSoon';
import PageHeader from '../components/PageHeader';

export default function NewPlan() {
  return (
    <div>
      <PageHeader
        title="New plan"
        subtitle="Upload a GPX route and answer a few questions to get a personalised fuelling plan."
      />
      <div className="mt-8">
        <ComingSoon
          title="GPX upload coming next"
          description="Drag-and-drop GPX, profile form, and Claude-generated plan output land here."
        />
      </div>
    </div>
  );
}
