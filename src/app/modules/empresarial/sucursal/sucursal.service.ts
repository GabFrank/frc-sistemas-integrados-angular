import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { TabService } from '../../../layouts/tab/tab.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { GenericListService } from '../../../shared/components/generic-list/generic-list.service';
import { productosSearch } from '../../productos/producto/graphql/graphql-query';
import { EditSucursalComponent } from './edit-sucursal/edit-sucursal.component';
import { deleteSucursalQuery, saveSucursal, sucursalQuery } from './graphql/graphql-query';
import { SucursalesGQL } from './graphql/sucursalesQuery';
import { ListSucursalComponent } from './list-sucursal/list-sucursal.component';
import { Sucursal } from './sucursal.model';

@Injectable({
  providedIn: 'root'
})
export class SucursalService{

  constructor(
    private getAllSucursales : SucursalesGQL,
    private notificacionBar : NotificacionSnackbarService
    ){

  }

  onGetAllSucursales(): Observable<Sucursal[]>{
      return new Observable(obs => {
        this.getAllSucursales.fetch({}, {
          fetchPolicy: 'no-cache',
          errorPolicy: 'all'
        }).subscribe(res => {
          if(res.errors==null){
            obs.next(res.data['data'])
          } else {
            this.notificacionBar.notification$.next({
              texto: 'Ups! algo salio mal: '+ res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 3
            })
          }
        })
      })
  }
  
}
