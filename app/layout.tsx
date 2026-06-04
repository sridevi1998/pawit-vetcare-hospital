import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawIt VetCare Hospital",
  description: "Veterinary hospital management portal",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const configScript = `window.__PAWIT_CONFIG__ = ${JSON.stringify({
    apiBaseUrl: process.env.NEXT_PUBLIC_PAWIT_API_BASE_URL ?? "",
    role: process.env.NEXT_PUBLIC_PAWIT_ROLE ?? "",
    tenantId: process.env.NEXT_PUBLIC_PAWIT_TENANT_ID ?? "",
    userId: process.env.NEXT_PUBLIC_PAWIT_USER_ID ?? "",
  }).replace(/</g, "\\u003c")};`;

  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: configScript }} />
        {children}
      </body>
    </html>
  );
}
