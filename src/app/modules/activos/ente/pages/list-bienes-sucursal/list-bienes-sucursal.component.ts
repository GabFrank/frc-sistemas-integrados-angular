import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EnteService } from '../../service/ente.service';
import { Ente } from '../../models/ente.model';

@UntilDestroy()
@Component({
  selector: 'app-list-bienes-sucursal',
  templateUrl: './list-bienes-sucursal.component.html',
  styleUrls: ['./list-bienes-sucursal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListBienesSucursalComponent implements OnInit {
  public enteService = inject(EnteService);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<Ente>();

  displayedColumns: string[] = ['id', 'tipoEnte', 'referenciaId', 'activo', 'acciones'];

  filtroControl = new FormControl('');

  ngOnInit(): void {
    this.enteService.refrescar();
    this.initDataStream();
  }

  private initDataStream(): void {
    this.enteService.entes$
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.dataSource.data = res || [];
        this.cdr.markForCheck();
      });
  }

  onAdicionar(): void {

  }

  onFiltrar(): void {
    this.enteService.setSearchText(this.filtroControl.value || '');
  }

  handlePageEvent(event: PageEvent): void {
    this.enteService.updatePagination(event.pageIndex, event.pageSize);
  }

  resetFiltro(): void {
    this.filtroControl.setValue('');
    this.enteService.setSearchText('');
  }
}
