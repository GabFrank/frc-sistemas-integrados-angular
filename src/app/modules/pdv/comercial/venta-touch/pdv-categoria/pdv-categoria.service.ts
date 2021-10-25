import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { PdvCategoriaFullInfoGQL } from './graphql/getCategoriaFullInfo';
import { SavePdvCategoriaGQL } from './graphql/saveCategoria';
import { PdvCategoriaInput } from './pdv-categoria-input.model';


@Injectable({
  providedIn: 'root'
})
export class PdvCategoriaService {

  constructor(
    private getCategorias: PdvCategoriaFullInfoGQL,
    private saveCategoria: SavePdvCategoriaGQL,
    private notificacionService: NotificacionSnackbarService
  ) { }

  onGetCategorias(){
    return this.getCategorias.fetch(null, {fetchPolicy: 'no-cache',errorPolicy: 'all'})
  }

  onSaveCategoria(input: PdvCategoriaInput){
    return new Observable(obs => {
      this.saveCategoria.mutate({
        input
      }, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }).subscribe(res => {
        if(res.errors != null){
          this.notificacionService.notification$.next({
            texto: 'Ups! Algo salió mal',
            duracion: 3,
            color: NotificacionColor.danger
          })
          obs.next({'error': res})
        } else {
          this.notificacionService.notification$.next({
            texto: 'Categoria guardada correctamente!',
            duracion: 2,
            color: NotificacionColor.success
          })
          obs.next({'data': res.data.data})
        }
      })
    })
  }
}
