import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBids, type Bid } from "@/hooks/useBids";
import PipelineBoard from "@/components/bids/PipelineBoard";
import BidDetailSheet from "@/components/bids/BidDetailSheet";
import CreateBidDialog from "@/components/bids/CreateBidDialog";

export default function Pipeline() {
  const { data: bids = [], isLoading } = useBids();
  const queryClient = useQueryClient();
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["bids"] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ lineHeight: "1.1" }}>Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag bids between stages to update their status</p>
        </div>
        <CreateBidDialog onCreated={refresh} />
      </div>

      {isLoading ? (
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-64 h-48 bg-muted/50 rounded-lg animate-pulse flex-shrink-0" />
          ))}
        </div>
      ) : (
        <PipelineBoard bids={bids} onRefresh={refresh} onViewBid={setSelectedBid} />
      )}

      <BidDetailSheet bid={selectedBid} open={!!selectedBid} onClose={() => setSelectedBid(null)} onUpdate={() => { refresh(); setSelectedBid(null); }} />
    </div>
  );
}
