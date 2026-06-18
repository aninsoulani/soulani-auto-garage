import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Instrument_Sans, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtreeHeading = Figtree({subsets:['latin'],variable:'--font-heading'});

const instrumentSans = Instrument_Sans({subsets:['latin'],variable:'--font-sans'});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Soulani Auto Garage",
  description: "Premium Used Cars Sales & Rental Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", instrumentSans.variable, figtreeHeading.variable)}>
      <body
        className={`${jakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
