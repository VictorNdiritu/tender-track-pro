import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type EntryType = Database["public"]["Enums"]["entry_type"];
type EntryStatus = Database["public"]["Enums"]["entry_status"];

interface Filters {
  type?: EntryType;
  status?: EntryStatus;
}

export function useProcurementEntries(filters?: Filters) {
  return useQuery({
    queryKey: ["procurement_entries", filters],
    queryFn: async () => {
      let query = supabase
        .from("procurement_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.type) query = query.eq("entry_type", filters.type);
      if (filters?.status) query = query.eq("status", filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
