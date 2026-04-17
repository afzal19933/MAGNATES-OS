import EmptyCard from "@/components/admin/EmptyCard";
import PageHeader from "@/components/admin/PageHeader";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of chapter operations and admin activity."
      />
      <EmptyCard />
    </div>
  );
}
