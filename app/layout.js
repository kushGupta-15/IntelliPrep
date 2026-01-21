import { Outfit } from 'next/font/google'
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Provider from './Provider';
import { Toaster } from '../components/ui/sonner'

const outfit = Outfit({ subsets: ['latin'] });

export const metadata = {
  title: "IntelliPrep",
  description: "A AI Notes Generation Website",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={outfit.className}
        >
          <Provider>
            {children}
          </Provider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
