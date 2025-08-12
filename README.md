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
- **Payment**: Wompi Integration
- **Icons**: Lucide React
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

3. **Environment Setup**
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

## 🎯 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run lint` - Run ESLint with auto-fix

## 🏗️ Project Structure

```
src/
├── assets/          # Images, icons, and static assets
├── components/      # Reusable UI components
│   ├── auth/       # Authentication components
│   ├── layout/     # Layout components
│   └── ui/         # UI components
├── contexts/       # React contexts for state management
├── pages/          # Page components
├── services/       # API services and external integrations
└── utils/          # Utility functions and helpers
```

## 🚀 Deployment

### Netlify Deployment

The project is configured for automatic deployment on Netlify:

1. Connect your GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `build`
4. Environment variables will be set in Netlify dashboard

### Manual Deployment

1. Build the project:

   ```bash
   npm run build
   ```

2. Deploy the `build` folder to your hosting provider

## 📱 Performance Optimizations

- **Image Optimization**: All images converted to WebP format (83-99% size reduction)
- **Code Splitting**: Automatic code splitting with React Router
- **Lazy Loading**: Images and components loaded on demand
- **Caching**: Optimized cache headers for static assets
- **Bundle Optimization**: Tree shaking and minification

## 🔧 Configuration Files

- `netlify.toml` - Netlify deployment configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `.prettierrc` - Prettier code formatting rules
- `.gitignore` - Git ignore patterns

## 📊 Performance Metrics

- **Bundle Size**: ~160KB gzipped
- **Image Optimization**: 83-99% reduction in file sizes
- **Lighthouse Score**: Optimized for performance, accessibility, and SEO

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run format` and `npm run lint`
5. Submit a pull request

## 📄 License

This project is private and proprietary to 5th Avenue Spanish Online.

## 🆘 Support

For support and questions, please contact the development team.

---

**Built with ❤️ for 5th Avenue Spanish Online**
