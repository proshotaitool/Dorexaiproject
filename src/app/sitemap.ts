
import { MetadataRoute } from 'next';
import { tools } from '@/lib/tools';
import { allPages } from '@/lib/pages';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = 'https://dorexai.space';

  // Static pages from a central list
  const staticRoutes = allPages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: page.path === '/' ? 1.0 : 0.8,
  }));

  // Dynamic tool pages
  const toolRoutes = tools
    .filter(tool => !tool.isComingSoon)
    .map((tool) => ({
      url: `${siteUrl}${tool.path}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  return [...staticRoutes, ...toolRoutes];
}
