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
import { GruposProductosPorGrupoIdSimpleGQL } from './graphql/getGrupoProductosSimple';

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
    private getGruposProductosPorGrupoId: GruposProductosPorGrupoIdGQL,
    private getGruposProductosPorGrupoIdSimple: GruposProductosPorGrupoIdSimpleGQL
  ) {
    this.cargarCategorias()
    // this.timer = setInterval(() => {
    //   this.cargarCategorias()
    // }, 900000);
  }

  cargarCategorias() {
    this.onGetCategorias(false)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.pdvCategorias = res;
        this.pdvCategoriasSub.next(this.pdvCategorias)
        this.pdvCategorias.forEach((cat) => {
          cat.grupos.forEach((gr) => {
            if (gr.activo == true) {
              this.onGetGrupoProductosPorGrupoId(gr.id, false)
                .pipe(untilDestroyed(this))
                .subscribe((res) => {
                  if (res != null) {
                    gr.pdvGruposProductos = res;
                  }
                });
            }
          });
        });
      });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer)
  }

  onGetCategorias(servidor: boolean = true): Observable<PdvCategoria[]> {
    return this.genericService.onCustomQuery(this.getCategorias, {}, servidor, null, true);
  }

  onRefresh() {
    this.onGetCategorias(false).subscribe(res => {
      this.pdvCategorias = res;
      this.pdvCategoriasSub.next(this.pdvCategorias)
      this.pdvCategorias.forEach((cat) => {
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
      });
    })
  }

  onSaveCategoria(input: PdvCategoriaInput, servidor = true) {
    // refactor 
    return this.genericService.onSave(this.saveCategoria, input, null, null,  servidor)
  }

  onGetGrupoProductosPorGrupoId(id, servidor: boolean = true): Observable<PdvGruposProductos[]> {
    return this.genericService.onGetById(this.getGruposProductosPorGrupoId, id, null, null, servidor, null, null, null, true)
  }

  onGetGrupoProductosPorGrupoIdSimple(id, servidor: boolean = true): Observable<PdvGruposProductos[]> {
    return this.genericService.onGetById(this.getGruposProductosPorGrupoIdSimple, id, null, null, servidor, null, null, null, true)
  }
}
