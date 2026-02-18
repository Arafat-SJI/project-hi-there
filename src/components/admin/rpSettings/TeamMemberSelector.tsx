/**
 * TeamMemberSelector - Reusable employee picker with Popover + Command
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, X, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmployees } from "@/hooks/useEmployees";

interface TeamMemberSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  excludeIds?: string[]; // IDs to hide from list
  mode?: "multi" | "add"; // multi = toggle, add = one-shot
}

export function TeamMemberSelector({
  selectedIds,
  onChange,
  disabled = false,
  excludeIds = [],
  mode = "multi",
}: TeamMemberSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: employees = [], isLoading } = useEmployees();

  // Filter employees: exclude already selected (in add mode) and excluded IDs
  const availableEmployees = employees.filter(
    (emp) =>
      !excludeIds.includes(emp.id) &&
      (mode === "add" ? !selectedIds.includes(emp.id) : true) &&
      (search.trim() === "" ||
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase()) ||
        (emp.department || "").toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 50); // Max 50 results

  const selectedEmployees = employees.filter((emp) => selectedIds.includes(emp.id));

  const handleToggle = (employeeId: string) => {
    if (selectedIds.includes(employeeId)) {
      onChange(selectedIds.filter((id) => id !== employeeId));
    } else {
      onChange([...selectedIds, employeeId]);
    }
    if (mode === "add") {
      setOpen(false);
      setSearch("");
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-start"
          >
            <Users className="h-4 w-4 mr-2" />
            {selectedIds.length > 0
              ? `${selectedIds.length} member${selectedIds.length !== 1 ? "s" : ""} selected`
              : "Select members..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search by name, email, or department..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  "No employees found"
                )}
              </CommandEmpty>
              <CommandGroup>
                {availableEmployees.map((emp) => {
                  const isSelected = selectedIds.includes(emp.id);
                  return (
                    <CommandItem
                      key={emp.id}
                      value={emp.id}
                      onSelect={() => handleToggle(emp.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "border-input"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{emp.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                          {(emp.department || emp.title) && (
                            <p className="text-xs text-muted-foreground">
                              {[emp.department, emp.title].filter(Boolean).join(" • ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected members chips (only in multi mode) */}
      {mode === "multi" && selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedEmployees.map((emp) => (
            <Badge
              key={emp.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="truncate max-w-[150px]">{emp.name}</span>
              <button
                type="button"
                onClick={() => handleToggle(emp.id)}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

