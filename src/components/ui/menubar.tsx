'use client';

import * as React from 'react';
import * as MenubarPrimitive from '@radix-ui/react-menubar';
import { cn } from '../../lib/utils';

const Menubar = MenubarPrimitive.Root;
const MenubarMenu = MenubarPrimitive.Menu;

const MenubarTrigger = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
	<MenubarPrimitive.Trigger
		ref={ref}
		className={cn(
			'inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-slate-50',
			className,
		)}
		{...props}
	/>
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

const MenubarContent = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = 'start', ...props }, ref) => (
	<MenubarPrimitive.Portal>
		<MenubarPrimitive.Content
			ref={ref}
			align={align}
			sideOffset={8}
			className={cn(
				'relative z-50 min-w-[220px] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-700 shadow-lg animate-in fade-in-80',
				className,
			)}
			{...props}
		/>
	</MenubarPrimitive.Portal>
));
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

const MenubarItem = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
		inset?: boolean;
		shortcut?: string;
	}
>(({ className, inset, shortcut, ...props }, ref) => (
	<MenubarPrimitive.Item
		ref={ref}
		className={cn(
			'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm font-medium outline-none transition-colors focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			inset ? 'pl-8' : 'px-2',
			className,
		)}
		{...props}
	>
		{props.children}
		{shortcut && <span className="ml-auto text-xs font-medium text-slate-500">{shortcut}</span>}
	</MenubarPrimitive.Item>
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

const MenubarSeparator = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<MenubarPrimitive.Separator
		ref={ref}
		className={cn('my-1 h-px bg-slate-100', className)}
		{...props}
	/>
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

const MenubarGroup = MenubarPrimitive.Group;

const MenubarLabel = React.forwardRef<
	React.ElementRef<typeof MenubarPrimitive.Label>,
	React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label>
>(({ className, ...props }, ref) => (
	<MenubarPrimitive.Label
		ref={ref}
		className={cn('px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500', className)}
		{...props}
	/>
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

const MenubarShortcut = ({
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
	<span className={cn('ml-auto text-xs font-medium text-slate-500', className)} {...props} />
);
MenubarShortcut.displayName = 'MenubarShortcut';

export {
	Menubar,
	MenubarMenu,
	MenubarTrigger,
	MenubarContent,
	MenubarItem,
	MenubarSeparator,
	MenubarGroup,
	MenubarLabel,
	MenubarShortcut,
};
