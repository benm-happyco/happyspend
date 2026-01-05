# Supabase Setup Instructions

This project uses Supabase for all placeholder and test data. Follow these steps to configure your Supabase connection.

## Getting Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Settings** > **API**
4. You'll find:
   - **Project URL**: This is your `VITE_SUPABASE_URL`
   - **anon public** key: This is your `VITE_SUPABASE_ANON_KEY`

## Setting Up Environment Variables

1. Create a `.env.local` file in the project root (if it doesn't exist)
2. Add the following variables:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Replace the values with your actual Supabase credentials.

## Important Notes

- The `.env.local` file is gitignored and will not be committed to version control
- Never commit your Supabase credentials to the repository
- The Supabase client is configured in `src/lib/supabase.ts`
- All data fetching should use the Supabase client, never hardcoded data

## Testing the Connection

After setting up your environment variables, restart your dev server:

```bash
npm run dev
```

The Supabase client will automatically initialize when the app starts. If there are any connection errors, check that your environment variables are set correctly.

