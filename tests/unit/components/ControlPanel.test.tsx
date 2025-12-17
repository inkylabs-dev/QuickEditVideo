import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ControlPanel, { type Tab } from '../../../src/components/ControlPanel';

describe('ControlPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('renders with title only', () => {
      render(<ControlPanel title="Test Panel" />);
      
      expect(screen.getByText('Test Panel')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Panel');
    });

    it('applies custom className', () => {
      render(<ControlPanel title="Test Panel" className="custom-class" />);
      
      const panel = screen.getByText('Test Panel').closest('.custom-class');
      expect(panel).toBeInTheDocument();
    });

    it('renders children content when no tabs provided', () => {
      render(
        <ControlPanel title="Test Panel">
          <div>Test Content</div>
        </ControlPanel>
      );
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Reset Functionality', () => {
    it('renders reset button when onReset provided', () => {
      const onReset = vi.fn();
      render(<ControlPanel title="Test Panel" onReset={onReset} />);
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toBeInTheDocument();
      expect(resetButton).toHaveAttribute('title', 'Reset to default');
    });

    it('calls onReset when reset button clicked', () => {
      const onReset = vi.fn();
      render(<ControlPanel title="Test Panel" onReset={onReset} />);
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);
      
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('uses custom reset title when provided', () => {
      const onReset = vi.fn();
      render(
        <ControlPanel 
          title="Test Panel" 
          onReset={onReset} 
          resetTitle="Custom Reset Title"
        />
      );
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toHaveAttribute('title', 'Custom Reset Title');
    });

    it('does not render reset button when onReset not provided', () => {
      render(<ControlPanel title="Test Panel" />);
      
      expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('renders close button when onClose provided', () => {
      const onClose = vi.fn();
      render(<ControlPanel title="Test Panel" onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('title', 'Close');
    });

    it('calls onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<ControlPanel title="Test Panel" onClose={onClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('uses custom close title when provided', () => {
      const onClose = vi.fn();
      render(
        <ControlPanel 
          title="Test Panel" 
          onClose={onClose} 
          closeTitle="Custom Close Title"
        />
      );
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('title', 'Custom Close Title');
    });

    it('does not render close button when onClose not provided', () => {
      render(<ControlPanel title="Test Panel" />);
      
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    });
  });

  describe('Both Reset and Close', () => {
    it('renders both buttons when both callbacks provided', () => {
      const onReset = vi.fn();
      const onClose = vi.fn();
      render(<ControlPanel title="Test Panel" onReset={onReset} onClose={onClose} />);
      
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('calls respective functions when buttons clicked', () => {
      const onReset = vi.fn();
      const onClose = vi.fn();
      render(<ControlPanel title="Test Panel" onReset={onReset} onClose={onClose} />);
      
      fireEvent.click(screen.getByRole('button', { name: /reset/i }));
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tab Functionality', () => {
    const mockTabs: Tab[] = [
      { 
        id: 'tab1', 
        label: 'Tab 1', 
        content: <div>Tab 1 Content</div> 
      },
      { 
        id: 'tab2', 
        label: 'Tab 2', 
        content: <div>Tab 2 Content</div>,
        badge: '5'
      },
      { 
        id: 'tab3', 
        label: 'Tab 3', 
        content: <div>Tab 3 Content</div>,
        badge: 10
      }
    ];

    it('renders tab buttons when tabs provided', () => {
      const onTabChange = vi.fn();
      render(
        <ControlPanel 
          title="Test Panel" 
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={onTabChange}
        />
      );
      
      expect(screen.getByRole('button', { name: /tab 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tab 2.*5/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tab 3.*10/i })).toBeInTheDocument();
    });

    it('applies active styles to active tab', () => {
      const onTabChange = vi.fn();
      render(
        <ControlPanel 
          title="Test Panel" 
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={onTabChange}
        />
      );
      
      const activeTab = screen.getByRole('button', { name: /tab 1/i });
      const inactiveTab = screen.getByRole('button', { name: /tab 2.*5/i });
      
      expect(activeTab).toHaveClass('border-teal-500', 'text-teal-600', 'bg-teal-50');
      expect(inactiveTab).toHaveClass('border-transparent', 'text-gray-500');
    });

    it('calls onTabChange when tab clicked', () => {
      const onTabChange = vi.fn();
      render(
        <ControlPanel 
          title="Test Panel" 
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={onTabChange}
        />
      );
      
      fireEvent.click(screen.getByRole('button', { name: /tab 2.*5/i }));
      
      expect(onTabChange).toHaveBeenCalledWith('tab2');
    });

    it('renders active tab content', () => {
      const onTabChange = vi.fn();
      render(
        <ControlPanel 
          title="Test Panel" 
          tabs={mockTabs}
          activeTab="tab2"
          onTabChange={onTabChange}
        />
      );
      
      expect(screen.getByText('Tab 2 Content')).toBeInTheDocument();
      expect(screen.queryByText('Tab 1 Content')).not.toBeInTheDocument();
      expect(screen.queryByText('Tab 3 Content')).not.toBeInTheDocument();
    });

    it('renders children when no active tab matches', () => {
      const onTabChange = vi.fn();
      render(
        <ControlPanel 
          title="Test Panel" 
          tabs={mockTabs}
          activeTab="nonexistent"
          onTabChange={onTabChange}
        >
          <div>Fallback Content</div>
        </ControlPanel>
      );
      
      expect(screen.getByText('Fallback Content')).toBeInTheDocument();
      expect(screen.queryByText('Tab 1 Content')).not.toBeInTheDocument();
    });

    it('displays badges correctly', () => {
      const onTabChange = vi.fn();
      render(
        <ControlPanel 
          title="Test Panel" 
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={onTabChange}
        />
      );
      
      expect(screen.getByText('(5)')).toBeInTheDocument();
      expect(screen.getByText('(10)')).toBeInTheDocument();
    });

    it('does not render tabs when tabs array is empty', () => {
      const onTabChange = vi.fn();
      render(
        <ControlPanel 
          title="Test Panel" 
          tabs={[]}
          activeTab="tab1"
          onTabChange={onTabChange}
        >
          <div>Content</div>
        </ControlPanel>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /tab/i })).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('adds border to header when tabs are present', () => {
      const onTabChange = vi.fn();
      const mockTabs: Tab[] = [
        { id: 'tab1', label: 'Tab 1', content: <div>Content</div> }
      ];
      
      render(
        <ControlPanel 
          title="Test Panel" 
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={onTabChange}
        />
      );
      
      const header = screen.getByText('Test Panel').closest('div');
      expect(header).toHaveClass('border-b');
    });

    it('does not add border to header when no tabs present', () => {
      render(<ControlPanel title="Test Panel" />);
      
      const header = screen.getByText('Test Panel').closest('div');
      expect(header).not.toHaveClass('border-b');
    });

    it('applies correct container styles', () => {
      render(<ControlPanel title="Test Panel" />);
      
      const container = screen.getByText('Test Panel').closest('div').parentElement;
      expect(container).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm', 'border', 'border-gray-200', 'h-full');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<ControlPanel title="Test Panel" />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Test Panel');
    });

    it('has proper button roles and titles', () => {
      const onReset = vi.fn();
      const onClose = vi.fn();
      render(<ControlPanel title="Test Panel" onReset={onReset} onClose={onClose} />);
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      const closeButton = screen.getByRole('button', { name: /close/i });
      
      expect(resetButton).toHaveAttribute('title');
      expect(closeButton).toHaveAttribute('title');
    });

    it('provides accessible tab navigation', () => {
      const onTabChange = vi.fn();
      const mockTabs: Tab[] = [
        { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
        { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> }
      ];
      
      render(
        <ControlPanel 
          title="Test Panel" 
          tabs={mockTabs}
          activeTab="tab1"
          onTabChange={onTabChange}
        />
      );
      
      const tab1 = screen.getByRole('button', { name: /tab 1/i });
      const tab2 = screen.getByRole('button', { name: /tab 2/i });
      
      expect(tab1).toBeInTheDocument();
      expect(tab2).toBeInTheDocument();
    });
  });
});
