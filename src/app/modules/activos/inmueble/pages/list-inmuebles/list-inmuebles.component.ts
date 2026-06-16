import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Inmueble } from '../../models/inmueble.model';
import { InmuebleService } from '../../service/inmueble.service';
import { EnteVinculacion } from '../../../ente/models/ente-vinculacion.model';

@UntilDestroy()
@Component({
  selector: 'app-list-inmuebles',
  templateUrl: './list-inmuebles.component.html',
  styleUrls: ['./list-inmuebles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListInmueblesComponent implements OnInit {
  public inmuebleService = inject(InmuebleService);
  inmuebles$ = this.inmuebleService.inmuebles$;

  displayedColumns: string[] = ['id', 'nombreAsignado', 'direccion', 'paisCity', 'sucursal', 'tenencia', 'propietario', 'tasacion', 'acciones'];

  filtroControl = new FormControl('');

  ngOnInit(): void {
    this.inmuebleService.refrescar();
    this.initFiltros();
  }

  private initFiltros(): void {
    this.filtroControl.valueChanges
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((texto) => {
        this.inmuebleService.setSearchText(texto || '');
      });
  }



  onAdicionar(): void {
    this.inmuebleService.abrirFormulario().subscribe();
  }

  onEditar(row: Inmueble): void {
    this.inmuebleService.abrirFormulario(row).subscribe();
  }

  getVinculacionPrincipal(row: Inmueble): EnteVinculacion | undefined {
    return row.vinculacionesSucursal?.[0];
  }

  onVincularSucursal(row: Inmueble): void {
    const vinculacion = this.getVinculacionPrincipal(row);
    this.inmuebleService.abrirVinculacionSucursal(row, vinculacion).pipe(untilDestroyed(this)).subscribe();
  }

  onDesvincularSucursal(row: Inmueble): void {
    const vinculacion = this.getVinculacionPrincipal(row);
    if (!vinculacion?.id) return;
    this.inmuebleService.onDesvincularSucursal(vinculacion.id).pipe(untilDestroyed(this)).subscribe();
  }

  onFiltrar(): void {
    this.inmuebleService.refrescar();
  }

  handlePageEvent(event: PageEvent): void {
    this.inmuebleService.updatePagination(event.pageIndex, event.pageSize);
  }

  resetFiltro(): void {
    this.filtroControl.setValue('');
    this.inmuebleService.setSearchText('');
  }
}
