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
  const [flipped, setFlipped] = useState(false);

  if (!objections.length) return null;

  const obj = objections[index];

  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % objections.length);
  };
  const prev = () => {
    setFlipped(false);
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
        <button
          type="button"
          onClick={() => setFlipped(!flipped)}
          className="w-full min-h-[120px] rounded-xl border-2 border-dashed border-violet-500/30 p-4 text-left transition-all hover:border-violet-500/50 hover:bg-violet-500/5"
        >
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {flipped ? "Suggested answer" : "Investor asks"}
          </p>
          <p className="text-sm font-medium leading-relaxed">
            {flipped ? obj.suggested_answer : obj.question}
          </p>
          <p className="text-[10px] text-muted-foreground mt-3">Tap to flip</p>
        </button>
        <div className="flex justify-between">
          <Button variant="outline" size="sm" onClick={prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFlipped(!flipped)}>
            Flip card
          </Button>
          <Button variant="outline" size="sm" onClick={next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
