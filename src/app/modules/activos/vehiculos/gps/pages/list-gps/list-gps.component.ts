import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Gps } from '../../models/gps.model';
import { GpsService } from '../../service/gps.service';
import { debounceTime } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'list-gps',
  templateUrl: './list-gps.component.html',
  styleUrls: ['./list-gps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListGpsComponent implements OnInit {
  public gpsService = inject(GpsService);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<Gps>();
  displayedColumns = ['id', 'imei', 'modelo', 'sim', 'vehiculo', 'estado', 'acciones'];

  filtroControl = new FormControl('');

  /** No se pudo cargar: la tabla está vacía porque falló la lectura, no porque no haya GPS. */
  listaError = false;
  /** Falló un refresco: las filas son las de antes. */
  listaDesactualizada = false;

  ngOnInit(): void {
    // El servicio es único y recuerda el texto de la vez anterior; el campo arranca vacío.
    this.gpsService.refrescar('');
    this.initFiltros();
    this.initDataStream();
    this.gpsService.estadoLista$.pipe(untilDestroyed(this)).subscribe(estado => {
      this.listaError = estado === 'error';
      this.listaDesactualizada = estado === 'desactualizada';
      this.cdr.markForCheck();
    });
  }

  private initFiltros(): void {
    this.filtroControl.valueChanges.pipe(
      untilDestroyed(this),
      debounceTime(500)
    ).subscribe(() => {
      // El valor actual, no el emitido: si en esos 500 ms se limpió el filtro o se buscó con Enter, el texto
      // viejo que quedó esperando no vuelve a aplicarse.
      this.gpsService.setSearchText(this.filtroControl.value || '');
    });
  }

  private initDataStream(): void {
    this.gpsService.filteredGps$.pipe(
      untilDestroyed(this)
    ).subscribe(res => {
      if (res) {
        this.dataSource.data = res;
        this.cdr.markForCheck();
      }
    });
  }

  /** Botón Buscar y Enter: con el texto escrito, sin esperar al debounce. */
  onFiltrar(): void {
    this.gpsService.refrescar(this.filtroControl.value || '');
  }

  onReintentar(): void {
    this.gpsService.refrescar();
  }

  handlePageEvent(event: PageEvent): void {
    this.gpsService.updatePagination(event.pageIndex, event.pageSize);
  }

  onAdicionar(): void {
    this.gpsService.abrirFormulario().subscribe();
  }

  onEditar(gps: Gps): void {
    this.gpsService.abrirFormulario(gps).subscribe();
  }

  onConfigurar(gps: Gps): void {
    this.gpsService.abrirConfiguracion(gps);
  }

  onEliminar(gps: Gps): void {
    if (gps.id) {
      this.gpsService.onDelete(gps.id).subscribe();
    }
  }

  resetFiltro(): void {
    this.filtroControl.setValue('', { emitEvent: false });
    this.gpsService.updatePagination(0, 15);
    this.gpsService.refrescar('');
  }
}
