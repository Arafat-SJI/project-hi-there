/**
 * VTO Page
 *
 * Vision/Traction Organizer — displays all VTO sections with inline editing.
 */

import { Loader2 } from "lucide-react";
import { useVTO, useUpdateVTO } from "../hooks/useVTO";
import { VTOSection } from "../components/vto/VTOSection";

export default function VTOPage() {
  const { data: sections, isLoading } = useVTO();
  const updateVTO = useUpdateVTO();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vision/Traction Organizer</h1>
        <p className="text-muted-foreground">
          Your company's strategic plan — from core values to quarterly rocks
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(sections || []).map((section) => (
            <VTOSection
              key={section.id}
              section={section}
              onSave={(sectionKey, content) =>
                updateVTO.mutate({ section: sectionKey, content })
              }
              isSaving={updateVTO.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
