import { Copy, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ElevatorHooksCardProps {
  hooks: string[];
}

export function ElevatorHooksCard({ hooks }: ElevatorHooksCardProps) {
  if (!hooks?.length) return null;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Hook copied!");
  };

  return (
    <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-orange-500" />
          Elevator hooks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hooks.map((hook, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg border p-3 bg-background/60">
            <span className="text-xs font-bold text-orange-500 mt-0.5">#{i + 1}</span>
            <p className="text-sm flex-1">{hook}</p>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copy(hook)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
