import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, CheckCircle2, Circle, Lock, X } from "lucide-react";

interface PollCardProps {
  pollId: number;
  onClose?: () => void;
}

export default function PollCard({ pollId, onClose }: PollCardProps) {
  const { user } = useAuth();
  const { data: poll, refetch } = trpc.groups.getPollDetails.useQuery({ pollId });

  const voteMutation = trpc.groups.votePoll.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => toast.error(err.message),
  });

  const closePollMutation = trpc.groups.closePoll.useMutation({
    onSuccess: () => {
      toast.success("Enquete encerrada");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!poll) return null;

  const totalVotes = poll.options?.reduce((sum: number, opt: any) => sum + (opt.voteCount || 0), 0) || 0;
  const hasVoted = poll.myVotes && poll.myVotes.length > 0;
  const isCreator = poll.createdBy === user?.id;

  return (
    <div className="rounded-xl border border-border/30 bg-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-medium text-foreground">{poll.question}</h4>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {poll.description && (
        <p className="text-xs text-muted-foreground mb-3">{poll.description}</p>
      )}

      {poll.closed && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>Enquete encerrada</span>
        </div>
      )}

      {/* Options */}
      <div className="space-y-2 mb-3">
        {poll.options?.map((option: any) => {
          const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
          const isSelected = poll.myVotes?.includes(option.id);

          return (
            <button
              key={option.id}
              onClick={() => !poll.closed && voteMutation.mutate({ pollId, optionId: option.id })}
              disabled={poll.closed || voteMutation.isPending}
              className={`w-full relative overflow-hidden rounded-lg border p-2.5 text-left transition-all ${
                isSelected
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/50 hover:border-primary/30"
              } ${poll.closed ? "cursor-default" : "cursor-pointer"}`}
            >
              {/* Progress bar background */}
              {(hasVoted || poll.closed) && (
                <div
                  className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs text-foreground">{option.text}</span>
                </div>
                {(hasVoted || poll.closed) && (
                  <span className="text-[10px] text-muted-foreground font-medium ml-2">
                    {percentage}% ({option.voteCount})
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
          {poll.multipleChoice && " · Múltipla escolha"}
        </span>
        {isCreator && !poll.closed && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
            onClick={() => closePollMutation.mutate({ pollId })}
          >
            Encerrar
          </Button>
        )}
      </div>
    </div>
  );
}
