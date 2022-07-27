import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { FacturaLegal, FacturaLegalInput, FacturaLegalItemInput } from './factura-legal.model';
import { SaveFacturaLegalGQL } from './graphql/saveFactura';

@Injectable({
  providedIn: 'root'
})
export class FacturaLegalService {

  constructor(
    private saveFactura: SaveFacturaLegalGQL,
    private genericService: GenericCrudService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  onSaveFactura(input: FacturaLegalInput, facturaLegalItemInputList: FacturaLegalItemInput[]): Observable<any> {
    return this.genericService.onSaveConDetalle(this.saveFactura, input, facturaLegalItemInputList, environment['printers']['factura']);
  }

}
