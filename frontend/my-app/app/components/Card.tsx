interface ICard {
     title?: string,
     size: keyof typeof tamanhos,
     style: keyof typeof estilos,
     children?: React.ReactNode
}


const tamanhos = {
     sm: "w-[10vw] h-[15vw]"
} as const

const estilos = {
     white: "bg-white text-black",
     auto: "bg-auto",
     gray: "bg-gray-500"
} as const


export default function Card({title, size, style, children}:ICard){

     const tamanhoAtivo = tamanhos[size]
     const estiloAtivo = estilos[style]

     return(
          <div className={`rounded-xl shadow-md gap-4 ${tamanhoAtivo} ${estiloAtivo}`}>
               <h1 className="font-black">{title}</h1>
               {children}
          </div>
     )
}