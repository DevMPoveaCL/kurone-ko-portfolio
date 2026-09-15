import { Button } from "@/shared/ui/Button";

export interface HiddenChamberTriggerProps {
  disabled?: boolean;
  environmentalHint: string;
  label: string;
  onTrigger?: () => void;
}

export function HiddenChamberTrigger({
  disabled = false,
  environmentalHint,
  label,
  onTrigger,
}: HiddenChamberTriggerProps) {
  const handleTrigger = () => {
    if (disabled) {
      return;
    }

    onTrigger?.();
  };

  return (
    <div className="hidden-chamber-trigger">
      <p>{environmentalHint}</p>
      <Button aria-disabled={disabled} onClick={handleTrigger} type="button" variant="ghost">
        {label}
      </Button>
    </div>
  );
}
