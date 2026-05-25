import ComingSoon from '../components/ComingSoon';
import PageHeader from '../components/PageHeader';

export default function Profile() {
  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Body weight, sweat rate, gut tolerance, dietary preferences — once, reused on every plan."
      />
      <div className="mt-8">
        <ComingSoon
          title="Profile form coming soon"
          description="The fields here feed every plan you generate. Filling it out once means better recommendations forever."
        />
      </div>
    </div>
  );
}
