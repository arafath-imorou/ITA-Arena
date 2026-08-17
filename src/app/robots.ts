import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/organizer/', '/api/'],
        },
        sitemap: 'https://www.itaarena.com/sitemap.xml',
    };
}
