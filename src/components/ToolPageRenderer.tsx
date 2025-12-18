'use client';

import { TOOL_PAGE_RENDERERS } from '../constants/toolPages';

export interface ToolPageRendererProps {
  toolId: string;
}

const ToolPageRenderer = ({ toolId }: ToolPageRendererProps) => {
  const Renderer = TOOL_PAGE_RENDERERS[toolId];
  if (!Renderer) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
        This tool is under construction.
      </div>
    );
  }

  return <Renderer />;
};

export default ToolPageRenderer;
