import Script from "next/script";

export const metadata = {
  title: "MBMChat • Your Campus. Your Chaos.",
  description: "Exclusively for MBM University, Jodhpur",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      </head>
      <body className="bg-[#05070d] text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}