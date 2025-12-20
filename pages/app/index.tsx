'use client';

import Head from 'next/head';
import Editor from '../../src/components/Editor';

const AppPage = () => (
  <>
    <Head>
      <title>QuickEditVideo Studio</title>
      <meta name="description" content="Lightweight in-browser editor powered by Remotion." />
    </Head>
    <Editor />
  </>
);

AppPage.layoutProps = { skipLayout: true };

export default AppPage;
