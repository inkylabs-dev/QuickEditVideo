'use client';

import { useCallback, useMemo, useState } from 'react';
import type { FC } from 'react';
import ResetDialog from './ResetDialog';
import ResizeMenuItem from './ResizeMenuItem';
import ResizeDialog from './ResizeDialog';
import OpenMenuItem from './OpenMenuItem';
import ResetMenuItem from './ResetMenuItem';
import SaveToMenuItem from './SaveToMenuItem';
import {
	Menubar as MenubarRoot,
	MenubarContent,
	MenubarGroup,
	MenubarMenu,
	MenubarTrigger,
} from '../ui/menubar';
import { RedoIcon, UndoIcon } from 'lucide-react';
import { useTracks } from './useTracks';

export interface MenubarProps {
	className?: string;
}

const EditorMenubar: FC<MenubarProps> = ({ className }) => {
	const [isResizeDialogOpen, setResizeDialogOpen] = useState(false);
	const [isResetDialogOpen, setResetDialogOpen] = useState(false);
	const { setTracks } = useTracks();

	const openResizeDialog = useCallback(() => {
		setResizeDialogOpen(true);
	}, []);

	const closeResizeDialog = useCallback(() => {
		setResizeDialogOpen(false);
	}, []);

	const openResetDialog = useCallback(() => {
		setResetDialogOpen(true);
	}, []);

	const closeResetDialog = useCallback(() => {
		setResetDialogOpen(false);
	}, []);

	const handleResetConfirm = useCallback(() => {
		setTracks([]);
	}, [setTracks]);

	const handleUndo = useCallback(() => {
		console.log('Undo clicked');
	}, []);

	const handleRedo = useCallback(() => {
		console.log('Redo clicked');
	}, []);

	const undoButton = useMemo(
		() => (
			<button
				type="button"
				onClick={handleUndo}
				className="p-2 text-gray-600 hover:bg-gray-100 rounded transition group relative"
				aria-label="Undo"
				title="Undo (⌘Z)"
			>
				<UndoIcon />
			</button>
		),
		[handleUndo],
	);

	const redoButton = useMemo(
		() => (
			<button
				type="button"
				onClick={handleRedo}
				className="p-2 text-gray-600 hover:bg-gray-100 rounded transition group relative"
				aria-label="Redo"
				title="Redo (⇧⌘Z)"
			>
				<RedoIcon />
			</button>
		),
		[handleRedo],
	);

	return (
		<div className={`flex items-center gap-2 ${className ?? ''}`}>
			<MenubarRoot loop>
				<MenubarMenu>
					<MenubarTrigger>File</MenubarTrigger>
					<MenubarContent>
						<MenubarGroup>
							<OpenMenuItem />
							<SaveToMenuItem />
              <ResizeMenuItem setResizeDialogOpen={openResizeDialog} />
							<ResetMenuItem onSelect={openResetDialog} />
						</MenubarGroup>
					</MenubarContent>
				</MenubarMenu>
			</MenubarRoot>

			<div className="h-5 w-px bg-slate-200" />
			{undoButton}
			{redoButton}
			<ResizeDialog isOpen={isResizeDialogOpen} onClose={closeResizeDialog} />
			<ResetDialog
				isOpen={isResetDialogOpen}
				onClose={closeResetDialog}
				onConfirm={handleResetConfirm}
			/>
		</div>
	);
};

export default EditorMenubar;
