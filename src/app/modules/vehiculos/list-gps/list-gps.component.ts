import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GpsService } from '../vehiculo/gps.service';
import { Gps } from '../vehiculo/models/gps.model';
import { GpsComponent } from '../vehiculo/gps-form/gps.component';

@UntilDestroy()
@Component({
  selector: 'list-gps',
  templateUrl: './list-gps.component.html',
  styleUrls: ['./list-gps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListGpsComponent implements OnInit {
  private gpsService = inject(GpsService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<Gps>();
  displayedColumns = ['id', 'imei', 'modelo', 'sim', 'vehiculo', 'estado', 'acciones'];

  filtroControl = new FormControl('');

  pageIndex = 0;
  pageSize = 15;
  totalElements = 0;
  allData: Gps[] = [];

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar(): void {
    const texto = this.filtroControl.value || '';
    this.pageIndex = 0;

    this.gpsService.onSearch(texto).pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.allData = res;
        this.aplicarPaginacion();
      }
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.dataSource.data = this.allData.slice(startIndex, endIndex);
    this.totalElements = this.allData.length;
    this.cdr.markForCheck();
  }

  onAdicionar(): void {
    const dialogRef = this.dialog.open(GpsComponent, {
      width: '800px',
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.onFiltrar();
      }
    });
  }

  onEditar(gps: Gps): void {
    const dialogRef = this.dialog.open(GpsComponent, {
      width: '800px',
      data: gps,
      disableClose: true,
      autoFocus: false
    });

    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.onFiltrar();
      }
    });
  }

  onEliminar(gps: Gps): void {
    if (gps.id) {
      this.gpsService.onDelete(gps.id).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.onFiltrar();
        }
      });
    }
  }

  resetFiltro(): void {
    this.filtroControl.setValue('');
    this.onFiltrar();
  }
}
