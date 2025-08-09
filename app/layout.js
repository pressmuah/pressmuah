import '../styles/globals.css'
export const metadata = { title:'PressMuah', description:'Custom e‑commerce with Edit Mode' }
export default function RootLayout({ children }){
  return (<html lang="en"><body className="min-h-screen antialiased">{children}</body></html>)
}
