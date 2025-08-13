"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function Checkbox({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
  id,
  ...props
}: CheckboxProps) {
  const handleChange = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <div
      id={id}
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "peer inline-flex h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked && "bg-primary text-primary-foreground",
        !checked && "bg-background",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && "cursor-pointer",
        className
      )}
      onClick={handleChange}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleChange();
        }
      }}
      {...props}
    >
      {checked && (
        <div className="flex items-center justify-center text-current">
          <CheckIcon className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

export { Checkbox };