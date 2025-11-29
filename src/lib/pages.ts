
export type Page = {
    name: string;
    path: string;
};

export const allPages: Page[] = [
  // Main Pages
  { name: 'Homepage', path: '/' },
  { name: 'About Us', path: '/about' },
  { name: 'Contact Us', path: '/contact' },
  { name: 'Pricing', path: '/pricing' },
  // Hub Pages
  { name: 'All Tools Page', path: '/tools' },
  { name: 'Image Tools Hub', path: '/tools/image' },
  { name: 'PDF Tools Hub', path: '/tools/pdf' },
  { name: 'Text & AI Tools Hub', path: '/tools/text-ai' },
  { name: 'Premium Tools Hub', path: '/premium' },
  // Legal Pages
  { name: 'Privacy Policy', path: '/privacy-policy' },
  { name: 'Terms of Service', path: '/terms-of-service' },
  { name: 'Cookie Policy', path: '/cookie-policy' },
  { name: 'Help Center', path: '/help-center' },
  { name: 'Disclaimer', path: '/disclaimer' },
  // Blog
  { name: 'Blog', path: '/blog' },
];
