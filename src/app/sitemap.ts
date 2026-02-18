import { MetadataRoute } from 'next'

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://mapparser.travel-tracker.org'
    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
    ]
}
