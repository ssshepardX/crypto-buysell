import { Helmet } from 'react-helmet-async';

interface HeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  path?: string;
}

const Head = ({
  title = 'Shepard AI - Crypto Movement Intelligence',
  description = 'Crypto movement intelligence for understanding likely causes, whale traces, liquidity risk, and news or social catalysts behind sudden market moves.',
  keywords = 'crypto movement intelligence, market anomaly analysis, whale tracking, liquidity risk, crypto news catalysts, social sentiment',
  ogImage = '/og-image.png',
  path = '/'
}: HeadProps) => {
  const siteUrl = 'https://shepardai.pro';
  const canonicalUrl = `${siteUrl}${path === '/' ? '' : path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`${siteUrl}${ogImage}`} />

      {/* PWA primary color */}
      <meta name="theme-color" content="#000000" />
      
      {/* Favicon */}
      <link rel="icon" type="image/png" href="/logo.png" />
      
      {/* Mobile viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    </Helmet>
  );
};

export default Head;
