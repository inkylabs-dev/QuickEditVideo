'use client';

import type { FC } from 'react';
import { MenubarItem } from '../ui/menubar';

export interface ResizeMenuItemProps {
	setResizeDialogOpen: () => void;
}

const ResizeMenuItem: FC<ResizeMenuItemProps> = ({ setResizeDialogOpen }) => (
	<MenubarItem inset onSelect={setResizeDialogOpen}>
		Resize
	</MenubarItem>
);

export default ResizeMenuItem;
