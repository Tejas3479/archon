import React from "react";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";

import "../css/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <main className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans`}>
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  );
}
