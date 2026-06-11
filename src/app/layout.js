import "./globals.css";

export const metadata = {
  title: "Smart Asset Management & Resource Allocation Platform",
  description: "Centralized resource booking and inventory tracking platform for shared organizational assets.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg-primary)" }}>{children}</body>
    </html>
  );
}
