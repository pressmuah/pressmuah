'use client'
import { useEditor } from './EditorContext'
import { useState } from 'react'

function Editable({label, value, onChange, multiline=false}){
  const [v,setV]=useState(value??'')
  return (<label className="block text-xs mb-2"><span className="block mb-1 text-black/60">{label}</span>
    {multiline?<textarea value={v} onChange={e=>{setV(e.target.value);onChange(e.target.value)}} className="w-full border rounded p-2 text-sm min-h-[80px]"/>:
    <input value={v} onChange={e=>{setV(e.target.value);onChange(e.target.value)}} className="w-full border rounded p-2 text-sm"/>}
  </label>)
}

export function BlockChrome({block, children, moveUp, moveDown, remove, edit}){
  if(!edit) return children
  return (<div className="relative group">
    <div className="absolute -top-3 left-0 flex gap-2 opacity-90">
      <span className="pm-badge">Block: {block.type}</span>
      <button onClick={moveUp} className="pm-badge">↑</button>
      <button onClick={moveDown} className="pm-badge">↓</button>
      <button onClick={remove} className="pm-badge bg-red-600">Delete</button>
    </div>{children}</div>)
}

function Hero({block, update, moveUp, moveDown, remove}){
  const { edit } = useEditor()
  return (
    <BlockChrome block={block} moveUp={moveUp} moveDown={moveDown} remove={remove} edit={edit}>
      <section className="relative min-h-[60vh] grid place-items-center text-center overflow-hidden" style={{backgroundImage:block.bg, backgroundSize:'cover', backgroundPosition:'center'}}>
        {block.overlay && <div className="absolute inset-0 bg-black/30" />}
        <div className="relative z-10 max-w-3xl px-6 py-16">
          <h1 className="text-4xl md:text-6xl font-semibold mb-4">{block.title}</h1>
          <p className="text-lg md:text-xl opacity-80 mb-6">{block.subtitle}</p>
          <a href={block.ctaHref} className="inline-block px-6 py-3 rounded-full border border-black hover:-translate-y-0.5 transition">{block.ctaText}</a>
        </div>
        {edit && (<div className="absolute right-4 bottom-4 w-72 bg-white p-3 rounded shadow border">
          <Editable label="Title" value={block.title} onChange={v=>update({...block,title:v})}/>
          <Editable label="Subtitle" value={block.subtitle} onChange={v=>update({...block,subtitle:v})}/>
          <Editable label="CTA Text" value={block.ctaText} onChange={v=>update({...block,ctaText:v})}/>
          <Editable label="CTA Link" value={block.ctaHref} onChange={v=>update({...block,ctaHref:v})}/>
          <Editable label="Background CSS (url(...))" value={block.bg} onChange={v=>update({...block,bg:v})}/>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={block.overlay} onChange={e=>update({...block,overlay:e.target.checked})}/> Overlay</label>
        </div>)}
      </section>
    </BlockChrome>
  )
}

function RichText({block, update, moveUp, moveDown, remove}){
  const { edit } = useEditor()
  return (
    <BlockChrome block={block} moveUp={moveUp} moveDown={moveDown} remove={remove} edit={edit}>
      <section className="px-6 py-12 max-w-3xl mx-auto prose" dangerouslySetInnerHTML={{__html:block.html}} />
      {edit && (<div className="fixed right-4 top-24 w-80 bg-white p-3 rounded shadow border"><textarea value={block.html} onChange={e=>update({...block,html:e.target.value})} className="w-full border rounded p-2 text-sm min-h-[200px]"/></div>)}
    </BlockChrome>
  )
}

function ProductGrid({block, update, moveUp, moveDown, remove}){
  const { edit } = useEditor()
  const addProduct=()=>{ const p={id:'p'+Math.random().toString(36).slice(2,6),name:'New Product',price:20,image:'',buyUrl:'#'}; update({...block,products:[...block.products,p]}) }
  const updateProd=(idx,p)=>{ const arr=[...block.products]; arr[idx]=p; update({...block,products:arr}) }
  const removeProd=(idx)=>{ update({...block,products:block.products.filter((_,i)=>i!==idx)}) }
  return (
    <BlockChrome block={block} moveUp={moveUp} moveDown={moveDown} remove={remove} edit={edit}>
      <section id="shop" className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">{block.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {block.products.map((p,idx)=>(
            <div key={p.id} className="border rounded-lg overflow-hidden shadow-sm">
              {p.image ? <img src={p.image} alt={p.name} className="w-full h-56 object-cover"/> : <div className="w-full h-56 grid place-items-center bg-black/5 text-black/50">No image</div>}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3"><h3 className="font-medium">{p.name}</h3><span>€{p.price}</span></div>
                <div className="flex gap-2"><a href={p.buyUrl} className="flex-1 border rounded px-3 py-2 text-center">Buy Now</a></div>
              </div>
              {edit && (<div className="p-3 border-t bg-white">
                <Editable label="Name" value={p.name} onChange={v=>updateProd(idx,{...p,name:v})}/>
                <Editable label="Price (number)" value={String(p.price)} onChange={v=>updateProd(idx,{...p,price:parseFloat(v)||0})}/>
                <Editable label="Image URL" value={p.image} onChange={v=>updateProd(idx,{...p,image:v})}/>
                <Editable label="Buy URL (Stripe or PayPal)" value={p.buyUrl} onChange={v=>updateProd(idx,{...p,buyUrl:v})}/>
                <button onClick={()=>removeProd(idx)} className="mt-2 text-xs px-2 py-1 border rounded">Delete product</button>
              </div>)}
            </div>
          ))}
        </div>
        {edit && <button onClick={addProduct} className="mt-4 border rounded px-3 py-2">+ Add product</button>}
      </section>
    </BlockChrome>
  )
}

export default function Blocks({blocks, setBlocks}){
  const move=(i,dir)=>{ const arr=[...blocks]; const j=dir==='up'?i-1:i+1; if(j<0||j>=arr.length) return; const t=arr[i]; arr[i]=arr[j]; arr[j]=t; setBlocks(arr) }
  const remove=(i)=> setBlocks(blocks.filter((_,idx)=>idx!==i))
  const update=(i,b)=>{ const arr=[...blocks]; arr[i]=b; setBlocks(arr) }
  return (<div>
    {blocks.map((b,i)=>{
      const props={block:b,update:(nb)=>update(i,nb),moveUp:()=>move(i,'up'),moveDown:()=>move(i,'down'),remove:()=>remove(i)}
      if(b.type==='hero') return <Hero key={b.id} {...props}/>
      if(b.type==='richtext') return <RichText key={b.id} {...props}/>
      if(b.type==='productgrid') return <ProductGrid key={b.id} {...props}/>
      return <div key={b.id} className="p-6">Unknown block</div>
    })}
  </div>)
}
