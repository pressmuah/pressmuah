
import '../styles/globals.css'
import GAClient from './ga/GAClient'

export const metadata = { title:'PressMuah', description:'Custom e‑commerce with live Edit Mode' }

export default function RootLayout({ children }){
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <GAClient />
        {children}
      </body>
    </html>
  )
}
