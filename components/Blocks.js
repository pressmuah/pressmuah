
'use client'
import { useEditor } from './EditorContext'
import { useState } from 'react'

function Editable({label, value, onChange, type='text', multiline=false}){
  return (
    <label className="block text-xs mb-2">
      <span className="block mb-1 text-black/60">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={e=>onChange(e.target.value)} className="w-full border rounded p-2 text-sm min-h-[80px]"/>
      ) : (
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full border rounded p-2 text-sm"/>
      )}
    </label>
  )
}

export function BlockShell({block, children, moveUp, moveDown, remove}){
  const { edit } = useEditor()
  return (
    <div className="relative group">
      {edit && (
        <div className="absolute -top-3 left-0 flex gap-2">
          <span className="pm-badge">Block: {block.type}</span>
          <button className="pm-badge" onClick={moveUp}>↑</button>
          <button className="pm-badge" onClick={moveDown}>↓</button>
          <button className="pm-badge bg-red-600" onClick={remove}>Delete</button>
        </div>
      )}
      {children}
    </div>
  )
}

export function Hero({block, update, moveUp, moveDown, remove}){
  const { edit } = useEditor()
  return (
    <BlockShell block={block} moveUp={moveUp} moveDown={moveDown} remove={remove}>
      <section className="relative min-h-[60vh] grid place-items-center text-center overflow-hidden" style={{backgroundImage:block.bg, backgroundSize:'cover', backgroundPosition:'center'}}>
        {block.overlay && <div className="absolute inset-0 bg-black/30" />}
        <div className="relative z-10 max-w-3xl px-6 py-16">
          <h1 className="text-4xl md:text-6xl font-semibold mb-4">{block.title}</h1>
          <p className="text-lg md:text-xl opacity-80 mb-6">{block.subtitle}</p>
          <a href={block.ctaHref} className="inline-block px-6 py-3 rounded-full border border-black hover:-translate-y-0.5 transition">{block.ctaText}</a>
        </div>
        {edit && (
          <div className="absolute right-4 bottom-4 w-72 bg-white p-3 rounded shadow border">
            <Editable label="Title" value={block.title} onChange={v=>update({...block, title:v})}/>
            <Editable label="Subtitle" value={block.subtitle} onChange={v=>update({...block, subtitle:v})}/>
            <Editable label="CTA Text" value={block.ctaText} onChange={v=>update({...block, ctaText:v})}/>
            <Editable label="CTA Link" value={block.ctaHref} onChange={v=>update({...block, ctaHref:v})}/>
            <Editable label="Background (CSS url(...))" value={block.bg} onChange={v=>update({...block, bg:v})}/>
            <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={block.overlay} onChange={e=>update({...block, overlay:e.target.checked})}/> Overlay</label>
          </div>
        )}
      </section>
    </BlockShell>
  )
}

export function Newsletter({block, update, moveUp, moveDown, remove}){
  const { edit } = useEditor()
  const [sent, setSent] = useState(false)
  const submit = (e)=>{ e.preventDefault(); setSent(true) }
  return (
    <BlockShell block={block} moveUp={moveUp} moveDown={moveDown} remove={remove}>
      <section className="px-6 py-16">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-2">{block.title}</h2>
          <p className="opacity-80 mb-6">{block.subtitle}</p>
          {sent ? (
            <p className="text-green-600">{block.successText || 'Thank you!'}</p>
          ) : (
            <form name="newsletter" method="POST" data-netlify="true" onSubmit={submit} className="flex gap-2 justify-center">
              <input type="hidden" name="form-name" value="newsletter" />
              <input name="email" required placeholder="your@email.com" className="border rounded px-3 py-2 w-64"/>
              <button className="border rounded px-4 py-2">Join</button>
            </form>
          )}
        </div>
        {edit && (
          <div className="fixed right-4 top-24 w-80 bg-white p-3 rounded shadow border">
            <Editable label="Title" value={block.title} onChange={v=>update({...block, title:v})}/>
            <Editable label="Subtitle" value={block.subtitle} onChange={v=>update({...block, subtitle:v})}/>
            <Editable label="Success Text" value={block.successText} onChange={v=>update({...block, successText:v})}/>
          </div>
        )}
      </section>
    </BlockShell>
  )
}

export function ProductGrid({block, update, moveUp, moveDown, remove}){
  const { edit } = useEditor()
  const addP = () => update({...block, products:[...block.products, {id:'p'+Math.random().toString(36).slice(2,6), name:'New', price:20, stock:1, image:'', buyUrl:'#'}]})
  const upd = (i,p)=>{ const arr=[...block.products]; arr[i]=p; update({...block, products:arr}) }
  const del = (i)=> update({...block, products:block.products.filter((_,idx)=>idx!==i)})
  return (
    <BlockShell block={block} moveUp={moveUp} moveDown={moveDown} remove={remove}>
      <section id="shop" className="px-6 py-12 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">{block.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {block.products.map((p, i)=>(
            <div key={p.id} className="border rounded-lg overflow-hidden shadow-sm">
              {p.image ? <img src={p.image} alt={p.name} className="w-full h-56 object-cover"/> : <div className="w-full h-56 grid place-items-center bg-black/5 text-black/50">No image</div>}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{p.name}</h3>
                  <span>€{p.price}</span>
                </div>
                <p className="text-xs opacity-70 mb-3">{p.stock>0 ? `Only ${p.stock} left` : 'Out of stock'}</p>
                <a href={p.buyUrl} className={"block text-center px-3 py-2 border rounded " + (p.stock>0 ? 'opacity-100' : 'opacity-50 pointer-events-none')}>Buy Now</a>
              </div>
              {edit && (
                <div className="p-3 border-t bg-white">
                  <Editable label="Name" value={p.name} onChange={v=>upd(i, {...p,name:v})}/>
                  <Editable label="Price" value={String(p.price)} onChange={v=>upd(i, {...p,price:parseFloat(v)||0})}/>
                  <Editable label="Stock" value={String(p.stock)} onChange={v=>upd(i, {...p,stock:parseInt(v)||0})}/>
                  <Editable label="Image URL" value={p.image} onChange={v=>upd(i, {...p,image:v})}/>
                  <Editable label="Buy URL (Stripe/PayPal)" value={p.buyUrl} onChange={v=>upd(i, {...p,buyUrl:v})}/>
                  <button onClick={()=>del(i)} className="mt-2 text-xs px-2 py-1 border rounded">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {edit && <button onClick={addP} className="mt-4 border rounded px-3 py-2">+ Add product</button>}
      </section>
    </BlockShell>
  )
}

export default function Blocks({blocks, setBlocks}){
  const move = (i,dir)=>{
    const arr=[...blocks]; const j = dir==='up'? i-1 : i+1
    if(j<0||j>=arr.length) return; const t=arr[i]; arr[i]=arr[j]; arr[j]=t; setBlocks(arr)
  }
  const remove = (i)=> setBlocks(blocks.filter((_,idx)=>idx!==i))
  const update = (i,b)=>{ const arr=[...blocks]; arr[i]=b; setBlocks(arr) }
  return blocks.map((b,i)=>{
    const props={block:b, update:(nb)=>update(i,nb), moveUp:()=>move(i,'up'), moveDown:()=>move(i,'down'), remove:()=>remove(i)}
    if(b.type==='hero') return <Hero key={b.id} {...props} />
    if(b.type==='newsletter') return <Newsletter key={b.id} {...props} />
    if(b.type==='productgrid') return <ProductGrid key={b.id} {...props} />
    return <div key={b.id} className="p-6">Unknown block</div>
  })
}
