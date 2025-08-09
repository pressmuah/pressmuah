'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
const EditorCtx = createContext(null)
const DEFAULT_DATA = {"theme": {"bg": "255 253 250", "fg": "18 18 18", "accent": "236 72 153", "fontHead": "serif", "fontBody": "system-ui"}, "blocks": [{"type": "hero", "id": "hero1", "title": "PressMuah \u2014 Nostalgic Nails, Cinematic Vibe", "subtitle": "Hand\u2011crafted press\u2011on sets for everyday main\u2011character energy.", "ctaText": "Shop now", "ctaHref": "#shop", "bg": "url(https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1200)", "overlay": true}, {"type": "richtext", "id": "rt1", "html": "<p>Every set is a mini artwork. Swap styles in minutes, no appointment needed.</p>"}, {"type": "productgrid", "id": "pg1", "title": "Featured Sets", "products": [{"id": "p1", "name": "Candy Pop Pink (Almond)", "price": 22.0, "image": "https://images.unsplash.com/photo-1604654894611-6a164aa3d433?q=80&w=800", "buyUrl": "https://buy.stripe.com/test_12345"}, {"id": "p2", "name": "Milky Latte Glow (Square)", "price": 24.0, "image": "https://images.unsplash.com/photo-1585849833952-19b7c5e7b1b6?q=80&w=800", "buyUrl": "https://www.paypal.com/checkoutnow?token=TEST"}]}]}
function loadData(){ try{ const raw = localStorage.getItem('pm_data'); return raw?JSON.parse(raw):DEFAULT_DATA }catch(e){ return DEFAULT_DATA } }
export function EditorProvider({ children }){
  const [data, setData] = useState(DEFAULT_DATA); const [edit, setEdit] = useState(false)
  useEffect(()=>{ setData(loadData()) },[])
  useEffect(()=>{
    localStorage.setItem('pm_data', JSON.stringify(data));
    const root = document.documentElement.style;
    root.setProperty('--pm-bg', data.theme.bg);
    root.setProperty('--pm-fg', data.theme.fg);
    root.setProperty('--pm-accent', data.theme.accent);
  },[data])
  const value = useMemo(()=>({ data, setData, edit, setEdit }),[data,edit])
  return <EditorCtx.Provider value={value}>{children}</EditorCtx.Provider>
}
export function useEditor(){ const ctx = useContext(EditorCtx); if(!ctx) throw new Error('useEditor must be used within EditorProvider'); return ctx; }
