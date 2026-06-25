/**
 * Dynamic SEO Utility
 * Custom-crafted for সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা
 * Implements strict title formatting, meta descriptions, Open Graph, Twitter Cards, and dynamic JSON-LD schemas.
 */

export interface SEOOptions {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'book' | 'event' | 'profile';
  url?: string;
  schema?: any;
}

export function updateSEOMetadata(options: SEOOptions) {
  if (typeof window === 'undefined') return;

  // 1. Update Document Title (Strictly no "Google AI Studio" or other irrelevant text)
  document.title = options.title;

  const setMetaTag = (name: string, isProperty: boolean, value: string) => {
    const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      if (isProperty) {
        element.setAttribute('property', name);
      } else {
        element.setAttribute('name', name);
      }
      document.head.appendChild(element);
    }
    element.setAttribute('content', value);
  };

  // Set or update canonical URL
  const currentUrl = options.url || window.location.href;
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', currentUrl);

  // 2. Set description
  setMetaTag('description', false, options.description);

  // 3. Set Open Graph (Facebook, WhatsApp, LinkedIn, etc.)
  setMetaTag('og:title', true, options.title);
  setMetaTag('og:description', true, options.description);
  setMetaTag('og:type', true, options.type || 'website');
  setMetaTag('og:url', true, currentUrl);

  const defaultImage = 'https://i.ibb.co.com/F4MKM3R2/20260527-055637.png';
  setMetaTag('og:image', true, options.image || defaultImage);

  // 4. Set Twitter Card Meta Tags
  setMetaTag('twitter:card', false, 'summary_large_image');
  setMetaTag('twitter:title', false, options.title);
  setMetaTag('twitter:description', false, options.description);
  setMetaTag('twitter:image', false, options.image || defaultImage);

  // 5. Inject/Update JSON-LD structured data script
  let schemaScript = document.getElementById('seo-jsonld') as HTMLScriptElement;
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'seo-jsonld';
    schemaScript.type = 'application/ld+json';
    document.head.appendChild(schemaScript);
  }

  if (options.schema) {
    schemaScript.textContent = JSON.stringify(options.schema);
  } else {
    // Default Organization / WebPage Schema
    const defaultSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "সমাজতান্ত্রিক ছাত্র ফ্রন্ট, ময়মনসিংহ জেলা শাখা",
      "alternateName": "Socialist Students' Front, Mymensingh",
      "url": window.location.origin,
      "logo": defaultImage,
      "description": options.description,
      "sameAs": [
        "https://www.facebook.com/sf.mymensingh"
      ]
    };
    schemaScript.textContent = JSON.stringify(defaultSchema);
  }
}
