import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Midwest Waste — Roll-Off Dumpster Rental | Fox Valley, IL",
  description:
    "Order a 10, 15, 20, or 30 yard roll-off dumpster online in the Illinois Fox Valley — Aurora, Sugar Grove, Batavia, St. Charles, Naperville & nearby. Flat-rate pricing, fast local delivery. Family-owned, 30 years strong.",
  keywords: [
    "dumpster rental Fox Valley",
    "roll-off dumpster Aurora IL",
    "dumpster rental Sugar Grove",
    "dumpster rental Batavia IL",
    "dumpster rental Naperville",
    "10 yard dumpster",
    "20 yard dumpster rental",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
