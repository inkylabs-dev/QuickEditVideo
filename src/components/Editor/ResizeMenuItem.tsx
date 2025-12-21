'use client';

import type { FC } from 'react';
import { MenubarItem } from '../ui/menubar';
import { ScalingIcon } from 'lucide-react';

export interface ResizeMenuItemProps {
	setResizeDialogOpen: () => void;
}

const ResizeMenuItem: FC<ResizeMenuItemProps> = ({ setResizeDialogOpen }) => (
	<MenubarItem inset onSelect={setResizeDialogOpen}>
		<ScalingIcon className="mr-2 h-4 w-4 text-slate-500" />
		Resize...
	</MenubarItem>
);

export default ResizeMenuItem;
