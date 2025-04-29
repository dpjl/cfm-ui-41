import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  count?: number; // Ajout d'une prop optionnelle count pour compatibilité
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onOpenChange,
  selectedIds,
  onConfirm,
  onCancel,
  isPending,
  count
}) => {
  const { t } = useLanguage();
  // Utiliser count si fourni, sinon utiliser la longueur de selectedIds
  const itemCount = count !== undefined ? count : selectedIds.length;
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('delete_confirmation_title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_confirmation_message')}
            {itemCount > 0 && ` (${itemCount} items)`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isPending}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? t('deleting') : t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
