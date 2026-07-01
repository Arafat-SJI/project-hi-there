import { ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StrengthsCardProps {
  strengths: string[];
}

export function StrengthsCard({ strengths }: StrengthsCardProps) {
  if (!strengths?.length) return null;

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-emerald-500" />
          What&apos;s working
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {strengths.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="text-emerald-500 font-bold">✓</span>
              {s}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
