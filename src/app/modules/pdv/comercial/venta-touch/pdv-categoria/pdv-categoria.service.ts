import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../../../shared/services/timeout-link';
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

  /**
   * Corre en el constructor de un servicio root: puede ser fuera del POS o antes del login. Si el
   * servidor no responde no avisa (sería un mensaje en una pantalla ajena); el cajero reintenta con
   * el botón actualizar de favoritos, que sí avisa (#390).
   */
  cargarCategorias() {
    this.onGetCategorias(false)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => this.aplicarCategorias(res),
        error: (err) => console.warn('[PDV] No se pudieron cargar las categorías', err),
      });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer)
  }

  /** Los dos que la llaman (cargarCategorias y onRefresh) manejan el error de red. */
  onGetCategorias(servidor: boolean = true): Observable<PdvCategoria[]> {
    return this.genericService.onCustomQuery(this.getCategorias, {}, servidor, PROPAGAR_ERROR_DE_RED, true, {
      // Trae todas las categorías con sus grupos: puede tardar. El tiempo por defecto del link.
      timeoutMs: TIMEOUT_POR_DEFECTO_MS,
      silenciarAvisoTimeout: true,
    });
  }

  onRefresh() {
    this.onGetCategorias(false).subscribe({
      next: (res) => this.aplicarCategorias(res),
      error: () =>
        this.notificacionService.openWarn(
          'No se pudieron cargar las categorías del PDV: el servidor no responde. Probá de nuevo con actualizar.',
          4
        ),
    });
  }

  private aplicarCategorias(res: PdvCategoria[]) {
    // Con un error GraphQL onCustomQuery emite null: antes reventaba en el forEach. Se conservan las
    // categorías que ya había en vez de vaciar los favoritos.
    if (res == null) return;
    this.pdvCategorias = res;
    this.pdvCategoriasSub.next(this.pdvCategorias)
    this.pdvCategorias.forEach((cat) => {
      cat.grupos?.forEach((gr) => {
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
