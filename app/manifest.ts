import type { MetadataRoute } from 'next';

// Colors mirror the Roya theme tokens in app/globals.css.
const ROYA_SLATE = '#44545a';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Roya Events & Adventures',
    short_name: 'Roya Events',
    description:
      'Discover public events and guided adventures across Alberta, or work with our team to create something personal.',
    start_url: '/',
    display: 'standalone',
    background_color: ROYA_SLATE,
    theme_color: ROYA_SLATE,
    icons: [
      {
        src: '/logo.png',
        sizes: '562x562',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
