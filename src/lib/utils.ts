export type ClassValue = string | number | boolean | undefined | null | ClassValue[];

export const cn = (...classes: ClassValue[]): string =>
	classes
		.flat(Infinity)
		.filter(Boolean)
		.join(' ');
