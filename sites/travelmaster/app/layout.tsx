import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"TravelMaster",description:"旅行行程、记账和预订管理"};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="zh-CN"><body>{children}</body></html>}
