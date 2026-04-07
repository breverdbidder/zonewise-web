import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const unusedEvalVar = "summit-275-autofix-eval-intentional-break";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
