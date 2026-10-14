import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import { CuentaBancaria } from './cuenta-bancaria.model';
import { CuentasBancariasGQL } from './graphql/cuentasBancarias';
import { CuentasBancariasOperablesGQL } from './graphql/cuentasBancariasOperables';
import { SaveCuentaBancariaGQL } from './graphql/saveCuentaBancaria';
import { DeleteCuentaBancariaGQL } from './graphql/deleteCuentaBancaria';
import { AjustarSaldoCuentaBancariaGQL } from './graphql/ajustarSaldoCuentaBancaria';

/** Un ajuste de saldo tal como se envía, con su clave: se guarda entero para poder reenviarlo idéntico. */
export interface PedidoDeAjusteBancario {
  cuentaBancariaId: number;
  monto: number;
  positivo: boolean;
  motivo: string;
  saldoEsperado: number;
  claveIdempotencia: string;
}

@Injectable({
  providedIn: 'root'
})
export class CuentaBancariaService {

  constructor(
    private genericService: GenericCrudService,
    private cuentasBancariasGQL: CuentasBancariasGQL,
    private cuentasBancariasOperablesGQL: CuentasBancariasOperablesGQL,
    private saveCuentaBancariaGQL: SaveCuentaBancariaGQL,
    private deleteCuentaBancariaGQL: DeleteCuentaBancariaGQL,
    private ajustarSaldoGQL: AjustarSaldoCuentaBancariaGQL,
  ) { }

  onGetAll(page = 0, size = 100): Observable<CuentaBancaria[]> {
    // Un solo suscriptor (la lista de cuentas), con error: (#390).
    return this.genericService.onCustomQuery(this.cuentasBancariasGQL, { page, size }, true, PROPAGAR_ERROR_DE_RED,
      undefined, { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true });
  }

  /** Solo cuentas propias operables en tesorería (activas + disponibles para operaciones). */
  onGetAllOperables(errorConf?: QueryError, contexto?: ContextoConsulta): Observable<CuentaBancaria[]> {
    return this.genericService.onCustomQuery(this.cuentasBancariasOperablesGQL, {}, true, errorConf, undefined, contexto);
  }

  onSave(cuentaBancaria: CuentaBancaria, opciones?: { avisarExito?: boolean }): Observable<CuentaBancaria> {
    let aux = cuentaBancaria;
    if (!(cuentaBancaria instanceof CuentaBancaria)) {
      aux = new CuentaBancaria();
      Object.assign(aux, cuentaBancaria);
    }
    return this.genericService.onSaveCustom(this.saveCuentaBancariaGQL, { cuentaBancaria: aux.toInput() }, true, opciones);
  }

  onDelete(id: number, opciones?: { avisarExito?: boolean }): Observable<boolean> {
    return this.genericService.onSaveCustom(this.deleteCuentaBancariaGQL, { id }, true, opciones);
  }

  /**
   * Ajusta el saldo de la cuenta contra el extracto real. El motivo es obligatorio: un ajuste
   * no tiene contrapartida, y ese texto es toda la trazabilidad que le queda al movimiento.
   */
  //
  // saldoEsperado: el saldo que se veía; si la cuenta ya no tiene ese, el central rechaza. claveIdempotencia: el
  // mismo pedido reenviado devuelve el ajuste original en vez de aplicar otro (franco-system-backend-servidor#376).
  onAjustarSaldo(pedido: PedidoDeAjusteBancario, opciones?: { avisarExito?: boolean }): Observable<any> {
    return this.genericService.onSaveCustom(this.ajustarSaldoGQL, pedido, true, opciones);
  }
}
