import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Bid = Database["public"]["Tables"]["bids"]["Row"];
export type BidStage = Database["public"]["Enums"]["bid_stage"];

export const STAGES: { key: BidStage; label: string; color: string }[] = [
  { key: "new_lead", label: "New Lead", color: "hsl(217, 91%, 60%)" },
  { key: "qualified", label: "Qualified", color: "hsl(263, 70%, 50%)" },
  { key: "in_progress", label: "In Progress", color: "hsl(38, 92%, 50%)" },
  { key: "submitted", label: "Submitted", color: "hsl(199, 89%, 48%)" },
  { key: "won", label: "Won", color: "hsl(152, 60%, 40%)" },
  { key: "lost", label: "Lost", color: "hsl(0, 72%, 51%)" },
];

export function useBids() {
  return useQuery({
    queryKey: ["bids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
