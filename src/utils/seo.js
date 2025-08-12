// SEO utility functions
export const setPageSEO = (title, description, keywords = '', image = '') => {
  // Update document title
  document.title = title || '5th Avenue Spanish Online';

  // Update meta description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    document.head.appendChild(metaDescription);
  }
  metaDescription.content =
    description ||
    "Premium perfumes and fragrances from the world's finest brands.";

  // Update meta keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.name = 'keywords';
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.content = keywords || 'perfumes, fragrances, luxury, colombia';

  // Update Open Graph tags
  updateOpenGraph(title, description, image);

  // Update Twitter Card tags
  updateTwitterCard(title, description, image);
};

const updateOpenGraph = (title, description, image) => {
  const ogTags = {
    'og:title': title,
    'og:description': description,
    'og:image': image,
    'og:type': 'website',
    'og:site_name': '5th Avenue Spanish Online',
  };

  Object.entries(ogTags).forEach(([property, content]) => {
    if (!content) return;

    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  });
};

const updateTwitterCard = (title, description, image) => {
  const twitterTags = {
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': image,
    'twitter:site': '@5thavenue_co',
  };

  Object.entries(twitterTags).forEach(([name, content]) => {
    if (!content) return;

    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  });
};

// Generate structured data for products
export const generateProductStructuredData = product => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'COP',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
};

// Generate structured data for organization
export const generateOrganizationStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '5th Avenue Spanish Online',
    url: 'https://5thavenue.com.co',
    logo: 'https://5thavenue.com.co/logo.png',
    description: 'Premium perfume store for the Colombian market',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CO',
      addressLocality: 'Bogotá',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+57-1-123-4567',
      contactType: 'customer service',
    },
  };
};

// Set canonical URL
export const setCanonicalUrl = url => {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
};

// Set JSON-LD structured data
export const setJsonLd = (id, data) => {
  if (typeof document === 'undefined') return;

  // Remove existing with same id
  const selector = `script[type="application/ld+json"][data-id="${id}"]`;
  const existing = document.head.querySelector(selector);
  if (existing) existing.remove();

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-id', id);
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
};
