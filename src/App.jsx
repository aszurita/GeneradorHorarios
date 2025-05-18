import Calendar from "./components/HorarioSemanal";
import ControladorListaDesplegable from "./components/ControladorListaDesplegable";
import Boton from "./components/Boton";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import Malla from "./components/Malla";
import FiecMallas from "./assets/Data/FiecMallas_actualizado.json";

export default function App() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between h-16 bg-gray-100 relative">
          <div className="flex items-center">
            <img
              className="w-[125px] h-[45px] opacity-50 ml-4"
              src="https://media.discordapp.net/attachments/1305703712903397377/1319877981979545682/Espol_Logo_2023_pa.png?ex=67678fa9&is=67663e29&hm=8202d0c6193efb292fdaa64fabe061868833f3a14b6b8e960207fee3ff3f2ce2&=&format=webp&quality=lossless"
              alt="Logo Espol"
            />
            <p className="text-[#787878] text-lg mt-3 font-sans">Schedule Maker</p>
          </div>
          <img
            className="w-[60px] h-[60px] mr-4"
            src="https://media.discordapp.net/attachments/1305703712903397377/1319889113658429553/logoTawsBig-DODSMUZz.png?ex=67679a07&is=67664887&hm=c0583bc290442da4547c9469e674aca9721ebf0e1ac93c10d87c726d1ba7731b&=&format=webp&quality=lossless&width=280&height=350"
            alt="Logo Taws"
          />
        </div>
        <div className="w-full h-[4px] bg-[#FAB900]"></div>
        <div className="w-full h-[26px] bg-[#001C43]"></div>
      </div>
      <div className="flex w-full place-content-center">
        <Malla materias={Fiec[4].materias} />
      </div>
    </div>
  )
}
