import { Directive, Input, OnDestroy, OnInit, Self } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { PaginacionLista } from './paginacion-lista';

/**
 * Paginador de las listas (#772): conecta un `<mat-paginator>` con una `PaginacionLista`.
 *
 *   <mat-paginator [paginacion]="pag" style="width: 100%"></mat-paginator>
 *
 * Pone las opciones de tamaño, los botones de primera/última página, la página, el tamaño y el total,
 * y le pasa cada cambio de página a la lista. Va como directiva sobre el mismo `mat-paginator` (no
 * como componente que lo envuelva) para que el HTML quede igual: los estilos de `app-generic-list`
 * (paginador fijo abajo) y los de cada pantalla siguen alcanzándolo.
 */
@Directive({
  selector: 'mat-paginator[paginacion]',
  standalone: true,
})
export class PaginacionDirective implements OnInit, OnDestroy {
  @Input() paginacion: PaginacionLista<any>;

  private readonly suscripciones = new Subscription();

  constructor(@Self() private readonly paginator: MatPaginator) { }

  ngOnInit(): void {
    const paginator = this.paginator;
    paginator.pageSizeOptions = this.paginacion.pageSizeOptions;
    paginator.showFirstLastButtons = true;
    // Los setters del MatPaginator marcan la vista para revisar: alcanza también a una pantalla OnPush.
    this.suscripciones.add(this.paginacion.estado$.subscribe(e => {
      paginator.length = e.total;
      paginator.pageSize = e.pageSize;
      paginator.pageIndex = e.pageIndex;
    }));
    this.suscripciones.add(paginator.page.subscribe(e => this.paginacion.onPage(e)));
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }
}
