import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "RestEaz - Restaurant Management",
  description: "Restaurant management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="bg-gray-900 text-white p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">RestEaz</Link>
            <div className="flex gap-4">
              <Link href="/" className="hover:text-gray-300">Home</Link>
              <Link href="/admin/tables" className="hover:text-gray-300">Admin Tables</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
