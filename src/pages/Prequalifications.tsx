import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProcurementEntries } from "@/hooks/useProcurementEntries";
import EntryTable from "@/components/procurement/EntryTable";
import EntryDetailSheet from "@/components/procurement/EntryDetailSheet";
import UploadEntryDialog from "@/components/procurement/UploadEntryDialog";
import type { Database } from "@/integrations/supabase/types";

type Entry = Database["public"]["Tables"]["procurement_entries"]["Row"];

export default function Prequalifications() {
  const { data: entries = [], isLoading } = useProcurementEntries({ type: "prequalification" });
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Entry | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["procurement_entries"] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ lineHeight: "1.1" }}>Prequalifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage prequalification submissions</p>
        </div>
        <UploadEntryDialog defaultType="prequalification" onCreated={refresh} />
      </div>
      <EntryTable entries={entries} onView={setSelected} loading={isLoading} />
      <EntryDetailSheet entry={selected} open={!!selected} onClose={() => setSelected(null)} onUpdate={() => { refresh(); setSelected(null); }} />
    </div>
  );
}
