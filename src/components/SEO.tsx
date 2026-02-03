import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import { brand } from "@/config/brand";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
}

export function SEO({ 
  title = brand.seo.defaultTitle,
  description = brand.seo.defaultDescription,
  image = brand.seo.defaultImage,
  type = "website"
}: SEOProps) {
  const location = useLocation();
  const url = `https://predifi.com${location.pathname}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Predifi",
    "description": description,
    "url": url,
    "applicationCategory": "FinanceApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  // Farcaster Frame configuration
  const frameImage = image;
  const framePostUrl = `${url}/api/frame`;
  const frameButtons = [
    { label: "View Markets", action: "post" },
    { label: "Join Predifi", action: "link", target: url }
  ];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Farcaster Frame */}
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content={frameImage} />
      <meta property="fc:frame:post_url" content={framePostUrl} />
      <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
      <meta property="fc:frame:button:1" content="View Markets" />
      <meta property="fc:frame:button:1:action" content="post" />
      <meta property="fc:frame:button:2" content="Join Predifi" />
      <meta property="fc:frame:button:2:action" content="link" />
      <meta property="fc:frame:button:2:target" content={url} />
      
      {/* Telegram Mini App */}
      <meta name="telegram-web-app" content="true" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
