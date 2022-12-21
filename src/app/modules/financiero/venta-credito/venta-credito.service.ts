import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { dateToString } from '../../../commons/core/utils/dateUtils';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { SaveVentaCreditoByIdGQL } from './graphql/saveVentaCredito';
import { VentaCreditoByIdGQL } from './graphql/ventaCreditoPorId';
import { VentaCreditoQrSubAuthGQL } from './graphql/ventaCreditoQrSubAuth';
import { VentaCredito, VentaCreditoCuotaInput, VentaCreditoInput } from './venta-credito.model';

@Injectable({
  providedIn: 'root'
})
export class VentaCreditoService {

  constructor(
    private genericService: GenericCrudService,
    private getVentaCredito: VentaCreditoByIdGQL,
    private saveVentaCredito: SaveVentaCreditoByIdGQL,
    private ventaCreditoQrAuthSub: VentaCreditoQrSubAuthGQL,
  ) { }

  onSave(input: VentaCreditoInput, itens: VentaCreditoCuotaInput[]): Observable<any>{
    return this.genericService.onSaveConDetalle(this.saveVentaCredito, input, itens);
  }

  ventaCreditoQrSub(){
    return this.genericService.onCustomSub(this.ventaCreditoQrAuthSub, null, true);
  }
}
