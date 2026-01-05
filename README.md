# Mantine Theme Showcase

A Vite + React + TypeScript application that visualizes and documents customized Mantine components. This showcase serves as a visual reference for available components and their customizations.

## Features

- **Form Showcase**: Demonstrates primary/secondary buttons and various form field types
- **Component Showcase**: Comprehensive visual reference for all customized Mantine components
- **Custom Theme**: Based on the HappyCo design system with:
  - Custom color palette (blurple as primary)
  - Proxima Nova font family
  - Custom component defaults and overrides

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

1. Create a `.env.local` file in the project root:
```bash
touch .env.local
```

2. Add your Supabase credentials to `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

   You can find these values in your Supabase project settings:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the "Project URL" for `VITE_SUPABASE_URL`
   - Copy the "anon public" key for `VITE_SUPABASE_ANON_KEY`

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
forge/
├── src/
│   ├── theme/
│   │   ├── theme.ts              # Main theme configuration
│   │   ├── colors.ts              # Color palette definitions
│   │   └── components.ts          # Component overrides
│   ├── pages/
│   │   ├── FormShowcase.tsx      # Form with buttons and fields
│   │   └── ComponentShowcase.tsx # Visual testing page
│   ├── css/
│   │   └── fonts.css              # Proxima Nova font definitions
│   ├── App.tsx                    # Main app with routing
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
```

## Theme Customizations

The theme includes the following customizations:

1. **Colors**: Custom color palette with blurple as primary color
2. **Typography**: Proxima Nova font family from Adobe Typekit
3. **Button**: Default size='lg', custom radius based on size
4. **Inputs**: Default radius='sm'
5. **Spacing/Radius**: Custom values matching HappyCo design system
6. **Component Defaults**: Various component-specific overrides

## Usage

This showcase serves as:
- **Visual Reference**: See all customized components and their variations
- **Design System Documentation**: Understand what components are available and how they look
- **Component Library**: Reference for using customized components in designs

Customizations are made in the theme configuration files (`src/theme/`). This application visualizes and documents what's available for use in designs.


