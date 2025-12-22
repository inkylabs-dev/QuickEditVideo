'use client';

import { useState } from 'react';
import SidebarCategories, { type CategoryType } from './SidebarCategories';
import SidebarMain from './SidebarMain';

const Sidebar = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('text');

  return (
    <div className="flex h-full">
      <SidebarCategories
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <SidebarMain category={selectedCategory} />
    </div>
  );
};

export default Sidebar;
