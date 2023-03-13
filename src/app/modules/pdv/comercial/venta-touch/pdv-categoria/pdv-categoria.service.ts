import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GenericCrudService } from '../../../../../generics/generic-crud.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { PdvGruposProductos } from '../pdv-grupos-productos/pdv-grupos-productos.model';
import { PdvCategoriaFullInfoGQL } from './graphql/getCategoriaFullInfo';
import { GruposProductosPorGrupoIdGQL } from './graphql/getGrupoProductos';
import { SavePdvCategoriaGQL } from './graphql/saveCategoria';
import { PdvCategoriaInput } from './pdv-categoria-input.model';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PdvCategoria } from './pdv-categoria.model';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class PdvCategoriaService implements OnDestroy {

  pdvCategoriasSub = new BehaviorSubject<PdvCategoria[]>([]);
  pdvCategorias;
  timer;
  constructor(
    private getCategorias: PdvCategoriaFullInfoGQL,
    private saveCategoria: SavePdvCategoriaGQL,
    private notificacionService: NotificacionSnackbarService,
    private genericService: GenericCrudService,
    private getGruposProductosPorGrupoId: GruposProductosPorGrupoIdGQL
  ) {
    this.cargarCategorias()
    this.timer = setInterval(() => {
      this.cargarCategorias()
    }, 900000);
  }

  cargarCategorias() {
    this.onGetCategorias()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        // this.cargandoService.openDialog(false, "Cargando Otros");
        // this.cargandoService.closeDialog();
        if (res.errors == null) {
          this.pdvCategorias = res.data.data;
          this.pdvCategoriasSub.next(this.pdvCategorias)
          res.data.data.forEach((cat) => {
            cat.grupos.forEach((gr) => {
              if (gr.activo == true) {
                this.onGetGrupoProductosPorGrupoId(gr.id)
                  .pipe(untilDestroyed(this))
                  .subscribe((res) => {
                    if (res != null) {
                      gr.pdvGruposProductos = res;
                    }
                  });
              }
            });
            console.log("carga completa");
          });
        }
      });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer)
  }

  onGetCategorias() {
    return this.getCategorias.fetch(null, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
  }

  onSaveCategoria(input: PdvCategoriaInput) {
    return new Observable(obs => {
      this.saveCategoria.mutate({
        input
      }, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }).pipe(untilDestroyed(this)).subscribe(res => {
        if (res.errors != null) {
          this.notificacionService.notification$.next({
            texto: 'Ups! Algo salió mal',
            duracion: 3,
            color: NotificacionColor.danger
          })
          obs.next({ 'error': res })
        } else {
          this.notificacionService.notification$.next({
            texto: 'Categoria guardada correctamente!',
            duracion: 2,
            color: NotificacionColor.success
          })
          obs.next({ 'data': res.data.data })
        }
      })
    })
  }

  onGetGrupoProductosPorGrupoId(id): Observable<PdvGruposProductos[]> {
    return this.genericService.onGetById(this.getGruposProductosPorGrupoId, id)
  }
}
