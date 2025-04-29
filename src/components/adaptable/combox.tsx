"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";

type Option<V extends string> = {
  label: string;
  value: V;
};

interface ComboboxProps<V extends string> {
  triggerProps?: React.ComponentProps<typeof Button>;
  value: V;
  options: Option<V>[];
  onChange: (opt: Option<V>) => void;
  align?: React.ComponentProps<typeof PopoverContent>["align"];
}

export function Combobox<V extends string>({
  options,
  value,
  triggerProps,
  onChange,
  align,
}: ComboboxProps<V>) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          {...triggerProps}
          className={cn(
            "w-[200px] justify-between text-white",
            triggerProps?.className,
          )}
          role="combobox"
          aria-expanded={open}
        >
          {value
            ? options.find((framework) => framework.value === value)?.label
            : "Select language..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align={align}>
        <Command>
          <CommandInput placeholder="Search framework..." className="h-9" />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(
                      options.find(({ value }) => value === currentValue)!,
                    );
                    setOpen(false);
                  }}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
