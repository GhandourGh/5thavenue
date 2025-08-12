# Environment Setup for Supabase

## Required Environment Variables

You need to create a `.env` file in your project root with your Supabase credentials:

```bash
# Supabase Configuration (REQUIRED)
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Wompi Configuration (Optional - for payments)
REACT_APP_WOMPI_PUBLIC_KEY=pub_test_your_public_key_here
REACT_APP_WOMPI_ENV=sandbox

# Feature Flags
USE_BOLD_UI=false
REACT_APP_ENV=development
```

## How to Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API"
4. Copy the "Project URL" and "anon public" key
5. Paste them in your `.env` file

## After Setting Up

1. Save the `.env` file
2. Restart your development server:
   ```bash
   npm start
   ```

## Important Notes

- The `.env` file should be in your project root (same level as `package.json`)
- Environment variables must start with `REACT_APP_` to be accessible in React
- Never commit your `.env` file to version control
- Restart the development server after changing environment variables
