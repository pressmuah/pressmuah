
'use client'
import { EditorProvider, useEditor } from '../components/EditorContext'
import Toolbar from '../components/Toolbar'
import Blocks from '../components/Blocks'

function Shell(){
  const { data, setData } = useEditor()
  return (
    <div>
      <header className="px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-semibold tracking-wide">PressMuah</a>
        <nav className="flex items-center gap-6 text-sm opacity-80">
          <a href="#shop">Shop</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <Blocks blocks={data.blocks} setBlocks={(b)=>setData({...data, blocks:b})} />
      <footer className="px-6 py-12 border-t mt-12" id="about">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-medium mb-2">PressMuah</h4>
            <p className="text-sm opacity-80">Nostalgic, cinematic press‑on nails, made with love.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Policies</h4>
            <ul className="text-sm opacity-80 space-y-1">
              <li><a href="#">Shipping</a></li>
              <li><a href="#">Returns</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
          </div>
          <div id="contact">
            <h4 className="font-medium mb-2">Contact</h4>
            <p className="text-sm opacity-80">pressmuah@gmail.com</p>
          </div>
        </div>
      </footer>
      <Toolbar />
    </div>
  )
}

export default function Page(){
  return (
    <EditorProvider>
      <Shell />
    </EditorProvider>
  )
}
