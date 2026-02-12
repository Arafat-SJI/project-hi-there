import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { OKRRow } from "@/types/okr";

/**
 * Permission helper for OKR actions.
 * Current rules are compatible with existing EOS roles and can be tightened later.
 */
export function useOKRPermissions(okr: OKRRow | null) {
  const { user, isAdmin } = useAuth();

  return useMemo(() => {
    if (!okr || !user) {
      return {
        canEdit: false,
        canDelete: false,
        canDuplicate: false,
        canClose: false,
        canUpdate: false,
      };
    }

    const isOwner = okr.owner_id === user.id || okr.created_by === user.id;
    const canManage = isAdmin || isOwner;

    return {
      canEdit: canManage,
      canDelete: canManage,
      canDuplicate: canManage,
      canClose: canManage,
      canUpdate: canManage,
    };
  }, [isAdmin, okr, user]);
}
