import { render, screen } from '@testing-library/react';
import ToolPageRenderer from '../../src/components/ToolPageRenderer';

describe('ToolPageRenderer', () => {
  it('shows fallback text when the tool is unknown', () => {
    render(<ToolPageRenderer toolId="does-not-exist" />);
    expect(screen.getByText(/This tool is under construction./i)).toBeInTheDocument();
  });
});
