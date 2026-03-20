import { useProcurementEntries } from "@/hooks/useProcurementEntries";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Shield, Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import EntryTable from "@/components/procurement/EntryTable";
import EntryDetailSheet from "@/components/procurement/EntryDetailSheet";
import UploadEntryDialog from "@/components/procurement/UploadEntryDialog";
import type { Database } from "@/integrations/supabase/types";

type Entry = Database["public"]["Tables"]["procurement_entries"]["Row"];

export default function Dashboard() {
  const { data: entries = [], isLoading } = useProcurementEntries();
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["procurement_entries"] });

  const tenders = entries.filter((e) => e.entry_type === "tender");
  const prequalifications = entries.filter((e) => e.entry_type === "prequalification");
  const pending = entries.filter((e) => e.status === "pending_approval");
  const completed = entries.filter((e) => e.status === "completed");
  const rejected = entries.filter((e) => e.status === "rejected");
  const inProgress = entries.filter((e) => e.status === "approved" || e.status === "in_progress");

  const stats = [
    { label: "Tenders", value: tenders.length, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Prequalifications", value: prequalifications.length, icon: Shield, color: "text-emerald-600 bg-emerald-50" },
    { label: "Pending Approval", value: pending.length, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "In Progress", value: inProgress.length, icon: AlertTriangle, color: "text-sky-600 bg-sky-50" },
    { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
    { label: "Rejected", value: rejected.length, icon: XCircle, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ lineHeight: "1.1" }}>Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of all procurement entries</p>
        </div>
        <UploadEntryDialog onCreated={refresh} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-card rounded-lg border p-4 shadow-sm animate-fade-in-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <h2 className="text-sm font-medium text-muted-foreground">Pending Approval</h2>
          <EntryTable entries={pending} onView={setSelectedEntry} />
        </div>
      )}

      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <h2 className="text-sm font-medium text-muted-foreground">Recent Entries</h2>
        <EntryTable entries={entries.slice(0, 10)} onView={setSelectedEntry} loading={isLoading} />
      </div>

      <EntryDetailSheet
        entry={selectedEntry}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onUpdate={() => { refresh(); setSelectedEntry(null); }}
      />
    </div>
  );
}
