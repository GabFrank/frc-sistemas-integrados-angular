import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { CuentaBancaria } from './cuenta-bancaria.model';
import { CuentasBancariasGQL } from './graphql/cuentasBancarias';
import { SaveCuentaBancariaGQL } from './graphql/saveCuentaBancaria';
import { DeleteCuentaBancariaGQL } from './graphql/deleteCuentaBancaria';

@Injectable({
  providedIn: 'root'
})
export class CuentaBancariaService {

  constructor(
    private genericService: GenericCrudService,
    private cuentasBancariasGQL: CuentasBancariasGQL,
    private saveCuentaBancariaGQL: SaveCuentaBancariaGQL,
    private deleteCuentaBancariaGQL: DeleteCuentaBancariaGQL,
  ) { }

  onGetAll(page = 0, size = 100): Observable<CuentaBancaria[]> {
    return this.genericService.onCustomQuery(this.cuentasBancariasGQL, { page, size });
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
}
