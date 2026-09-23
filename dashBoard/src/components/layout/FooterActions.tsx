import { Button } from "antd";
import { cn } from "@/lib/utils";

type FooterActionsProps = {
  onSave?: () => void;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
  isSaving?: boolean;
  isDisabled?: boolean;
  className?: string;
};

export function FooterActions({
  onSave,
  onCancel,
  saveText = "Save",
  cancelText = "Cancel",
  isSaving = false,
  isDisabled = false,
  className,
}: FooterActionsProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-background px-6 py-4",
        className,
      )}
    >
      {onCancel && (
        <Button onClick={onCancel} disabled={isSaving}>
          {cancelText}
        </Button>
      )}
      {onSave && (
        <Button
          type="primary"
          onClick={onSave}
          loading={isSaving}
          disabled={isDisabled}
        >
          {saveText}
        </Button>
      )}
    </div>
  );
}
