import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";

export interface DispositivoDetectado {
  clase: string;
  uri: string;
  nombre: string;
  descripcion: string;
}

export type TipoImpresora = "TERMICA" | "NORMAL" | "ETIQUETA";
export type UsoImpresora = "TICKET" | "FACTURA" | "REPORTE" | "ETIQUETA" | "COMANDA";
export type TipoConexion = "CUPS" | "USB" | "RED" | "BLUETOOTH";
export type PerfilPapel = "MM_48" | "MM_58" | "MM_72" | "MM_80" | "A4" | "CARTA" | "CUSTOM";

export class Impresora {
  id: number;
  nombre: string;
  activo: boolean;
  esPredeterminada: boolean;
  sucursal: Sucursal;
  tipo: TipoImpresora;
  uso: UsoImpresora;
  conexion: TipoConexion;
  colaCups: string;
  ip: string;
  puerto: number;
  perfilPapel: PerfilPapel;
  columnas: number;
  anchoMm: number;
  altoMm: number;
  marca: string;
  codepage: string;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): ImpresoraInput {
    const input = new ImpresoraInput();
    input.id = this?.id;
    input.nombre = this?.nombre;
    input.activo = this?.activo;
    input.esPredeterminada = this?.esPredeterminada;
    input.sucursalId = this?.sucursal?.id;
    input.tipo = this?.tipo;
    input.uso = this?.uso;
    input.conexion = this?.conexion;
    input.colaCups = this?.colaCups;
    input.ip = this?.ip;
    input.puerto = this?.puerto;
    input.perfilPapel = this?.perfilPapel;
    input.columnas = this?.columnas;
    input.anchoMm = this?.anchoMm;
    input.altoMm = this?.altoMm;
    input.marca = this?.marca;
    input.codepage = this?.codepage;
    return input;
  }
}

export class ImpresoraInput {
  id?: number;
  nombre?: string;
  activo?: boolean;
  esPredeterminada?: boolean;
  sucursalId?: number;
  tipo?: TipoImpresora;
  uso?: UsoImpresora;
  conexion?: TipoConexion;
  colaCups?: string;
  ip?: string;
  puerto?: number;
  perfilPapel?: PerfilPapel;
  columnas?: number;
  anchoMm?: number;
  altoMm?: number;
  marca?: string;
  codepage?: string;
  usuarioId?: number = null;
}
