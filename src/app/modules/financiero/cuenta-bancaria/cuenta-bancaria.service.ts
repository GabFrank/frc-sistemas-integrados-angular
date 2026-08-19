import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { CuentaBancaria } from './cuenta-bancaria.model';
import { CuentasBancariasGQL } from './graphql/cuentasBancarias';
import { CuentasBancariasOperablesGQL } from './graphql/cuentasBancariasOperables';
import { SaveCuentaBancariaGQL } from './graphql/saveCuentaBancaria';
import { DeleteCuentaBancariaGQL } from './graphql/deleteCuentaBancaria';
import { AjustarSaldoCuentaBancariaGQL } from './graphql/ajustarSaldoCuentaBancaria';

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
    return this.genericService.onCustomQuery(this.cuentasBancariasGQL, { page, size });
  }

  /** Solo cuentas propias operables en tesorería (activas + disponibles para operaciones). */
  onGetAllOperables(): Observable<CuentaBancaria[]> {
    return this.genericService.onCustomQuery(this.cuentasBancariasOperablesGQL, {});
  }

  onSave(cuentaBancaria: CuentaBancaria): Observable<CuentaBancaria> {
    let aux = cuentaBancaria;
    if (!(cuentaBancaria instanceof CuentaBancaria)) {
      aux = new CuentaBancaria();
      Object.assign(aux, cuentaBancaria);
    }
    return this.genericService.onSaveCustom(this.saveCuentaBancariaGQL, { cuentaBancaria: aux.toInput() });
  }

  onDelete(id: number): Observable<boolean> {
    return this.genericService.onSaveCustom(this.deleteCuentaBancariaGQL, { id });
  }

  /**
   * Ajusta el saldo de la cuenta contra el extracto real. El motivo es obligatorio: un ajuste
   * no tiene contrapartida, y ese texto es toda la trazabilidad que le queda al movimiento.
   */
  onAjustarSaldo(cuentaBancariaId: number, monto: number, positivo: boolean, motivo: string): Observable<any> {
    return this.genericService.onSaveCustom(this.ajustarSaldoGQL, {
      cuentaBancariaId, monto, positivo, motivo,
    });
  }
}
