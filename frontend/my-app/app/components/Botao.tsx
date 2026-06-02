interface IBotao{
     nome: string,
     estilo: keyof typeof estilos,
     onClick: ()=>void
}

const estilos = {
     deletar: "bg-rose-600 hover:bg-rose-500 text-white font-bold",
     confirmar: "bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
}

export default function Botao({nome, estilo, onClick}:IBotao){

     const estiloAtivo = estilos[estilo]

     return(
          <input
          type="submit"
          value = {nome}
          onClick = {onClick}
          className={`rounded-md shadow-md px-4 py-2 cursor-pointer ${estiloAtivo}`}
          />
     )
}