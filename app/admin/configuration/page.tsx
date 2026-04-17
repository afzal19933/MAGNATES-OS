import EmptyCard from "@/components/admin/EmptyCard";
import PageHeader from "@/components/admin/PageHeader";

export default function ConfigurationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration"
        description="Update system-wide settings and operational preferences."
      />
      <EmptyCard />
    </div>
  );
}
