interface IBotao{
     nome: string,
     estilo: keyof typeof estilos,
     onClick: ()=>void
}

const estilos = {
     deletar: "bg-red-500 hover:bg-red-400 text-white font-bold",
     confirmar: "bg-green-500 hover:bg-green-400 text-white font-bold"
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