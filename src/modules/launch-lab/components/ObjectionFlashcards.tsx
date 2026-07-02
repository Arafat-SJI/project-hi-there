import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PitchObjection } from "../types";

interface ObjectionFlashcardsProps {
  objections: PitchObjection[];
}

export function ObjectionFlashcards({ objections }: ObjectionFlashcardsProps) {
  const [index, setIndex] = useState(0);

  if (!objections.length) return null;

  const obj = objections[index];

  const next = () => {
    setIndex((i) => (i + 1) % objections.length);
  };
  const prev = () => {
    setIndex((i) => (i - 1 + objections.length) % objections.length);
  };

  return (
    <Card className="overflow-hidden border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-background">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-violet-500" />
          Objection practice
        </CardTitle>
        <Badge variant="outline">
          {index + 1} / {objections.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full rounded-xl border-2 border-dashed border-violet-500/30 p-4 text-left">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Question</p>
          <p className="text-sm font-medium leading-relaxed">{obj.question}</p>

          <div className="mt-4 border-t border-violet-500/20 pt-4">
            <p className="text-xs uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">
              Suggested answer
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{obj.suggested_answer}</p>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" size="sm" onClick={prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
