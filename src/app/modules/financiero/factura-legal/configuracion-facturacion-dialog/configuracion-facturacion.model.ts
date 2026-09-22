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
    return input;
  }
}

export class ConfiguracionFacturacionInput {
  id?: number;
  sucursalId?: number;
  modo?: ModoFacturacion;
  ventasSinFactura?: number;
  ventaTicketRespetaPolitica?: boolean;
}
