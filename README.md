# 5thAvenue - Premium Perfume Store

A modern e-commerce website for luxury fragrances and perfumes, built with React and Supabase.

## 🚀 Features

- **Modern UI/UX**: Clean, responsive design with Tailwind CSS
- **Supabase Integration**: Database and authentication ready
- **Admin Panel**: Complete admin setup for store management
- **Mobile First**: Optimized for all device sizes
- **Performance Optimized**: Fast loading and smooth interactions

## 🛠️ Tech Stack

- **Frontend**: React 18 with JSX
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router DOM
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **State Management**: React Hooks

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── layout/       # Layout components
│   └── admin/        # Admin-specific components
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── services/         # API and external services
├── utils/            # Utility functions
├── assets/           # Images, icons, etc.
└── styles/           # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
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
   ```

4. **Start the development server**

   ```bash
   npm start
   ```

5. **Access the application**
   - Main site: http://localhost:3000
   - Admin setup: http://localhost:3000/admin

## 🎨 Design System

### Colors

- **Primary**: `#CFA386` (Warm beige)
- **Secondary**: `#ECDACF` (Light cream)
- **Text Primary**: `#ffffff` (White)
- **Text Secondary**: `#1C4534` (Dark green)

### Typography

- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

## 🔧 Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Database Tables

The following tables will be created automatically:

#### Products Table

```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id),
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Categories Table

```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Orders Table

```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status VARCHAR DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Admin Setup

1. Navigate to `/admin` in your application
2. Enter your Supabase credentials
3. Test the connection
4. Create an admin user account

## 📱 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🎯 Development Guidelines

### Code Style

- Use JSX files (`.jsx`) instead of TypeScript
- Follow component naming conventions
- Use descriptive variable and function names
- Keep components focused and single-purpose

### Styling

- Use Tailwind CSS classes
- Follow mobile-first responsive design
- Use CSS variables for consistent theming
- Maintain clean, readable code

### Performance

- Optimize images (max 300KB)
- Use lazy loading for non-critical components
- Minimize API calls with proper caching
- Avoid inline logic in JSX

## 🔒 Security

- Environment variables for sensitive data
- Supabase Row Level Security (RLS)
- Input validation and sanitization
- Secure authentication flow

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Deploy to Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**5thAvenue** - Premium fragrances for the discerning customer.
