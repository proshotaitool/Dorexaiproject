
import Link from 'next/link';
import { Icons } from '@/components/icons';

const footerLinks = {
  Tools: [
    { href: '/tools/image', label: 'Image Tools' },
    { href: '/tools/pdf', label: 'PDF Tools' },
    { href: '/tools/text-ai', label: 'AI Tools' },
  ],
  Company: [
    { href: '/about', label: 'About Us' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ],
  Legal: [
    { href: '/terms-of-service', label: 'Terms of Service' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/cookie-policy', label: 'Cookie Policy' },
    { href: '/disclaimer', label: 'Disclaimer' },
  ],
  Resources: [
    { href: '/help-center', label: 'Help Center' },
    { href: '/pricing', label: 'Pricing' },
  ],
};

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">DoreX Ai</span>
            </Link>
            <p className="mt-4 text-muted-foreground">The Ultimate Toolkit for Your Digital Files.</p>
          </div>
          <div className="md:col-span-3 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="font-semibold">{title}</h4>
                <ul className="mt-4 space-y-2">
                  {links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} DoreX Ai. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
