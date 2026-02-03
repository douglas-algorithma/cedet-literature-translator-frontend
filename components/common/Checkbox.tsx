import { cn } from "@/lib/utils";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
};

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-text">
      <input
        type="checkbox"
        className={cn("h-4 w-4 rounded border-border accent-brand")}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
