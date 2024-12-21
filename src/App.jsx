import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Miprimercomponente from './components/Componente'


export default function App() {
  return (
    <>
      <header>
        <div className='head'>
          <p className='schedule-maker'>Schedule Maker</p>
          <img className='logo-espol' src='https://media.discordapp.net/attachments/1305703712903397377/1319877981979545682/Espol_Logo_2023_pa.png?ex=67678fa9&is=67663e29&hm=8202d0c6193efb292fdaa64fabe061868833f3a14b6b8e960207fee3ff3f2ce2&=&format=webp&quality=lossless' />
          <img className='logo-taws' src='https://media.discordapp.net/attachments/1305703712903397377/1319889113658429553/logoTawsBig-DODSMUZz.png?ex=67679a07&is=67664887&hm=c0583bc290442da4547c9469e674aca9721ebf0e1ac93c10d87c726d1ba7731b&=&format=webp&quality=lossless&width=280&height=350'/>
          <div className='linea-amarilla'></div>
          <div className='bloque-azul'></div>
        </div>
      </header>
    </>


  )
}


