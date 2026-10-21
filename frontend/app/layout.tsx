import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../app/saas.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthAvailability } from "./components/auth-availability";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inference — Orchestration and evaluated insights",
  description:
    "Bring your query, code, and documentation to an AI orchestration platform with independent evaluation. Integrate from Python or TypeScript.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const authEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <AuthAvailability enabled={authEnabled}>
          {authEnabled ? (
            <ClerkProvider
              dynamic={false}
              appearance={{
                variables: {
                  colorPrimary: "#5260ff",
                  colorBackground: "#222832",
                  colorForeground: "#d7e1f5",
                  colorMutedForeground: "#a0aaba",
                  colorInput: "#191d24",
                  colorInputForeground: "#d7e1f5",
                  colorNeutral: "#ffffff",
                  borderRadius: "6px",
                },
              }}
            >
              {children}
            </ClerkProvider>
          ) : (
            children
          )}
        </AuthAvailability>
      </body>
    </html>
  );
}
