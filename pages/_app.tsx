'use client';

import type { AppProps } from 'next/app';
import { useRouter, type NextRouter } from 'next/router';
import Layout, { type LayoutProps } from '../src/components/Layout';
import '../styles/globals.css';

type LayoutAwarePageProps = {
  layoutProps?: LayoutProps;
};

type LayoutContext = {
  router: NextRouter;
  pageProps: LayoutAwarePageProps;
};

type LayoutAwareComponent = AppProps['Component'] & {
  layoutProps?: LayoutProps;
  getDynamicLayoutProps?: (context: LayoutContext) => LayoutProps | undefined;
};

const MyApp = ({ Component, pageProps }: AppProps<LayoutAwarePageProps>) => {
  const router = useRouter();
  const ComponentWithLayout = Component as LayoutAwareComponent;
  const dynamicLayoutProps = ComponentWithLayout.getDynamicLayoutProps?.({
    router,
    pageProps,
  });

  const layoutProps = dynamicLayoutProps ?? pageProps.layoutProps ?? ComponentWithLayout.layoutProps;

  return (
    <Layout {...layoutProps}>
      <Component {...pageProps} />
    </Layout>
  );
};

export default MyApp;
