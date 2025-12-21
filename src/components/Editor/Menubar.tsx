'use client';

import { useCallback, useMemo } from 'react';
import type { FC } from 'react';
import ResizeMenuItem from './ResizeMenuItem';
import {
	Menubar as MenubarRoot,
	MenubarContent,
	MenubarGroup,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarTrigger,
} from '../ui/menubar';
import { RedoIcon, UndoIcon } from "lucide-react"

export interface MenubarProps {
	className?: string;
}

const EditorMenubar: FC<MenubarProps> = ({ className }) => {
	const handleSave = useCallback(() => {
		console.log('Save clicked');
	}, []);

	const handleReportIssue = useCallback(() => {
		window.open('https://github.com/inkylabs-dev/quickeditvideo/issues', '_blank');
	}, []);

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
							<ResizeMenuItem />
							<MenubarSeparator />
							<MenubarItem onSelect={handleSave} shortcut="⌘S">
								Save
							</MenubarItem>
							<MenubarItem onSelect={handleReportIssue}>Report Issue</MenubarItem>
						</MenubarGroup>
					</MenubarContent>
				</MenubarMenu>
			</MenubarRoot>

			<div className="h-5 w-px bg-slate-200" />
			{undoButton}
			{redoButton}
		</div>
	);
};

export default EditorMenubar;
