import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange } as any);
        }
        return child;
      })}
    </div>
  )
);
Tabs.displayName = "Tabs";

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("border-b border-gray-200", className)}
      {...props}
    >
      <div className="flex">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { value, onValueChange } as any);
          }
          return child;
        })}
      </div>
    </div>
  )
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  tabValue: string;
  children: React.ReactNode;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, onValueChange, tabValue, children, ...props }, ref) => {
    const isActive = value === tabValue;
    
    return (
      <button
        ref={ref}
        className={cn(
          "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
          isActive 
            ? "border-teal-500 text-teal-600 bg-teal-50" 
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
          className
        )}
        onClick={() => onValueChange?.(tabValue)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  tabValue: string;
  children: React.ReactNode;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, tabValue, children, ...props }, ref) => {
    if (value !== tabValue) return null;
    
    return (
      <div
        ref={ref}
        className={cn("p-4 h-full overflow-y-auto", className)}
        style={{ maxHeight: 'calc(100vh - 200px)' }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent }