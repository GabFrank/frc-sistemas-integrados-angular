import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { CajaPorIdGQL } from './graphql/cajaPorId';
import { CajaPorUsuarioIdAndAbiertoGQL } from './graphql/cajaPorUsuarioIdAndAbierto';
import { CajasPorFechaGQL } from './graphql/cajasPorFecha';
import { DeleteCajaGQL } from './graphql/deleleCaja';
import { ImprimirBalanceGQL } from './graphql/imprimirBalance';
import { SaveCajaGQL } from './graphql/saveCaja';

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  constructor(
    private genericService: GenericCrudService,
    private cajasPorFecha: CajasPorFechaGQL,
    private onSaveCaja: SaveCajaGQL,
    private cajaPorId: CajaPorIdGQL,
    private deleteCaja: DeleteCajaGQL,
    private cajaPorUsuarioIdAndAbierto: CajaPorUsuarioIdAndAbiertoGQL,
    private imprimirBalance: ImprimirBalanceGQL
  ) { }

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllCajas);
  // }

  onGetByDate(inicio?: Date, fin?: Date): Observable<any>{
    return this.genericService.onGetByFecha(this.cajasPorFecha, inicio, fin);
  }

  onSave(input): Observable<any> {
    console.log(input)
    return this.genericService.onSave(this.onSaveCaja, input);
  }

  onGetById(id): Observable<any>{
    return this.genericService.onGetById(this.cajaPorId, id);
  }

  onGetByUsuarioIdAndAbierto(id): Observable<any>{
    return this.genericService.onGetById(this.cajaPorUsuarioIdAndAbierto, id);
  }

  onDelete(id, showDialog?: boolean): Observable<any>{
    console.log('Borrando: '+id)
    return this.genericService.onDelete(this.deleteCaja, id, showDialog);
  }

  onImprimirBalance(id){
    return this.imprimirBalance.fetch(
      {
        id
      }, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }
    ).subscribe(res => {
      console.log(res)
    })
  }
}
