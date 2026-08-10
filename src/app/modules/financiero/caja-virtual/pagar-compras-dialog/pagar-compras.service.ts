import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { SolicitudesPagoPendientesGQL } from './graphql/solicitudesPagoPendientes';
import { PagarSolicitudesLoteCajaMayorGQL } from './graphql/pagarSolicitudesLote';
import { PagarSolicitudesMixtoGQL } from './graphql/pagarSolicitudesMixto';
import { AnularPagoCppGQL } from './graphql/anularPagoSolicitud';
import { ChequerasPorCuentaGQL } from './graphql/chequerasPorCuenta';
import { GastosPendientesGQL } from './graphql/gastosPendientes';
import { CrearGastoParaPagoGQL } from './graphql/crearGastoParaPago';

export interface GastoParaPagoInput {
  tipoGastoId?: number;
  descripcion?: string;
  monedaId: number;
  monto: number;
  beneficiarioProveedorId?: number;
  beneficiarioPersonaId?: number;
  fechaVencimiento?: string;
  sucursalId?: number;
}

export interface PagoLote { solicitudId: number; monedaId: number; monto: number; }

// Una línea de pago (mixto): fuente + caja/cuenta + moneda + monto (+ conversión).
// AJUSTE = línea de diferencia de cambio/redondeo (no mueve efectivo), marcada descuento/aumento.
export interface LineaPagoInput {
  fuente: 'CAJA_MAYOR' | 'CUENTA_BANCARIA' | 'AJUSTE' | 'CHEQUE';
  cajaVirtualId?: number;
  cuentaBancariaId?: number;
  monedaId: number;
  monto: number;
  cotizacion?: number;
  montoSolicitud?: number;
  descuento?: boolean;
  aumento?: boolean;
  // Fuente CHEQUE
  chequeRef?: number;
  chequeraId?: number;
  diferido?: boolean;
  fechaEmision?: string;
  fechaPago?: string;
  beneficiario?: string;
  nominal?: boolean;
}

export interface SolicitudConLineas { solicitudId: number; lineas: LineaPagoInput[]; }

@Injectable({ providedIn: 'root' })
export class PagarComprasService {

  constructor(
    private genericService: GenericCrudService,
    private pendientesGQL: SolicitudesPagoPendientesGQL,
    private pagarLoteGQL: PagarSolicitudesLoteCajaMayorGQL,
    private pagarMixtoGQL: PagarSolicitudesMixtoGQL,
    private anularGQL: AnularPagoCppGQL,
    private chequerasPorCuentaGQL: ChequerasPorCuentaGQL,
    private gastosPendientesGQL: GastosPendientesGQL,
    private crearGastoGQL: CrearGastoParaPagoGQL,
  ) { }

  /** Gastos pagables (SolicitudPago tipo GASTO en SOLICITADO/PARCIAL). */
  onGetGastosPendientes(servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.gastosPendientesGQL, {}, servidor);
  }

  /** Crea un gasto (PreGasto liviano) + su SolicitudPago GASTO en SOLICITADO. Devuelve la solicitud. */
  onCrearGasto(input: GastoParaPagoInput, servidor = true): Observable<any> {
    return this.mutar(this.crearGastoGQL, { input }, servidor);
  }

  /** Chequeras activas de una cuenta bancaria (para ofrecer cheque como forma de pago). */
  onGetChequerasPorCuenta(cuentaBancariaId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.chequerasPorCuentaGQL, { cuentaBancariaId, soloActivas: true }, servidor);
  }

  onGetPendientes(proveedorId?: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.pendientesGQL, { proveedorId: proveedorId || null }, servidor);
  }

  onPagarLote(cajaVirtualId: number, pagos: PagoLote[], servidor = true): Observable<any> {
    return this.genericService.onSaveCustom(this.pagarLoteGQL, { cajaVirtualId, pagos }, servidor);
  }

  /**
   * Pago mixto: varias solicitudes, cada una con su subset de líneas (caja/banco, multi-moneda).
   * Llama la mutation directo (no onSaveCustom) para propagar el error correctamente: onSaveCustom
   * deja el observable colgado ante un error de GraphQL, lo que traba el botón Confirmar.
   */
  onPagarMixto(pagos: SolicitudConLineas[], servidor = true): Observable<any> {
    return this.mutar(this.pagarMixtoGQL, { pagos }, servidor);
  }

  /** Anula un evento de pago completo (todas sus notas y movimientos consolidados). */
  onAnularPago(pagoId: number, motivo?: string, servidor = true): Observable<any> {
    return this.mutar(this.anularGQL, { pagoId, motivo: motivo || null }, servidor);
  }

  /** Ejecuta una mutation y emite `next` con el dato o `error` con un mensaje saneado. */
  private mutar(gql: any, variables: any, servidor: boolean): Observable<any> {
    return gql.mutate(variables, {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
      context: { clientName: servidor == null || servidor ? 'servidor' : null },
    }).pipe(map((res: any) => {
      if (res?.errors?.length) throw new Error(this.limpiarError(res.errors[0].message));
      return res?.data?.data;
    }));
  }

  private limpiarError(msg: string): string {
    if (!msg) return 'Error al registrar el pago';
    return msg.replace(/^Exception while fetching data.*?:\s*/i, '').trim();
  }
}
