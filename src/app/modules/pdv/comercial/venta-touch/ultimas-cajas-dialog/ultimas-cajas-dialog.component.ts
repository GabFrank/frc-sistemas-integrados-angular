import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PdvCaja, PdvCajaEstado } from '../../../../financiero/pdv/caja/caja.model';
import { CajaService } from '../../../../financiero/pdv/caja/caja.service';
import { MainService } from '../../../../../main.service';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { PageInfo } from '../../../../../app.component';

@UntilDestroy({checkProperties: true})
@Component({
  selector: 'app-ultimas-cajas-dialog',
  templateUrl: './ultimas-cajas-dialog.component.html',
  styleUrls: ['./ultimas-cajas-dialog.component.scss']
})
export class UltimasCajasDialogComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<PdvCaja>([]);
  isLoading = false;
  isLastPage = false;
  displayedColumns = ['id', 'responsable', 'fechaApertura', 'fechaCierre', 'acciones'];
  selectedPageInfo: PageInfo<PdvCaja>;
  
  // Filtros en formulario
  filtrosForm = new FormGroup({
    fechaInicio: new FormControl(this.getOneWeekAgoDate()),
    fechaFin: new FormControl(new Date())
  });

  // Pagination properties
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 15, 25, 50];

  constructor(
    public dialogRef: MatDialogRef<UltimasCajasDialogComponent>,
    private cajaService: CajaService,
    private mainService: MainService,
    private notificacionSnackBar: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.cargarCajas();
  }

  cargarCajas() {
    this.isLoading = true;
    const fechaInicio = this.filtrosForm.get('fechaInicio').value;
    const fechaFin = this.filtrosForm.get('fechaFin').value;

    this.cajaService.onGetCajasWithFilters(
      null,
      null,
      null,
      this.mainService.usuarioActual.id,
      fechaInicio,
      fechaFin,
      this.mainService.sucursalActual?.id || null,
      null,
      this.pageIndex,
      this.pageSize,
      false
    ).pipe(untilDestroyed(this)).subscribe(res => {
      this.isLoading = false;
      if (res != null) {
        console.log(res);
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent || [];
        this.isLastPage = res.isLast || false;
      }
    }, error => {
      this.isLoading = false;
      this.notificacionSnackBar.openWarn('Error al cargar las cajas');
    });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargarCajas();
  }

  aplicarFiltros() {
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.cargarCajas();
  }

  limpiarFiltros() {
    this.filtrosForm.patchValue({
      fechaInicio: this.getOneWeekAgoDate(),
      fechaFin: new Date()
    });
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.cargarCajas();
  }

  getOneWeekAgoDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  }

  onImprimirBalance(caja: PdvCaja) {
    this.cajaService.onImprimirBalance(caja.id, caja.sucursalId, false)
    .subscribe({
      next: (response) => {
        // Handle successful response, e.g., show a success message
        // TODO: Implement success notification if needed
        console.log('Balance impreso:', response);
      },
      error: (err) => {
        // Handle error, e.g., show an error message
        // TODO: Implement error notification if needed
        console.error('Error al imprimir balance:', err);
      }
    });
  }

  salir() {
    this.dialogRef.close();
  }
}
