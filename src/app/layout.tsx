import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const plusJakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
    title: "LeadFlow CRM - Smart Lead Management",
    description: "A modern CRM portal for managing leads, tracking pipelines, and driving sales growth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={plusJakarta.variable} style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
