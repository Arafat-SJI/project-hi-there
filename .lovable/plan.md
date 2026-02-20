

# Fix: "now is not defined" in Team Learning Patterns

## Problem
The `buildTeamLearningData` function in `src/hooks/useTeamLearningPatterns.ts` references a variable `now` that doesn't exist in its scope. It's only defined inside the separate `fetchAgentMemoriesForPatterns` function.

## Fix
Add `const now = new Date();` at the top of `buildTeamLearningData`, right before the line that uses it to calculate `staleCutoff`.

## File Changed
- `src/hooks/useTeamLearningPatterns.ts` -- add one line: `const now = new Date();` before the `staleCutoff` declaration inside `buildTeamLearningData`.

