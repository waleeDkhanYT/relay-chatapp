import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Provider from "@/redux/provider";
import AuthInitializer from "@/components/auth/AuthInitializer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relay Chat App",
  description: "Connect with friends and family for free",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider>
          <AuthInitializer />
          {children}
        </Provider>
      </body>
    </html>
  );
}