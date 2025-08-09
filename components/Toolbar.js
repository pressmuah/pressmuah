'use client'
import { useEditor } from './EditorContext'
export default function Toolbar(){
  const { data, setData, edit, setEdit } = useEditor()
  const addBlock = (type)=>{
    const id = type + Math.random().toString(36).slice(2,7)
    const nb = type==='hero'?{type,id,title:'New Hero',subtitle:'Subtitle',ctaText:'Shop',ctaHref:'#',bg:'none',overlay:false}:
              type==='richtext'?{type,id,html:'<p>Edit this text</p>'}:
              {type:'productgrid',id,title:'Products',products:[]}
    setData({...data, blocks:[...data.blocks, nb]})
  }
  const exportJSON = ()=>{ const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='pressmuah.json'; a.click(); URL.revokeObjectURL(url) }
  const importJSON = async (e)=>{ const f=e.target.files?.[0]; if(!f) return; const text=await f.text(); try{ setData(JSON.parse(text)) }catch{ alert('Invalid JSON') } }
  return (
    <div className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border shadow rounded-full px-3 py-2 flex items-center gap-2 pm-toolbar">
      <button onClick={()=>setEdit(!edit)} className="border">{edit?'Exit Edit':'Edit Mode'}</button>
      <div className="h-5 w-px bg-black/20 mx-1" />
      <button onClick={()=>addBlock('hero')} className="border">+ Hero</button>
      <button onClick={()=>addBlock('richtext')} className="border">+ Text</button>
      <button onClick={()=>addBlock('productgrid')} className="border">+ Products</button>
      <div className="h-5 w-px bg-black/20 mx-1" />
      <button onClick={exportJSON} className="border">Export</button>
      <label className="border cursor-pointer px-3 py-1 rounded">Import<input type="file" accept="application/json" className="hidden" onChange={importJSON}/></label>
    </div>
  )
}
