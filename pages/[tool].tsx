export const dynamic = 'force-static';

import type { GetStaticPaths, GetStaticProps, NextPage, NextRouter } from 'next';
import ToolPageRenderer from '../src/components/ToolPageRenderer';
import { TOOL_PAGE_RENDERERS, getToolPageMeta } from '../src/constants/toolPages';
import type { LayoutProps } from '../src/components/Layout';

interface ToolPageProps {
  toolId: string;
}

const ToolPage: NextPage<ToolPageProps> & {
  getDynamicLayoutProps?: (context: { router: NextRouter; pageProps: LayoutProps & { toolId?: string } }) => LayoutProps | undefined;
} = ({ toolId }) => (
  <div className="bg-gray-50 py-8 px-4 min-h-screen">
    <div className="max-w-6xl mx-auto">
      <ToolPageRenderer toolId={toolId} />
    </div>
  </div>
);

ToolPage.getDynamicLayoutProps = ({ pageProps }) => {
  const toolId = typeof pageProps.toolId === 'string' ? pageProps.toolId : undefined;
  if (!toolId) return undefined;
  return getToolPageMeta(toolId)?.layoutProps;
};

export const getStaticPaths: GetStaticPaths<{ tool: string }> = () => ({
  paths: Object.keys(TOOL_PAGE_RENDERERS).map((toolId) => ({
    params: { tool: toolId },
  })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<ToolPageProps, { tool: string }> = async ({ params }) => {
  const rawTool = params?.tool;
  const toolId = Array.isArray(rawTool) ? rawTool[0] : rawTool;
  if (!toolId || !TOOL_PAGE_RENDERERS[toolId]) {
    return { notFound: true };
  }

  return {
    props: {
      toolId,
    },
  };
};

export default ToolPage;
