import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Pacewell Tracker",
  description: "Dynamic calorie tracking with real-time weight-based calculations",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
