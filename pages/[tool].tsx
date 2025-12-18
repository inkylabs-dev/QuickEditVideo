'use client';

import { type NextPage } from 'next';
import { useRouter, type NextRouter } from 'next/router';
import ToolPageRenderer from '../src/components/ToolPageRenderer';
import { getToolPageMeta } from '../src/constants/toolPages';
import type { LayoutProps } from '../src/components/Layout';

const ToolPage: NextPage & {
  getDynamicLayoutProps?: (context: { router: NextRouter }) => LayoutProps | undefined;
} = () => {
  const router = useRouter();
  const rawTool = router.query.tool;
  const toolId = Array.isArray(rawTool) ? rawTool[0] : rawTool;

  if (!toolId) {
    return (
      <div className="bg-gray-50 min-h-screen py-16 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-500">Loading tool…</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 px-4 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <ToolPageRenderer toolId={toolId} />
      </div>
    </div>
  );
};

ToolPage.getDynamicLayoutProps = ({ router }) => {
  const rawTool = router.query.tool;
  const toolId = Array.isArray(rawTool) ? rawTool[0] : rawTool;

  if (!toolId) return undefined;
  return getToolPageMeta(toolId)?.layoutProps;
};

export default ToolPage;
