'use client';

import type { FC } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

export interface ResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ResetDialog: FC<ResetDialogProps> = ({ isOpen, onClose, onConfirm }) => (
  <AlertDialog open={isOpen} onOpenChange={(value) => { if (!value) onClose(); }}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Reset timeline</AlertDialogTitle>
        <AlertDialogDescription>
          Clearing undo history and removing every track cannot be undone. Are you sure?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Yes, reset
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ResetDialog;
