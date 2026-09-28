import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";

/** Mismos valores que el enum ModoFacturacion del central (issue filial #127). */
export enum ModoFacturacion {
  TODAS = 'TODAS',
  INTERVALO = 'INTERVALO',
  A_PEDIDO = 'A_PEDIDO'
}

/**
 * Política de facturación automática del filial. `sucursal` null = política global; con valor,
 * el override de esa sucursal. Sin filas, cada filial usa su property facturaCountDown.
 */
export class ConfiguracionFacturacion {
  id: number;
  sucursal: Sucursal;
  modo: ModoFacturacion;
  ventasSinFactura: number;
  ventaTicketRespetaPolitica: boolean;
  /** false = el filial la ignora (la sucursal sigue a la global) pero conserva sus valores. */
  activo: boolean;
  /** Quién la modificó por última vez. El autor lo pone el central desde la sesión. */
  usuarioNickname: string;
  creadoEn: Date;
  modificadoEn: Date;

  toInput(): ConfiguracionFacturacionInput {
    let input = new ConfiguracionFacturacionInput();
    input.id = this?.id;
    input.sucursalId = this?.sucursal?.id ?? null;
    input.modo = this?.modo;
    input.ventasSinFactura = this?.ventasSinFactura;
    input.ventaTicketRespetaPolitica = this?.ventaTicketRespetaPolitica;
    input.activo = this?.activo;
    return input;
  }
}

export class ConfiguracionFacturacionInput {
  id?: number;
  sucursalId?: number;
  modo?: ModoFacturacion;
  ventasSinFactura?: number;
  ventaTicketRespetaPolitica?: boolean;
  /** true por defecto al crear; en una edición, sin valor conserva el que tenía. */
  activo?: boolean;
}

export enum AccionConfiguracionFacturacion {
  CREAR = 'CREAR',
  MODIFICAR = 'MODIFICAR',
  ACTIVAR = 'ACTIVAR',
  DESACTIVAR = 'DESACTIVAR',
  ELIMINAR = 'ELIMINAR'
}

/** Un cambio de la política: valores después del cambio; en ELIMINAR, los que tenía al borrarse. */
export class ConfiguracionFacturacionHistorial {
  id: number;
  configuracionId: number;
  sucursal: Sucursal;
  accion: AccionConfiguracionFacturacion;
  modo: ModoFacturacion;
  ventasSinFactura: number;
  ventaTicketRespetaPolitica: boolean;
  activo: boolean;
  usuarioNickname: string;
  creadoEn: Date;
}
