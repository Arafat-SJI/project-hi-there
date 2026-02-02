import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import {
  useProjectModuleSettings,
  type ProjectModuleSetting,
} from "@/hooks/useProjectModuleSettings";

/**
 * Project Modules (skeleton)
 *
 * Placeholder for `/admin/settings/project-modules` from sj-control-main.
 * Lets Admins see which detail tabs exist and conceptually toggle them.
 * Currently backed by static config; no persistence yet.
 */
export default function ProjectModules() {
  const { data: modules, isLoading } = useProjectModuleSettings();
  const [localState, setLocalState] = useState<Record<string, boolean>>({});

  const handleToggle = (module: ProjectModuleSetting, enabled: boolean) => {
    setLocalState((prev) => ({ ...prev, [module.key]: enabled }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This page shows the potential tabs for <code>ProjectDetailPage</code> (tasks,
              integrations, client portal, etc.). In this framework it is a read-only
              configuration preview; wire it to <code>system_settings</code> if you want
              to persist these toggles.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {modules?.map((module) => {
              const checked = localState[module.key] ?? module.enabled;
              return (
                <div
                  key={module.key}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{module.label}</span>
                      <span className="text-xs text-muted-foreground">
                        ({module.key})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={module.key} className="text-xs">
                      Enabled
                    </Label>
                    <Switch
                      id={module.key}
                      checked={checked}
                      onCheckedChange={(value) =>
                        handleToggle(module, Boolean(value))
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

