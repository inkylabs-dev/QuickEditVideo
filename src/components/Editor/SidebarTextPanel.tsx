'use client';

import { Button } from '@/components/ui/button';

const SidebarTextPanel = () => {
  const handleAddHeading = () => {
    console.log('Add heading');
    // TODO: Implement add heading functionality
  };

  const handleAddSubheading = () => {
    console.log('Add subheading');
    // TODO: Implement add subheading functionality
  };

  const handleAddBodyText = () => {
    console.log('Add body text');
    // TODO: Implement add body text functionality
  };

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Text</h2>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleAddHeading}
        >
          Add a heading
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleAddSubheading}
        >
          Add a subheading
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleAddBodyText}
        >
          Add a body text
        </Button>
      </div>
    </div>
  );
};

export default SidebarTextPanel;
