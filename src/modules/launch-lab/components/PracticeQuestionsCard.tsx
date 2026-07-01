import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PracticeQuestionsCardProps {
  questions: string[];
}

export function PracticeQuestionsCard({ questions }: PracticeQuestionsCardProps) {
  if (!questions?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          Practice Q&A
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2 list-decimal list-inside">
          {questions.map((q, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              {q}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
