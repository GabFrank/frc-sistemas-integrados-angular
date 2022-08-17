import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { FacturaLegalInput, FacturaLegalItemInput } from './factura-legal.model';
import { ImprimirFacturasPorCajaGQL } from './graphql/imprimirFacturas';
import { SaveFacturaLegalGQL } from './graphql/saveFactura';

@Injectable({
  providedIn: 'root'
})
export class FacturaLegalService {

  constructor(
    private saveFactura: SaveFacturaLegalGQL,
    private genericService: GenericCrudService,
    private notificacionService: NotificacionSnackbarService,
    private imprimirFacturasPorCaja: ImprimirFacturasPorCajaGQL,

  ) { }

  onSaveFactura(input: FacturaLegalInput, facturaLegalItemInputList: FacturaLegalItemInput[]): Observable<any> {
    console.log(input);
    
    if(input?.nombre!=null) input.nombre = input.nombre.toUpperCase()
    return this.genericService.onSaveConDetalle(this.saveFactura, input, facturaLegalItemInputList, null, environment['printers']['ticket'], environment['pdvId']);
  }

  onImprimirFacturasPorCaja(id:number){
    return this.genericService.onCustomQuery(this.imprimirFacturasPorCaja, {id: id, printerName: environment['printers']['ticket']}).subscribe(res => {
      if(res){
        this.notificacionService.openGuardadoConExito()
      }
    })
  }

}
