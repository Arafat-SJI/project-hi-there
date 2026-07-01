import { ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface PitchBeforeAfterProps {
  original: string;
  improved: string;
}

export function PitchBeforeAfter({ original, improved }: PitchBeforeAfterProps) {
  const [copied, setCopied] = useState(false);

  const copyImproved = async () => {
    await navigator.clipboard.writeText(improved);
    setCopied(true);
    toast.success("Improved pitch copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Before → After</CardTitle>
        <Button variant="outline" size="sm" onClick={copyImproved}>
          {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
          Copy improved
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Your draft</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{original}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 relative">
          <ArrowRight className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500 hidden md:block" />
          <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            AI-polished
          </p>
          <p className="text-sm whitespace-pre-wrap">{improved}</p>
        </div>
      </CardContent>
    </Card>
  );
}
