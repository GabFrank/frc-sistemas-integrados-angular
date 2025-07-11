import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Pedido } from "../edit-pedido/pedido.model";
import { ProcesoEtapaEstado, ProcesoEtapaTipo } from "./proceso-etapa.enum";

export class ProcesoEtapa {
    id: number;
    pedido: Pedido;
    tipoEtapa: ProcesoEtapaTipo;
    estadoEtapa: ProcesoEtapaEstado;
    fechaInicio: Date;
    fechaFin: Date;
    usuarioInicio: Usuario;
    creadoEn: Date;
} 