## 1. Planning & Research

| Task                                                                                                                | Priority | Status         | Estimated Duration | Deadline | Notes                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------- | -------- | -------------- | ------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Define target market for perfume store (men’s, women’s, unisex, niche fragrances, Arabic perfumes, designer brands) | High     | ❌ Not Started | 1d                 |          | Define 2–3 buyer personas and assortment by segment. Depends on product range and pricing.                                                           |
| Research competitors for local and online perfume stores                                                            | Medium   | ❌ Not Started | 1d                 |          | Compile 5–10 Colombian competitors; compare pricing, shipping, payment options.                                                                      |
| Decide product range for the perfume store: perfumes by category, brands, gift sets, testers, miniatures            | High     | 🔄 In Progress | 1d                 |          | Catalog exists via Supabase; validate categories and variant strategy (sizes, testers).                                                              |
| Set pricing strategy and profit margins for the perfume store                                                       | High     | 🔄 In Progress | 1d                 |          | Discounts supported; formalize margin targets and MAP if any.                                                                                        |
| Define shipping areas for Colombia nationwide and shipping methods                                                  | High     | 🔄 In Progress | 4h                 |          | Checkout supports departments/cities and shipping methods; current coverage text is San Andrés only—decide nationwide vs local and update policy/UI. |
| Choose payment options for the perfume store (Credit Card, BOLD, COD, bank transfer)                                | High     | 🔄 In Progress | 4h                 |          | Bold and COD chosen in UI; gateway integration pending.                                                                                              |
| Research legal requirements for business registration, invoicing, and return policy                                 | High     | ❌ Not Started | 1d                 |          | Draft compliance checklist; align with Returns/Privacy/Terms pages.                                                                                  |

Action plan

- Finalize personas and assortment; approve pricing policy.
- Confirm national vs local delivery scope; align COD zones.
- Lock payment methods (Bold live, COD policy) before marketing.

---

## 2. Branding

| Task                                                                         | Priority | Status         | Estimated Duration | Deadline | Notes                                                                                                   |
| ---------------------------------------------------------------------------- | -------- | -------------- | ------------------ | -------- | ------------------------------------------------------------------------------------------------------- |
| Create store name, logo, and brand colors                                    | High     | ✅ Done        | 2d                 |          | Logo present (`assets/icons/logo5th.svg`) and brand color `#a10009`.                                    |
| Define brand tone and style (luxury, casual, minimalist)                     | Medium   | 🔄 In Progress | 4h                 |          | Visual tone consistent; document style guide (typography, spacing, imagery).                            |
| Design packaging for the perfume store (bottles, gift boxes, shipping boxes) | Medium   | ❌ Not Started | 2d                 |          | No packaging assets tracked in repo.                                                                    |
| Capture professional product photos (bottle close-ups, lifestyle shots)      | High     | 🔄 In Progress | 2d                 |          | Product images via Supabase; Admin flow supports WebP optimization; standardize <300KB and backgrounds. |
| Create brand slogan or tagline                                               | Medium   | 🔄 In Progress | 2h                 |          | Hero copy exists; define a concise, reusable tagline.                                                   |

Action plan

- Document a one-page brand guide; define image standards.
- Batch-optimize key PDP images to WebP <300KB.
- Approve tagline and apply to homepage and metadata.

---

## 3. Technical Setup

| Task                                                                                           | Priority | Status         | Estimated Duration | Deadline | Notes                                                                        |
| ---------------------------------------------------------------------------------------------- | -------- | -------------- | ------------------ | -------- | ---------------------------------------------------------------------------- |
| Choose e-commerce platform for the perfume store (Custom React/Supabase, Shopify, WooCommerce) | High     | ✅ Done        | 4h                 |          | Custom React + Supabase present.                                             |
| Purchase domain name for the perfume store                                                     | High     | ❌ Not Started | 1h                 |          | Not detectable from repo.                                                    |
| Choose hosting or deployment (Vercel, Netlify, dedicated hosting)                              | High     | ❌ Not Started | 2h                 |          | No deployment config present.                                                |
| Set up SSL certificate for the domain                                                          | High     | ❌ Not Started | 1h                 |          | Configure with host after domain.                                            |
| Create custom email address (yourname@yourdomain.com)                                          | Medium   | 🔄 In Progress | 2h                 |          | Mailto present (contacto@5thavenue.co); verify DNS/MX and sender (SPF/DKIM). |

Action plan

- Choose hosting target (Vercel recommended) and point domain.
- Set SSL, redirects, and environment secrets (Supabase keys).
- Verify transactional email sender domain.

---

## 4. Website Features

| Task                                                                                        | Priority | Status         | Estimated Duration | Deadline | Notes                                                                          |
| ------------------------------------------------------------------------------------------- | -------- | -------------- | ------------------ | -------- | ------------------------------------------------------------------------------ |
| Build homepage with featured perfumes and promotions                                        | High     | ✅ Done        | 1d                 |          | `Home.jsx` implemented.                                                        |
| Build shop page with filters (brand, category, gender, price range)                         | High     | ✅ Done        | 2d                 |          | `Products.jsx` with filters, sort, pagination.                                 |
| Build product detail page with title, brand, size, price, description, and related products | High     | ✅ Done        | 2d                 |          | `ProductDetail.jsx` implemented; ratings are placeholder.                      |
| Build cart page with editable quantities                                                    | High     | ✅ Done        | 1d                 |          | `Cart.jsx` supports quantity updates and removal.                              |
| Build checkout page with customer info form, payment method, and shipping options           | High     | ✅ Done        | 2d                 |          | `Checkout.jsx` complete; payment gateway still simulated (see Backend/Market). |
| Create About Us page                                                                        | Medium   | ✅ Done        | 4h                 |          | `About.jsx` (stores) serves About content.                                     |
| Create Contact page with form and WhatsApp link                                             | Medium   | 🔄 In Progress | 4h                 |          | WhatsApp link present; form missing.                                           |
| Create Privacy Policy, Terms, and Return Policy pages                                       | High     | 🔄 In Progress | 4h                 |          | `Returns.jsx` done; Privacy/Terms missing.                                     |
| Implement mobile-first responsive design                                                    | High     | ✅ Done        | 1d                 |          | Tailwind utility classes across pages.                                         |
| Optimize site for fast load time                                                            | Medium   | 🔄 In Progress | 1d                 |          | Add lazy loading where missing; ensure product images <300KB WebP.             |
| Establish clear typography and visuals                                                      | Medium   | ✅ Done        | 4h                 |          | Consistent visual style across pages.                                          |
| Add trust badges for secure payment and authenticity guarantee                              | Medium   | ✅ Done        | 2h                 |          | Secure payment messaging present in Checkout/Payment.                          |
| Enable customer reviews and testimonials                                                    | Medium   | ❌ Not Started | 1d                 |          | No reviews system; PDP shows only placeholder rating.                          |

Action plan

- Add Privacy and Terms pages; wire links in footer/nav.
- Add Contact form with email/WhatsApp fallback.
- Implement real reviews later; hide placeholder if not needed.

---

## 5. E-Commerce Backend Logic

| Task                                                                                     | Priority | Status         | Estimated Duration | Deadline | Notes                                                                            |
| ---------------------------------------------------------------------------------------- | -------- | -------------- | ------------------ | -------- | -------------------------------------------------------------------------------- |
| Implement user account system (email, Google, Apple, phone OTP)                          | High     | ✅ Done        | 3d                 |          | Supabase auth with email/password, OAuth, and phone OTP hooks.                   |
| Implement guest checkout option                                                          | High     | ❌ Not Started | 1d                 |          | `Checkout` is protected; allow guests or add quick guest checkout.               |
| Implement cart persistence (local storage for guests, account-based for logged-in users) | High     | ✅ Done        | 1d                 |          | `CartContext` persists to localStorage and merges with Supabase.                 |
| Implement stock management per perfume variant                                           | High     | 🔄 In Progress | 2d                 |          | RPC to decrement stock exists; no variant model (sizes) yet; PDP stock UI basic. |
| Implement order management with status tracking                                          | High     | ✅ Done        | 2d                 |          | `orders` table and Admin page for status/fulfillment.                            |
| Implement email notifications (order confirmation, shipping updates)                     | High     | ✅ Done        | 1d                 |          | Order confirmation via Edge Function (Brevo); shipping updates TBD.              |
| Implement discount code system                                                           | Low      | ❌ Not Started | 1d                 |          | `promoCode` captured but no validation/discount logic.                           |

Action plan

- Enable guest checkout or inline signup after order.
- Add email service (e.g., Resend/SendGrid) for order emails.
- Define product variant model if sizes/testers needed.

---

## 6. Colombian Market Specific

| Task                                                           | Priority | Status         | Estimated Duration | Deadline | Notes                                                                               |
| -------------------------------------------------------------- | -------- | -------------- | ------------------ | -------- | ----------------------------------------------------------------------------------- |
| Implement cities/departments dropdown for shipping in Colombia | High     | ✅ Done        | 4h                 |          | Checkout loads and filters Colombian departments/cities.                            |
| Integrate Colombian payment gateways (BOLD, PayU, Wompi)       | High     | 🔄 In Progress | 2d                 |          | Mock BOLD init/status + processing flow live; real API + webhook + secrets pending. |
| Enable COD option with admin confirmation                      | High     | 🔄 In Progress | 1d                 |          | COD method available; admin can mark paid; restrict to supported zones.             |
| Set currency to COP across the storefront and backend          | High     | ✅ Done        | 1h                 |          | COP formatting everywhere.                                                          |
| Integrate WhatsApp chat for customer support                   | Medium   | ✅ Done        | 2h                 |          | Floating WhatsApp in layout and Contact page link.                                  |
| Integrate shipping with local couriers                         | High     | ❌ Not Started | 2d                 |          | No courier API integration.                                                         |

Action plan

- Integrate Bold checkout (serverless webhook), keep COD for San Andrés.
- Defer couriers; start with manual fulfillment and status updates.

---

## 7. Marketing Setup

| Task                                                            | Priority | Status         | Estimated Duration | Deadline | Notes                                                          |
| --------------------------------------------------------------- | -------- | -------------- | ------------------ | -------- | -------------------------------------------------------------- |
| Optimize SEO for products and pages                             | Medium   | ❌ Not Started | 2d                 |          | No meta tags/schema; add titles, descriptions, Product schema. |
| Integrate Google Analytics and Facebook Pixel                   | High     | ❌ Not Started | 4h                 |          | Add GA4 and Meta Pixel via Tag Manager.                        |
| Add social media links                                          | Medium   | ❌ Not Started | 1h                 |          | No links in header/footer.                                     |
| Set up newsletter signup and email marketing automation         | Medium   | ❌ Not Started | 1d                 |          | No signup form or ESP integration.                             |
| Plan and set up launch campaign with discounts or free shipping | High     | ❌ Not Started | 2d                 |          | Define offers and landing assets.                              |
| Plan influencer collaborations                                  | Medium   | ❌ Not Started | 2d                 |          | Prepare sample kits and brief.                                 |

Action plan

- Add GA4/Pixel, then basic SEO on core pages.
- Add footer social links and a simple newsletter capture.

---

## 8. Testing Before Launch

| Task                               | Priority | Status         | Estimated Duration | Deadline | Notes                                                                                                  |
| ---------------------------------- | -------- | -------------- | ------------------ | -------- | ------------------------------------------------------------------------------------------------------ |
| Test payment methods end-to-end    | High     | 🔄 In Progress | 4h                 |          | Mock BOLD flow works (init/status, processing, success/fail); verify real gateway when keys available. |
| Test cart persistence              | High     | ❌ Not Started | 2h                 |          | Create manual test script (guest vs logged-in merge).                                                  |
| Test checkout form validation      | High     | ❌ Not Started | 3h                 |          | Add test cases; verify phone and address rules.                                                        |
| Test responsive layouts            | Medium   | ❌ Not Started | 4h                 |          | Run cross-browser/device checks.                                                                       |
| Test admin order management        | High     | ❌ Not Started | 3h                 |          | Exercise status/fulfillment updates and filters.                                                       |
| Test email notifications           | Medium   | ❌ Not Started | 2h                 |          | After email service integration.                                                                       |
| Test search and filters            | High     | ❌ Not Started | 3h                 |          | Validate category, price, sort, and search term behavior.                                              |
| Test stock updating after purchase | High     | ❌ Not Started | 2h                 |          | Validate RPC decrement and UI stock display.                                                           |
| Test product image loading speed   | Medium   | ❌ Not Started | 2h                 |          | Ensure <300KB, lazy loading, WebP.                                                                     |

Action plan

- After Bold integration, run a full E2E pass (checkout → admin).
- Create a simple QA checklist in repo to track manual tests.

---

## 9. Launch

| Task                                      | Priority | Status         | Estimated Duration | Deadline | Notes                                                                   |
| ----------------------------------------- | -------- | -------------- | ------------------ | -------- | ----------------------------------------------------------------------- |
| Announce launch on social media and email | High     | ❌ Not Started | 4h                 |          | Prepare creative and schedule posts/emails.                             |
| Offer launch discounts or bundles         | High     | ❌ Not Started | 2h                 |          | Configure discounts or bundles; PDP already supports discount display.  |
| Monitor analytics and sales               | High     | 🔄 In Progress | 1d                 |          | Admin analytics present; add GA4 dashboards for traffic and conversion. |

Action plan

- Complete payment + privacy/terms before launch comms.
- Set promo codes or bundles; verify display on PDP and cart.

---

## 10. Post-Launch & Maintenance

| Task                                     | Priority | Status         | Estimated Duration | Deadline | Notes                                                 |
| ---------------------------------------- | -------- | -------------- | ------------------ | -------- | ----------------------------------------------------- |
| Update inventory regularly               | Medium   | 🔄 In Progress | 1h                 |          | Admin page supports edits; define weekly SOP.         |
| Add seasonal and new collections         | Medium   | ❌ Not Started | 1d                 |          | Plan collections; create categories and assets.       |
| Respond to customer inquiries quickly    | High     | 🔄 In Progress | 1h                 |          | WhatsApp link/live chat via WA; define response SLAs. |
| Collect and display customer reviews     | Medium   | ❌ Not Started | 1d                 |          | Add review collection and PDP display.                |
| Run retargeting ads for cart abandonment | Medium   | ❌ Not Started | 1d                 |          | Requires Pixel + email automation.                    |
| Monitor site speed and uptime            | High     | ❌ Not Started | 1h                 |          | Add uptime monitor and basic alerting.                |
| Continue SEO and content updates         | Medium   | ❌ Not Started | 2d                 |          | Publish guides/collections quarterly.                 |

Action plan

- Define ops cadence: stock updates, content refresh, customer support.
- Add reviews and simple retention flows post-launch.

---

```json
{
  "To Do": [
    {
      "task": "Define target market for perfume store (men’s, women’s, unisex, niche fragrances, Arabic perfumes, designer brands)",
      "priority": "High",
      "estimatedDuration": "1d"
    },
    {
      "task": "Research competitors for local and online perfume stores",
      "priority": "Medium",
      "estimatedDuration": "1d"
    },
    {
      "task": "Decide product range for the perfume store: perfumes by category, brands, gift sets, testers, miniatures",
      "priority": "High",
      "estimatedDuration": "1d"
    },
    {
      "task": "Set pricing strategy and profit margins for the perfume store",
      "priority": "High",
      "estimatedDuration": "1d"
    },
    {
      "task": "Define shipping areas for Colombia nationwide and shipping methods",
      "priority": "High",
      "estimatedDuration": "4h"
    },
    {
      "task": "Choose payment options for the perfume store (Credit Card, BOLD, COD, bank transfer)",
      "priority": "High",
      "estimatedDuration": "4h"
    },
    {
      "task": "Research legal requirements for business registration, invoicing, and return policy",
      "priority": "High",
      "estimatedDuration": "1d"
    },

    {
      "task": "Create store name, logo, and brand colors",
      "priority": "High",
      "estimatedDuration": "2d"
    },
    {
      "task": "Define brand tone and style (luxury, casual, minimalist)",
      "priority": "Medium",
      "estimatedDuration": "4h"
    },
    {
      "task": "Design packaging for the perfume store (bottles, gift boxes, shipping boxes)",
      "priority": "Medium",
      "estimatedDuration": "2d"
    },
    {
      "task": "Capture professional product photos (bottle close-ups, lifestyle shots)",
      "priority": "High",
      "estimatedDuration": "2d"
    },
    {
      "task": "Create brand slogan or tagline",
      "priority": "Medium",
      "estimatedDuration": "2h"
    },

    {
      "task": "Choose e-commerce platform for the perfume store (Custom React/Supabase, Shopify, WooCommerce)",
      "priority": "High",
      "estimatedDuration": "4h"
    },
    {
      "task": "Purchase domain name for the perfume store",
      "priority": "High",
      "estimatedDuration": "1h"
    },
    {
      "task": "Choose hosting or deployment (Vercel, Netlify, dedicated hosting)",
      "priority": "High",
      "estimatedDuration": "2h"
    },
    {
      "task": "Set up SSL certificate for the domain",
      "priority": "High",
      "estimatedDuration": "1h"
    },
    {
      "task": "Create custom email address (yourname@yourdomain.com)",
      "priority": "Medium",
      "estimatedDuration": "2h"
    },

    {
      "task": "Build homepage with featured perfumes and promotions",
      "priority": "High",
      "estimatedDuration": "1d"
    },
    {
      "task": "Build shop page with filters (brand, category, gender, price range)",
      "priority": "High",
      "estimatedDuration": "2d"
    },
    {
      "task": "Build product detail page with title, brand, size, price, description, and related products",
      "priority": "High",
      "estimatedDuration": "2d"
    },
    {
      "task": "Build cart page with editable quantities",
      "priority": "High",
      "estimatedDuration": "1d"
    },
    {
      "task": "Build checkout page with customer info form, payment method, and shipping options",
      "priority": "High",
      "estimatedDuration": "2d"
    },
    {
      "task": "Create About Us page",
      "priority": "Medium",
      "estimatedDuration": "4h"
    },
    {
      "task": "Create Contact page with form and WhatsApp link",
      "priority": "Medium",
      "estimatedDuration": "4h"
    },
    {
      "task": "Create Privacy Policy, Terms, and Return Policy pages",
      "priority": "High",
      "estimatedDuration": "4h"
    },
    {
      "task": "Implement mobile-first responsive design",
      "priority": "High",
      "estimatedDuration": "1d"
    },
    {
      "task": "Optimize site for fast load time",
      "priority": "Medium",
      "estimatedDuration": "1d"
    },
    {
      "task": "Establish clear typography and visuals",
      "priority": "Medium",
      "estimatedDuration": "4h"
    },
    {
      "task": "Add trust badges for secure payment and authenticity guarantee",
      "priority": "Medium",
      "estimatedDuration": "2h"
    },
    {
      "task": "Enable customer reviews and testimonials",
      "priority": "Medium",
      "estimatedDuration": "1d"
    },

    {
      "task": "Implement user account system (email, Google, Apple, phone OTP)",
      "priority": "High",
      "estimatedDuration": "3d"
    },
    {
      "task": "Implement guest checkout option",
      "priority": "High",
      "estimatedDuration": "1d"
    },
    {
      "task": "Implement cart persistence (local storage for guests, account-based for logged-in users)",
      "priority": "High",
      "estimatedDuration": "1d"
    },
    {
      "task": "Implement stock management per perfume variant",
      "priority": "High",
      "estimatedDuration": "2d"
    },
    {
      "task": "Implement order management with status tracking",
      "priority": "High",
      "estimatedDuration": "2d"
    },
    {
      "task": "Implement email notifications (order confirmation, shipping updates)",
      "priority": "High",
      "estimatedDuration": "1d"
    },
    {
      "task": "Implement discount code system",
      "priority": "Low",
      "estimatedDuration": "1d"
    },

    {
      "task": "Implement cities/departments dropdown for shipping in Colombia",
      "priority": "High",
      "estimatedDuration": "4h"
    },
    {
      "task": "Integrate Colombian payment gateways (BOLD, PayU, Wompi)",
      "priority": "High",
      "estimatedDuration": "2d"
    },
    {
      "task": "Enable COD option with admin confirmation",
      "priority": "High",
      "estimatedDuration": "1d"
    },
    {
      "task": "Set currency to COP across the storefront and backend",
      "priority": "High",
      "estimatedDuration": "1h"
    },
    {
      "task": "Integrate WhatsApp chat for customer support",
      "priority": "Medium",
      "estimatedDuration": "2h"
    },
    {
      "task": "Integrate shipping with local couriers",
      "priority": "High",
      "estimatedDuration": "2d"
    },

    {
      "task": "Optimize SEO for products and pages",
      "priority": "Medium",
      "estimatedDuration": "2d"
    },
    {
      "task": "Integrate Google Analytics and Facebook Pixel",
      "priority": "High",
      "estimatedDuration": "4h"
    },
    {
      "task": "Add social media links",
      "priority": "Medium",
      "estimatedDuration": "1h"
    },
    {
      "task": "Set up newsletter signup and email marketing automation",
      "priority": "Medium",
      "estimatedDuration": "1d"
    },
    {
      "task": "Plan and set up launch campaign with discounts or free shipping",
      "priority": "High",
      "estimatedDuration": "2d"
    },
    {
      "task": "Plan influencer collaborations",
      "priority": "Medium",
      "estimatedDuration": "2d"
    },

    {
      "task": "Test payment methods end-to-end",
      "priority": "High",
      "estimatedDuration": "4h"
    },
    {
      "task": "Test cart persistence",
      "priority": "High",
      "estimatedDuration": "2h"
    },
    {
      "task": "Test checkout form validation",
      "priority": "High",
      "estimatedDuration": "3h"
    },
    {
      "task": "Test responsive layouts",
      "priority": "Medium",
      "estimatedDuration": "4h"
    },
    {
      "task": "Test admin order management",
      "priority": "High",
      "estimatedDuration": "3h"
    },
    {
      "task": "Test email notifications",
      "priority": "Medium",
      "estimatedDuration": "2h"
    },
    {
      "task": "Test search and filters",
      "priority": "High",
      "estimatedDuration": "3h"
    },
    {
      "task": "Test stock updating after purchase",
      "priority": "High",
      "estimatedDuration": "2h"
    },
    {
      "task": "Test product image loading speed",
      "priority": "Medium",
      "estimatedDuration": "2h"
    },

    {
      "task": "Announce launch on social media and email",
      "priority": "High",
      "estimatedDuration": "4h"
    },
    {
      "task": "Offer launch discounts or bundles",
      "priority": "High",
      "estimatedDuration": "2h"
    },
    {
      "task": "Monitor analytics and sales",
      "priority": "High",
      "estimatedDuration": "1d"
    },

    {
      "task": "Update inventory regularly",
      "priority": "Medium",
      "estimatedDuration": "1h"
    },
    {
      "task": "Add seasonal and new collections",
      "priority": "Medium",
      "estimatedDuration": "1d"
    },
    {
      "task": "Respond to customer inquiries quickly",
      "priority": "High",
      "estimatedDuration": "1h"
    },
    {
      "task": "Collect and display customer reviews",
      "priority": "Medium",
      "estimatedDuration": "1d"
    },
    {
      "task": "Run retargeting ads for cart abandonment",
      "priority": "Medium",
      "estimatedDuration": "1d"
    },
    {
      "task": "Monitor site speed and uptime",
      "priority": "High",
      "estimatedDuration": "1h"
    },
    {
      "task": "Continue SEO and content updates",
      "priority": "Medium",
      "estimatedDuration": "2d"
    }
  ],
  "In Progress": [],
  "Done": []
}
```
