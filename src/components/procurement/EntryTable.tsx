import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "./StatusBadge";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

type Entry = Database["public"]["Tables"]["procurement_entries"]["Row"];

interface EntryTableProps {
  entries: Entry[];
  onView: (entry: Entry) => void;
  loading?: boolean;
}

export default function EntryTable({ entries, onView, loading }: EntryTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-muted/50 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No entries found</p>
        <p className="text-xs mt-1">Upload a tender or prequalification to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-medium">Title</TableHead>
            <TableHead className="font-medium">Client</TableHead>
            <TableHead className="font-medium">Deadline</TableHead>
            <TableHead className="font-medium">Value</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="cursor-pointer" onClick={() => onView(entry)}>
              <TableCell className="font-medium">{entry.title}</TableCell>
              <TableCell className="text-muted-foreground">{entry.client_name || "—"}</TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {entry.deadline ? format(new Date(entry.deadline), "dd MMM yyyy") : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {entry.estimated_value ? `$${Number(entry.estimated_value).toLocaleString()}` : "—"}
              </TableCell>
              <TableCell><StatusBadge status={entry.status} /></TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
