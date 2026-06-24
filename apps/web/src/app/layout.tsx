import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoftLocker — AI Document Categorization",
  description:
    "Upload documents and let AI automatically categorize them into organized folders using OCR and keyword detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
