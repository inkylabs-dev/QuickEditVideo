import type { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  badge?: string | number;
}

export interface ControlPanelProps {
  title: string;
  onReset?: () => void;
  onClose?: () => void;
  resetTitle?: string;
  closeTitle?: string;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children?: ReactNode;
  className?: string;
}

const ControlPanel = ({
  title,
  onReset,
  onClose,
  resetTitle = "Reset to default",
  closeTitle = "Close",
  tabs,
  activeTab,
  onTabChange,
  children,
  className = ""
}: ControlPanelProps) => {
  const hasActions = onReset || onClose;
  const hasTabs = tabs && tabs.length > 0;

  const renderTabContent = () => {
    if (!hasTabs || !activeTab) return children;
    
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab?.content || children;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 h-full ${className}`}>
      {/* Header with title and actions */}
      <div className={`flex items-center justify-between p-4 ${hasTabs ? 'border-b border-gray-200' : ''}`}>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {hasActions && (
          <div className="flex items-center gap-2">
            {onReset && (
              <button 
                onClick={onReset}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                title={resetTitle}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                </svg>
                Reset
              </button>
            )}
            {onClose && (
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                title={closeTitle}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Header */}
      {hasTabs && (
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-teal-500 text-teal-600 bg-teal-50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="ml-1">({tab.badge})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 h-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ControlPanel;
