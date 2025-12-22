'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Type, Image, Video, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CategoryType = 'uploads' | 'text' | 'image' | 'video' | 'audio';

interface Category {
  id: CategoryType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: Category[] = [
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'audio', label: 'Audio', icon: Music },
];

interface SidebarCategoriesProps {
  selectedCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
}

const SidebarCategories = ({ selectedCategory, onCategoryChange }: SidebarCategoriesProps) => {
  return (
    <ScrollArea className="h-full w-16 bg-gray-50 border-r border-gray-200">
      <div className="flex flex-col items-center py-4 space-y-2">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                'flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors',
                'hover:bg-gray-200',
                isSelected ? 'bg-gray-200 text-gray-900' : 'text-gray-600'
              )}
              title={category.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default SidebarCategories;
