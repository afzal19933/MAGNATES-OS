import EmptyCard from "@/components/admin/EmptyCard";
import PageHeader from "@/components/admin/PageHeader";

export default function ActivityUploadPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Upload"
        description="Upload chapter activity files and process operational data."
      />
      <EmptyCard />
    </div>
  );
}
