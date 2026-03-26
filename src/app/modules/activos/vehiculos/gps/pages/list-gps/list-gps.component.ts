import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Gps } from '../../models/gps.model';
import { GpsService } from '../../service/gps.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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

  ngOnInit(): void {
    this.gpsService.refrescar();
    this.initFiltros();
    this.initDataStream();
  }

  private initFiltros(): void {
    this.filtroControl.valueChanges.pipe(
      untilDestroyed(this),
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(texto => {
      this.gpsService.setSearchText(texto || '');
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

  onFiltrar(): void {
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
    this.filtroControl.setValue('');
    this.gpsService.updatePagination(0, 15);
    this.gpsService.refrescar();
  }
}
