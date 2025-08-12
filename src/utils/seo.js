// Lightweight SEO helpers for CRA

const MANAGED_ATTR = 'data-managed-seo';

function ensureTag(selector, createFn) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = createFn();
    document.head.appendChild(el);
  }
  return el;
}

export function setPageSEO({ title, description, canonicalPath, robots }) {
  if (typeof document === 'undefined') return;
  if (title) document.title = title;

  // Description
  if (description) {
    const metaDesc = ensureTag(
      `meta[name="description"][${MANAGED_ATTR}="1"]`,
      () => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'description');
        m.setAttribute(MANAGED_ATTR, '1');
        return m;
      }
    );
    metaDesc.setAttribute('content', description);
  }

  // Canonical: default to origin + pathname (strip query)
  const canonicalUrl = (() => {
    try {
      const origin = window.location.origin;
      if (canonicalPath) return origin + canonicalPath;
      return origin + window.location.pathname;
    } catch {
      return canonicalPath || '';
    }
  })();
  if (canonicalUrl) {
    // Remove existing managed canonical
    const existing = document.head.querySelector(
      `link[rel="canonical"][${MANAGED_ATTR}="1"]`
    );
    if (existing) existing.remove();
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', canonicalUrl);
    link.setAttribute(MANAGED_ATTR, '1');
    document.head.appendChild(link);
  }

  // Robots
  if (robots) {
    const metaRobots = ensureTag(
      `meta[name="robots"][${MANAGED_ATTR}="1"]`,
      () => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'robots');
        m.setAttribute(MANAGED_ATTR, '1');
        return m;
      }
    );
    metaRobots.setAttribute('content', robots);
  } else {
    // Remove managed robots if not provided
    const metaRobots = document.head.querySelector(
      `meta[name="robots"][${MANAGED_ATTR}="1"]`
    );
    if (metaRobots) metaRobots.remove();
  }
}

export function setJsonLd(id, data) {
  if (typeof document === 'undefined') return;
  // Remove existing with same id
  const selector = `script[type="application/ld+json"][${MANAGED_ATTR}="1"][data-id="${id}"]`;
  const existing = document.head.querySelector(selector);
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute(MANAGED_ATTR, '1');
  script.setAttribute('data-id', id);
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}
