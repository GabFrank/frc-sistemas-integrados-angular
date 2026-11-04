import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { PdvCaja } from "../pdv/caja/caja.model";
import { RetiroDetalle, RetiroDetalleInput } from "./retiro-detalle.model";

export class Retiro {
  id: number;
  responsable: Funcionario;
  estado: EstadoRetiro;
  observacion: String;
  cajaSalida: PdvCaja;
  cajaEntrada: PdvCaja;
  creadoEn: Date;
  usuario: Usuario;
  retiroDetalleList: RetiroDetalle[];
  retiroGs: number;
  retiroRs: number;
  retiroDs: number;
  sucursalId: number;
  /**
   * La query ya lo trae; estaba sin declarar y cada consumidor extendia el tipo.
   * Opcional: no todas las queries de retiro lo piden.
   */
  sucursal?: { nombre?: string };
  /** Caja mayor destino. Si esta seteada, el retiro ya fue enviado a tesoreria. */
  cajaVirtualId: number;
  /**
   * Marcador de que el poller de tesoreria ya lo acredito. Entre que se setea
   * cajaVirtualId y que se setea esto hay una ventana: el retiro esta enviado pero
   * todavia no impacto la caja.
   */
  movimientoCajaVirtualId: number;

  toInput(): RetiroInput {
    let input = new RetiroInput();
    input.id = this.id;
    input.responsableId = this.responsable?.id;
    input.cajaEntradaId = this.cajaEntrada?.id;
    input.cajaSalidaId = this.cajaSalida?.id;
    input.sucursalSalidaId = this.cajaSalida?.sucursalId;
    input.cajaEntradaId = this.cajaEntrada?.id;
    input.usuarioId = this.usuario?.id;
    input.estado = this.estado;
    input.observacion = this.observacion;
    input.creadoEn = this.creadoEn;
    input.retiroGs = this.retiroGs;
    input.retiroRs = this.retiroRs;
    input.retiroDs = this.retiroDs;
    input.sucursalId = this.sucursalId
    return input;
  }
  toDetalleInput(): RetiroDetalleInput[] {
    let retiroDetalleInputList: RetiroDetalleInput[] = [];
    this.retiroDetalleList.forEach((r) => {
      retiroDetalleInputList.push(r.toInput());
    });
    return retiroDetalleInputList;
  }
}

export class RetiroInput {
  id: number;
  responsableId: number;
  estado: EstadoRetiro;
  observacion: String;
  creadoEn: Date;
  usuarioId: number = null;
  cajaSalidaId: number;
  sucursalSalidaId: number;
  cajaEntradaId: number;
  retiroGs: number;
  retiroRs: number;
  retiroDs: number;
  sucursalId: number;
}

/** Lo que se pregunta al escanear o procesar un retiro cuya caja tiene otros pendientes. */
export const PREGUNTA_RETIROS_DE_LA_CAJA = '¿Quiere traer los demás retiros vinculados a esta caja?';

/** «200.000 Gs · 10 R$ · 5 US$»: los montos del retiro por moneda, sin las que están en cero. */
export function formatMontosRetiro(r: Retiro): string {
  const partes: string[] = [];
  if (r?.retiroGs) partes.push(`${Math.round(r.retiroGs).toLocaleString('es-PY')} Gs`);
  if (r?.retiroRs) partes.push(`${r.retiroRs.toLocaleString('es-PY')} R$`);
  if (r?.retiroDs) partes.push(`${r.retiroDs.toLocaleString('es-PY')} US$`);
  return partes.length ? partes.join(' · ') : '—';
}

// Enum de strings: GraphQL devuelve el estado como texto ("CONCLUIDO"), asi que un
// enum numerico nunca matcheaba al comparar. Mismo formato que VentaEstado.
export enum EstadoRetiro {
  EN_PROCESO = "EN_PROCESO",
  CONCLUIDO = "CONCLUIDO",
  NECESITA_VERIFICACION = "NECESITA_VERIFICACION",
  EN_VERIFICACION = "EN_VERIFICACION",
  VERIFICADO_CONCLUIDO_SIN_PROBLEMA = "VERIFICADO_CONCLUIDO_SIN_PROBLEMA",
  VERIFICADO_CONCLUIDO_CON_PROBLEMA = "VERIFICADO_CONCLUIDO_CON_PROBLEMA",
  CANCELADO = "CANCELADO",
}
