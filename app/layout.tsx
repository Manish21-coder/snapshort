// app/layout.tsx
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!} // mandatory
    >
      <html lang="en">
        <body className="bg-black">
          <Navbar />
          <main className="px-6 pt-6">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}