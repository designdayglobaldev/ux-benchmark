import { useState } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface TaxonomyOption {
  id: string;
  title: string;
}

export interface TaxonomyComboboxProps {
  options: TaxonomyOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
}

export function TaxonomyCombobox({ 
  options, 
  value, 
  onChange, 
  placeholder,
  className
}: TaxonomyComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[240px] justify-between bg-[#141414] border-[#333] text-white hover:bg-[#222] hover:text-white",
            className
          )}
        >
          <span className="truncate pr-2 text-left">
            {value
              ? options.find((opt) => opt.id === value)?.title
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0 border-[#333] bg-[#141414] text-white">
        <Command className="bg-transparent text-white">
          <CommandInput placeholder="Search..." className="text-white border-b border-[#333]" />
          <CommandList>
            <CommandEmpty>No match found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.title}
                  onSelect={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className="text-white hover:bg-[#222] cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.id ? "opacity-100 text-[#4E6BFF]" : "opacity-0"
                    )}
                  />
                  {opt.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
