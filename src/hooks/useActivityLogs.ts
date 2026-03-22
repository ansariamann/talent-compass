import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { activityLogsApi } from "@/lib/api";
import { toast } from "sonner";

export function useActivityLogs(page = 1, pageSize = 100) {
  const queryClient = useQueryClient();
  const queryKey = ["activity-logs", page, pageSize];

  const query = useQuery({
    queryKey,
    queryFn: () => activityLogsApi.list(page, pageSize),
    refetchInterval: 30000, 
  });

  const cleanupMutation = useMutation({
    mutationFn: () => activityLogsApi.cleanup(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      toast.success("Successfully cleaned up old logs");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cleanup logs");
    },
  });

  return {
    ...query,
    cleanup: cleanupMutation.mutate,
    isCleaning: cleanupMutation.isPending,
  };
}
