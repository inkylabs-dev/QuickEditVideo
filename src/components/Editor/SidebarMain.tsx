'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import type { CategoryType } from './SidebarCategories';
import SidebarTextPanel from './SidebarTextPanel';

interface SidebarMainProps {
  category: CategoryType;
}

const SidebarMain = ({ category }: SidebarMainProps) => {
  const renderContent = () => {
    switch (category) {
      case 'text':
        return <SidebarTextPanel />;
      case 'uploads':
      case 'image':
      case 'video':
      case 'audio':
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">Coming Soon...</p>
          </div>
        );
    }
  };

  return (
    <ScrollArea className="flex-1 h-full bg-white">
      {renderContent()}
    </ScrollArea>
  );
};

export default SidebarMain;
