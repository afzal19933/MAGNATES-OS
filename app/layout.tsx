import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "BNI OS",
  description: "BNI Chapter Operations System",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}