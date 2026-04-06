import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { STAGES, type Bid, type BidStage } from "@/hooks/useBids";
import StageBadge from "./StageBadge";

interface Props {
  bid: Bid | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function BidDetailSheet({ bid, open, onClose, onUpdate }: Props) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", client_name: "", description: "", estimated_value: "", deadline: "", stage: "" as BidStage });
  const [notes, setNotes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newLink, setNewLink] = useState("");

  useEffect(() => {
    if (bid) {
      setForm({
        title: bid.title,
        client_name: bid.client_name,
        description: bid.description || "",
        estimated_value: String(bid.estimated_value || 0),
        deadline: bid.deadline ? bid.deadline.split("T")[0] : "",
        stage: bid.stage,
      });
      setEditing(false);
      fetchNotes(bid.id);
      fetchActivities(bid.id);
    }
  }, [bid]);

  async function fetchNotes(bidId: string) {
    const { data } = await supabase.from("bid_notes").select("*").eq("bid_id", bidId).order("created_at", { ascending: false });
    if (data) setNotes(data);
  }

  async function fetchActivities(bidId: string) {
    const { data } = await supabase.from("bid_activities").select("*").eq("bid_id", bidId).order("created_at", { ascending: false });
    if (data) setActivities(data);
  }

  async function handleSave() {
    if (!bid || !user) return;
    const oldStage = bid.stage;
    const { error } = await supabase.from("bids").update({
      title: form.title,
      client_name: form.client_name,
      description: form.description,
      estimated_value: Number(form.estimated_value) || 0,
      deadline: form.deadline || null,
      stage: form.stage,
    }).eq("id", bid.id);
    if (error) { toast.error(error.message); return; }

    if (oldStage !== form.stage) {
      await supabase.from("bid_activities").insert({
        bid_id: bid.id, user_id: user.id, action: "stage_changed",
        details: { from: oldStage, to: form.stage },
      });
    }
    await supabase.from("bid_activities").insert({
      bid_id: bid.id, user_id: user.id, action: "updated",
      details: { title: form.title },
    });

    toast.success("Bid updated");
    setEditing(false);
    onUpdate();
  }

  async function addNote() {
    if (!bid || !user || !newNote.trim()) return;
    await supabase.from("bid_notes").insert({ bid_id: bid.id, user_id: user.id, content: newNote.trim() });
    setNewNote("");
    fetchNotes(bid.id);
  }

  async function addDocumentLink() {
    if (!bid || !newLink.trim()) return;
    const links = [...(bid.document_links || []), newLink.trim()];
    await supabase.from("bids").update({ document_links: links }).eq("id", bid.id);
    setNewLink("");
    toast.success("Link added");
    onUpdate();
  }

  if (!bid) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {bid.title} <StageBadge stage={bid.stage} />
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {editing ? (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Client</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Value ($)</Label><Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} /></div>
                <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              </div>
              <div>
                <Label>Stage</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as BidStage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Client:</span> {bid.client_name}</p>
              <p><span className="text-muted-foreground">Value:</span> ${Number(bid.estimated_value).toLocaleString()}</p>
              <p><span className="text-muted-foreground">Deadline:</span> {bid.deadline ? format(new Date(bid.deadline), "dd MMM yyyy") : "—"}</p>
              <p><span className="text-muted-foreground">Description:</span> {bid.description || "—"}</p>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
            </div>
          )}

          <Separator />

          {/* Document Links */}
          <div>
            <h4 className="text-sm font-medium mb-2">Document Links</h4>
            {(bid.document_links || []).length > 0 ? (
              <ul className="space-y-1">
                {bid.document_links!.map((link, i) => (
                  <li key={i}><a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">{link}</a></li>
                ))}
              </ul>
            ) : <p className="text-xs text-muted-foreground">No links yet</p>}
            <div className="flex gap-2 mt-2">
              <Input placeholder="https://..." value={newLink} onChange={(e) => setNewLink(e.target.value)} className="text-sm" />
              <Button size="sm" variant="outline" onClick={addDocumentLink}>Add</Button>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <h4 className="text-sm font-medium mb-2">Notes</h4>
            <div className="flex gap-2 mb-3">
              <Input placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="text-sm" onKeyDown={(e) => e.key === "Enter" && addNote()} />
              <Button size="sm" variant="outline" onClick={addNote}>Add</Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notes.map((n) => (
                <div key={n.id} className="text-sm p-2 bg-muted/50 rounded">
                  <p>{n.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "dd MMM HH:mm")}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Activity Timeline */}
          <div>
            <h4 className="text-sm font-medium mb-2">Activity</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium">{a.action.replace(/_/g, " ")}</span>
                    {a.details?.from && <span className="text-muted-foreground"> {a.details.from} → {a.details.to}</span>}
                    <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd MMM HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
