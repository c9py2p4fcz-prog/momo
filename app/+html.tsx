import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="bg">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, maximum-scale=1, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Momo" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="theme-color" content="#000000" />
        <meta name="format-detection" content="telephone=no" />
        <title>Momo - Лични финанси</title>

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
@font-face {
  font-family: 'ionicons';
  src: url('/assets/fonts/Ionicons.ttf') format('truetype');
  font-display: swap;
}
@font-face {
  font-family: 'Ionicons';
  src: url('/assets/fonts/Ionicons.ttf') format('truetype');
  font-display: swap;
}
html, body {
  background-color: #000000;
  color: #FFFFFF;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
@media (prefers-color-scheme: dark) {
  html, body {
    background-color: #000;
  }
}`;
