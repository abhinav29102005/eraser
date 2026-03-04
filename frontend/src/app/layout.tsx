'use client';

import { Toaster } from 'react-hot-toast';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="LUMO – Real-time collaborative diagramming and whiteboarding" />
        <title>LUMO</title>
        <link rel="icon" href="/image.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-[Inter] bg-surface-950 text-surface-200">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#252830',
              color: '#e2e8f0',
              border: '1px solid #2d3140',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
