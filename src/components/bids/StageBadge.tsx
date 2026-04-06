import { STAGES, type BidStage } from "@/hooks/useBids";

export default function StageBadge({ stage }: { stage: BidStage }) {
  const config = STAGES.find((s) => s.key === stage);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ borderColor: config?.color, color: config?.color, backgroundColor: `${config?.color}15` }}
    >
      {config?.label || stage}
    </span>
  );
}
