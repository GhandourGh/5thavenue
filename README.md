# 5th Avenue Spanish Online

A modern, responsive e-commerce platform for 5th Avenue Spanish Online, built with React and optimized for performance.

## 🚀 Features

- **Modern React Architecture**: Built with React 19 and modern hooks
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Performance Optimized**: WebP images, lazy loading, and optimized assets
- **Payment Integration**: Wompi payment gateway for Colombian market
- **Real-time Cart**: Persistent shopping cart with Supabase
- **Admin Panel**: Product management and order tracking
- **SEO Optimized**: Meta tags, structured data, and performance metrics
- **Accessibility**: WCAG compliant with semantic HTML

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router DOM
- **Styling**: Tailwind CSS, PostCSS
- **Backend**: Supabase (Database, Auth, Storage)
- **Payment**: Wompi (Colombian payment gateway)
- **Build Tool**: Create React App
- **Code Quality**: Prettier, ESLint

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ghandourgh/5thavenue.git
   cd 5thavenue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_WOMPI_PUBLIC_KEY=your_wompi_public_key
   ```

4. **Start development server**
   ```bash
   npm start
   ```

## 🏗️ Build

To create a production build:

```bash
npm run build
```

The build output will be in the `build/` directory.

## 🚀 Deployment

### GitHub Pages

The project is configured for GitHub Pages deployment:

1. **Repository**: https://github.com/ghandourgh/5thavenue
2. **Live Site**: https://ghandourgh.github.io/5thavenue

**Setup Steps:**
1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` (will be created by GitHub Actions)
4. Folder: `/ (root)`

### Netlify

1. **Drag & Drop**: Upload the `build/` folder to Netlify
2. **Git Integration**: Connect your GitHub repository
3. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `build`

### Vercel

1. **Import from Git**: Connect your GitHub repository
2. **Framework Preset**: Create React App
3. **Build Settings**: Auto-detected from `vercel.json`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   └── ui/             # UI components
├── contexts/           # React contexts
├── pages/              # Page components
├── services/           # API services
├── utils/              # Utility functions
└── assets/             # Static assets
```

## 🔧 Configuration

### SPA Fallbacks

The project includes SPA fallback configurations for all major hosting platforms:

- **Netlify**: `netlify.toml` with redirects
- **Vercel**: `vercel.json` with rewrites
- **GitHub Pages**: `public/404.html` with SPA fallback script

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_SUPABASE_URL` | Supabase project URL | Yes |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `REACT_APP_WOMPI_PUBLIC_KEY` | Wompi public key | Yes |

## 🎨 Customization

### Styling

The project uses Tailwind CSS with custom configuration:

- **Primary Color**: `#a10009` (5th Avenue Red)
- **Custom Components**: Defined in `src/index.css`
- **Responsive Design**: Mobile-first approach

### Payment Configuration

Payment settings are configured in `src/utils/config.js`:

- **Currency**: Colombian Peso (COP)
- **Payment Methods**: Credit Card, PSE, Nequi, Cash on Delivery
- **Shipping**: Local delivery (San Andrés)

## 📱 Features

### Customer Features
- Product browsing and search
- Shopping cart with persistence
- Secure checkout with multiple payment options
- Order tracking
- Responsive design for all devices

### Admin Features
- Product management (CRUD operations)
- Order management and fulfillment
- Inventory tracking
- Sales analytics
- Image optimization and management

## 🔒 Security

- Environment variables for sensitive data
- Supabase Row Level Security (RLS)
- Input validation and sanitization
- HTTPS enforcement
- Security headers configured

## 📊 Performance

- **Image Optimization**: WebP format with fallbacks
- **Code Splitting**: Lazy loading for routes
- **Caching**: Static assets cached for 1 year
- **Bundle Size**: Optimized with tree shaking
- **Lighthouse Score**: 90+ on all metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is proprietary software for 5th Avenue Spanish Online.

## 📞 Support

For support and questions:
- **Email**: support@5thavenue.com.co
- **WhatsApp**: +57-XXX-XXX-XXXX
- **Website**: https://5thavenue.com.co

## 🔄 Changelog

### v1.0.0 (Current)
- Initial release
- Complete e-commerce functionality
- Payment integration
- Admin panel
- Mobile-responsive design
- SEO optimization
- Performance optimization

---

**Built with ❤️ for 5th Avenue Spanish Online**
