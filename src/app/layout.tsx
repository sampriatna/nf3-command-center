import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NF3 Command Center",
  description: "Pusat kendali operasional NF3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
