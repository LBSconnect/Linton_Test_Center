import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  schema?: object;
}

const BASE_URL = 'https://www.lbs4.com';
const DEFAULT_IMAGE = `${BASE_URL}/images/hero-testing-center.png`;
const SITE_SUFFIX = 'LBS Test & Exam Center';

export default function SEO({ title, description, canonical, ogImage, noIndex, schema }: SEOProps) {
  const fullTitle = title
    ? `${title} | ${SITE_SUFFIX}`
    : `${SITE_SUFFIX} Houston TX | Pearson VUE | Real Estate & Insurance Exams`;
  const canonicalUrl = `${BASE_URL}${canonical ?? '/'}`;
  const image = ogImage ?? DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />

      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
