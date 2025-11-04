import { Helmet } from 'react-helmet-async';

interface HeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

const Head = ({
  title = 'Shepard Signals - AI-Powered Crypto Trading Signals',
  description = 'Get accurate crypto trading signals powered by advanced AI algorithms. Maximize your profits with real-time market analysis and trading recommendations.',
  keywords = 'crypto trading, AI signals, cryptocurrency, trading bot, market analysis, Bitcoin, Ethereum, trading signals',
  ogImage = '/og-image.png'
}: HeadProps) => {
  const siteUrl = 'https://signals.shepard.com'; // Update with your actual domain

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={siteUrl} />
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