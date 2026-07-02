import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2 } from "lucide-react";
import { PITCH_AUDIENCES, PITCH_INDUSTRIES, PITCH_TYPES } from "../constants";
import type { LaunchLabContext } from "../types";

interface PitchContextPanelProps {
  context: LaunchLabContext;
  onChange: (patch: Partial<LaunchLabContext>) => void;
}

export function PitchContextPanel({ context, onChange }: PitchContextPanelProps) {
  return (
    <Card className="border-dashed border-primary/25 bg-muted/30">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          Idea context
          <span className="text-xs font-normal text-muted-foreground">— AI tailors feedback to your goal</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 px-4 pb-4 pt-0">
        <div className="space-y-1.5">
          <Label className="text-xs">Product name</Label>
          <Input
            placeholder="e.g. FlowStack"
            value={context.productName}
            onChange={(e) => onChange({ productName: e.target.value })}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Content type</Label>
          <Select value={context.pitchType} onValueChange={(v) => onChange({ pitchType: v as LaunchLabContext["pitchType"] })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PITCH_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label} — {t.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Audience</Label>
          <Select value={context.audience} onValueChange={(v) => onChange({ audience: v as LaunchLabContext["audience"] })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PITCH_AUDIENCES.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Industry</Label>
          <Select value={context.industry} onValueChange={(v) => onChange({ industry: v as LaunchLabContext["industry"] })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PITCH_INDUSTRIES.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
