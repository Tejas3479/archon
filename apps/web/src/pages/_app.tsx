import React, { useEffect } from "react";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Lenis from "lenis";

import "../css/globals.css";

import Head from "next/head";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <SessionProvider session={session}>
      <Head>
        <link rel="icon" type="image/jpeg" href="/favicon.jpg" />
      </Head>
      <main className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans`}>
        <Component {...pageProps} />
        <Toaster 
          position="bottom-right" 
          toastOptions={{ 
            className: "!bg-bg-elevated !text-text-primary border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.3)] !font-mono !text-xs",
            success: { iconTheme: { primary: '#10b981', secondary: '#141e2e' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#141e2e' } }
          }} 
        />
      </main>
    </SessionProvider>
  );
}
