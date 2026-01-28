import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path'

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding"
  ],
  "framework": "@storybook/react-vite",
  async viteFinal(config) {
    return {
      ...config,
      base: process.env.STORYBOOK_BASE_PATH ?? '/',
      resolve: {
        ...config.resolve,
        alias: {
          ...(config.resolve?.alias ?? {}),
          '@hugeicons/react': path.resolve(__dirname, '../src/storybook/hugeicons-react-stub.tsx'),
          '@hugeicons-pro/core-stroke-rounded': path.resolve(
            __dirname,
            '../src/storybook/hugeicons-core-stub.ts'
          ),
        },
      },
    }
  }
};
export default config;