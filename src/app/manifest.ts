import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'MapParser',
        short_name: 'MapParser',
        description: 'Easily parse and export Google Maps routes to CSV, or KML.',
        start_url: '/',
        display: 'standalone',
        background_color: '#1e1b4b',
        theme_color: '#4f46e5',
        icons: [
            {
                src: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
        ],
    }
}
