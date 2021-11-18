import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Observable } from 'rxjs';
import { NotificacionColor, NotificacionSnackbarService } from '../notificacion-snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class GenericCrudService {

  constructor(
    private notificacionSnackBar: NotificacionSnackbarService
  ) { }

  onGetAll(gql: Query): Observable<any>{
    return new Observable(obs => {
      gql.fetch({}, {fetchPolicy: 'no-cache', errorPolicy: 'all'}).subscribe(res => {
        if(res.errors==null){
          obs.next(res.data['data'])
        } else {
          this.notificacionSnackBar.notification$.next({
            texto: 'Ups! Algo salió mal: ' + res.errors[0].message,
            color: NotificacionColor.danger,
            duracion: 3
          })
        }
      })

    })
  }
}
