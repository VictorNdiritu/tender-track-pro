import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { DollarSign, Calendar } from "lucide-react";
import { STAGES, type Bid, type BidStage } from "@/hooks/useBids";
import StageBadge from "./StageBadge";

interface Props {
  bids: Bid[];
  onRefresh: () => void;
  onViewBid: (bid: Bid) => void;
}

export default function PipelineBoard({ bids, onRefresh, onViewBid }: Props) {
  const { user } = useAuth();

  const columns = STAGES.map((stage) => ({
    ...stage,
    bids: bids.filter((b) => b.stage === stage.key),
  }));

  async function handleDragEnd(result: DropResult) {
    if (!result.destination || !user) return;
    const bidId = result.draggableId;
    const newStage = result.destination.droppableId as BidStage;
    const bid = bids.find((b) => b.id === bidId);
    if (!bid || bid.stage === newStage) return;

    const { error } = await supabase.from("bids").update({ stage: newStage }).eq("id", bidId);
    if (error) { toast.error(error.message); return; }

    await supabase.from("bid_activities").insert({
      bid_id: bidId, user_id: user.id, action: "stage_changed",
      details: { from: bid.stage, to: newStage },
    });

    toast.success(`Moved to ${STAGES.find((s) => s.key === newStage)?.label}`);
    onRefresh();
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => (
          <Droppable key={col.key} droppableId={col.key}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-shrink-0 w-64 rounded-lg border p-3 transition-colors ${
                  snapshot.isDraggingOver ? "bg-accent/50 border-primary/30" : "bg-card"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-sm font-medium">{col.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{col.bids.length}</span>
                </div>

                <div className="space-y-2 min-h-[60px]">
                  {col.bids.map((bid, index) => (
                    <Draggable key={bid.id} draggableId={bid.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onViewBid(bid)}
                          className={`p-3 rounded-md border bg-background cursor-pointer hover:shadow-sm transition-shadow ${
                            snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
                          }`}
                        >
                          <p className="text-sm font-medium truncate">{bid.title}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{bid.client_name}</p>
                          <div className="flex items-center gap-3 mt-2">
                            {bid.estimated_value ? (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <DollarSign className="w-3 h-3" />{Number(bid.estimated_value).toLocaleString()}
                              </span>
                            ) : null}
                            {bid.deadline && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Calendar className="w-3 h-3" />{format(new Date(bid.deadline), "dd MMM")}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
