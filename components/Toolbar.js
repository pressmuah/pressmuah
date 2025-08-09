
'use client'
import { useEditor } from './EditorContext'

export default function Toolbar(){
  const { data, setData, edit, setEdit } = useEditor()
  const add = (type) => {
    const id = type + Math.random().toString(36).slice(2,7)
    const block = type==='hero' ? {type,id,title:'New Hero',subtitle:'',ctaText:'Shop',ctaHref:'#',bg:'none',overlay:false}
      : type==='newsletter' ? {type,id,title:'Join the list',subtitle:'Get drops first.',successText:'Thanks!'} 
      : {type:'productgrid',id,title:'Products',products:[]}
    setData({...data, blocks:[...data.blocks, block]})
  }
  const exp = () => {
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'})
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='pressmuah.json'; a.click(); URL.revokeObjectURL(url)
  }
  const imp = async (e) => {
    const f = e.target.files?.[0]; if(!f) return; const t = await f.text()
    try { setData(JSON.parse(t)) } catch { alert('Invalid JSON') }
  }
  return (
    <div className="pm-pill flex items-center gap-2 z-50">
      <button className="border rounded px-3 py-1" onClick={()=>setEdit(!edit)}>{edit?'Exit Edit':'Edit Mode'}</button>
      <span className="mx-1 h-5 w-px bg-black/20"></span>
      <button className="border rounded px-3 py-1" onClick={()=>add('hero')}>+ Hero</button>
      <button className="border rounded px-3 py-1" onClick={()=>add('newsletter')}>+ Newsletter</button>
      <button className="border rounded px-3 py-1" onClick={()=>add('productgrid')}>+ Products</button>
      <span className="mx-1 h-5 w-px bg-black/20"></span>
      <button className="border rounded px-3 py-1" onClick={exp}>Export</button>
      <label className="border rounded px-3 py-1 cursor-pointer">Import
        <input type="file" accept="application/json" className="hidden" onChange={imp} />
      </label>
    </div>
  )
}
