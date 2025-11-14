import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Condominios",
  description: "Sistema de administración de condominios",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AdminCondo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ReactQueryProvider>
          <SessionProvider>
            <ToastProvider>{children}</ToastProvider>
          </SessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
