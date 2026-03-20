import { useProcurementEntries } from "@/hooks/useProcurementEntries";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import EntryTable from "@/components/procurement/EntryTable";
import EntryDetailSheet from "@/components/procurement/EntryDetailSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/integrations/supabase/types";

type Entry = Database["public"]["Tables"]["procurement_entries"]["Row"];

export default function ManagerView() {
  const { data: entries = [], isLoading } = useProcurementEntries();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Entry | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["procurement_entries"] });

  const pending = entries.filter((e) => e.status === "pending_approval");
  const approved = entries.filter((e) => e.status === "approved" || e.status === "in_progress");
  const completed = entries.filter((e) => e.status === "completed");
  const rejected = entries.filter((e) => e.status === "rejected");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ lineHeight: "1.1" }}>Manager View</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor all entries, approvals, and progress</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({approved.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          <TabsTrigger value="all">All ({entries.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending"><EntryTable entries={pending} onView={setSelected} loading={isLoading} /></TabsContent>
        <TabsContent value="active"><EntryTable entries={approved} onView={setSelected} loading={isLoading} /></TabsContent>
        <TabsContent value="completed"><EntryTable entries={completed} onView={setSelected} loading={isLoading} /></TabsContent>
        <TabsContent value="rejected"><EntryTable entries={rejected} onView={setSelected} loading={isLoading} /></TabsContent>
        <TabsContent value="all"><EntryTable entries={entries} onView={setSelected} loading={isLoading} /></TabsContent>
      </Tabs>

      <EntryDetailSheet entry={selected} open={!!selected} onClose={() => setSelected(null)} onUpdate={() => { refresh(); setSelected(null); }} />
    </div>
  );
}
