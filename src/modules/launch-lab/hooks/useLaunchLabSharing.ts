import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/cache";
import {
  fetchLaunchLabSessionShares,
  fetchLaunchLabShareableUsers,
  getLaunchLabProjectUrl,
  removeLaunchLabSessionShare,
  shareLaunchLabSessionWithUser,
} from "../lib/session-sharing";

export function useLaunchLabSharing(sessionId: string, enabled: boolean) {
  const queryClient = useQueryClient();

  const sharesQuery = useQuery({
    queryKey: queryKeys.launchLab.shares(sessionId),
    queryFn: () => fetchLaunchLabSessionShares(sessionId),
    enabled: enabled && !!sessionId,
    staleTime: 1000 * 30,
  });

  const shareableUsersQuery = useQuery({
    queryKey: queryKeys.launchLab.shareableUsers,
    queryFn: fetchLaunchLabShareableUsers,
    enabled: enabled && !!sessionId,
    staleTime: 1000 * 60 * 5,
  });

  const shareMutation = useMutation({
    mutationFn: (userId: string) => shareLaunchLabSessionWithUser(sessionId, userId),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Project shared");
      void queryClient.invalidateQueries({ queryKey: queryKeys.launchLab.shares(sessionId) });
    },
    onError: () => {
      toast.error("Could not share project");
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeLaunchLabSessionShare,
    onSuccess: () => {
      toast.success("Access removed");
      void queryClient.invalidateQueries({ queryKey: queryKeys.launchLab.shares(sessionId) });
    },
    onError: () => {
      toast.error("Could not remove access");
    },
  });

  const copyProjectLink = async () => {
    const url = getLaunchLabProjectUrl(sessionId);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Project link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return {
    shares: sharesQuery.data ?? [],
    shareableUsers: shareableUsersQuery.data ?? [],
    isLoadingShares: sharesQuery.isLoading,
    isLoadingUsers: shareableUsersQuery.isLoading,
    shareWithUser: shareMutation.mutate,
    isSharing: shareMutation.isPending,
    sharingUserId: shareMutation.variables,
    removeShare: removeMutation.mutate,
    isRemovingShare: removeMutation.isPending,
    copyProjectLink,
    projectUrl: getLaunchLabProjectUrl(sessionId),
  };
}
