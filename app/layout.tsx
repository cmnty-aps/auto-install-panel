import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "PteroPilot — Pterodactyl Installer",
  description: "Panel web interaktif untuk instalasi dan maintenance Pterodactyl VPS.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>
}
