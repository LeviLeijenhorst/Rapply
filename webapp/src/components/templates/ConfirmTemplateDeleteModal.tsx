import React from "react";

import { ConfirmDeleteDialog } from "../../foundation/ui/modals/ConfirmDeleteDialog";

type Props = {
  visible: boolean;
  templateName?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

// Confirms permanent removal of a template while keeping the existing feature-specific copy.
export function ConfirmTemplateDeleteModal({
  visible,
  templateName,
  onClose,
  onConfirm,
}: Props) {
  if (!visible) return null;

  const description = templateName
    ? `Weet je zeker dat je ${templateName} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`
    : "Weet je zeker dat je deze template wilt verwijderen? Dit kan niet ongedaan worden gemaakt.";

  return (
    <ConfirmDeleteDialog
      visible={visible}
      title="Template verwijderen"
      description={description}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
