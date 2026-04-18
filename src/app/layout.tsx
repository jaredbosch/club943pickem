import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Club 943 Pick'em",
  description: "NFL ATS confidence pick'em for private leagues.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={dmSans.variable}>
        <body className="bg-bg text-text font-sans min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
