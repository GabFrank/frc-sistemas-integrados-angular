import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";

export interface DispositivoDetectado {
  clase: string;
  uri: string;
  nombre: string;
  descripcion: string;
}

/** Estado real de una cola CUPS (lpstat -p), distinto del flag `activo` de la BD. */
export interface ColaEstado {
  nombre: string;
  estado: "INACTIVA" | "IMPRIMIENDO" | "DESHABILITADA" | "DESCONOCIDA";
  razon: string;
  habilitada: boolean;
}

export type TipoImpresora = "TERMICA" | "NORMAL" | "ETIQUETA";
export type UsoImpresora = "TICKET" | "FACTURA" | "REPORTE" | "ETIQUETA" | "COMANDA";
export type TipoConexion = "CUPS" | "USB" | "RED" | "SMB" | "BLUETOOTH";
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
  /** Share de Windows (conexión SMB). Nunca incluye la contraseña. */
  smbHost: string;
  smbRecurso: string;
  smbUsuario: string;
  smbDominio: string;
  perfilPapel: PerfilPapel;
  columnas: number;
  anchoMm: number;
  altoMm: number;
  marca: string;
  codepage: string;
  /** true = ademas de vivir en `sucursal`, tiene una cola CUPS proxy (IPP) instalada en el
   * central via "compartir al central" (informativo; `sucursal` sigue siendo el host real). */
  compartidaEnCentral: boolean;
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
    input.smbHost = this?.smbHost;
    input.smbRecurso = this?.smbRecurso;
    input.smbUsuario = this?.smbUsuario;
    input.smbDominio = this?.smbDominio;
    input.perfilPapel = this?.perfilPapel;
    input.columnas = this?.columnas;
    input.anchoMm = this?.anchoMm;
    input.altoMm = this?.altoMm;
    input.marca = this?.marca;
    input.codepage = this?.codepage;
    input.compartidaEnCentral = this?.compartidaEnCentral;
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
  smbHost?: string;
  smbRecurso?: string;
  smbUsuario?: string;
  smbDominio?: string;
  perfilPapel?: PerfilPapel;
  columnas?: number;
  anchoMm?: number;
  altoMm?: number;
  marca?: string;
  codepage?: string;
  compartidaEnCentral?: boolean;
  usuarioId?: number = null;
}
