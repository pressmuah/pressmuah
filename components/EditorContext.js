
'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const EditorCtx = createContext(null)
const DEFAULT_DATA = {
  "theme": {
    "bg": "255 253 250",
    "fg": "17 17 17",
    "accent": "236 72 153"
  },
  "blocks": [
    {
      "type": "hero",
      "id": "hero1",
      "title": "PressMuah \u2014 Nostalgic Nails, Cinematic Vibe",
      "subtitle": "Hand\u2011crafted press\u2011on sets for everyday main\u2011character energy.",
      "ctaText": "Shop now",
      "ctaHref": "#shop",
      "bg": "url(https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1200)",
      "overlay": true
    },
    {
      "type": "newsletter",
      "id": "nl1",
      "title": "Join the list",
      "subtitle": "Get drops first + surprise perks.",
      "successText": "Thank you \u2014 you\u2019re on the list!"
    },
    {
      "type": "productgrid",
      "id": "pg1",
      "title": "Featured Sets",
      "products": [
        {
          "id": "p1",
          "name": "Candy Pop Pink (Almond)",
          "price": 22,
          "stock": 8,
          "image": "https://images.unsplash.com/photo-1604654894611-6a164aa3d433?q=80&w=800",
          "buyUrl": "https://buy.stripe.com/test_12345"
        },
        {
          "id": "p2",
          "name": "Milky Latte Glow (Square)",
          "price": 24,
          "stock": 5,
          "image": "https://images.unsplash.com/photo-1585849833952-19b7c5e7b1b6?q=80&w=800",
          "buyUrl": "https://www.paypal.com/checkoutnow?token=TEST"
        }
      ]
    }
  ]
}

function load() {
  try {
    const raw = localStorage.getItem('pm_data_next')
    return raw ? JSON.parse(raw) : DEFAULT_DATA
  } catch { return DEFAULT_DATA }
}

export function EditorProvider({ children }) {
  const [data, setData] = useState(DEFAULT_DATA)
  const [edit, setEdit] = useState(false)
  useEffect(()=>{ setData(load()) },[])
  useEffect(()=>{
    localStorage.setItem('pm_data_next', JSON.stringify(data))
    const s = document.documentElement.style
    s.setProperty('--pm-bg', data.theme.bg)
    s.setProperty('--pm-fg', data.theme.fg)
    s.setProperty('--pm-accent', data.theme.accent)
  },[data])
  const value = useMemo(()=>({data,setData,edit,setEdit}),[data,edit])
  return <EditorCtx.Provider value={value}>{children}</EditorCtx.Provider>
}
export const useEditor = () => useContext(EditorCtx)
