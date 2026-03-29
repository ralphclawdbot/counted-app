import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Counted — Your Life, Counted.',
  description: 'Visualize your life as a grid of dots and get an auto-updating iPhone lock screen wallpaper.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e5e5e5;
            min-height: 100vh;
          }
          input, select, button, textarea {
            font-family: inherit;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
