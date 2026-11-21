import { Component, OnInit } from '@angular/core';
import { PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../../generics/generic-crud.service';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PdvCaja, PdvCajaEstado } from '../../../../financiero/pdv/caja/caja.model';
import { CajaService } from '../../../../financiero/pdv/caja/caja.service';
import { MainService } from '../../../../../main.service';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PaginacionLista } from '../../../../../shared/components/paginacion/paginacion-lista';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../../shared/components/cargando-dialog/cargando-dialog.service';

@UntilDestroy({checkProperties: true})
@Component({
  selector: 'app-ultimas-cajas-dialog',
  templateUrl: './ultimas-cajas-dialog.component.html',
  styleUrls: ['./ultimas-cajas-dialog.component.scss']
})
export class UltimasCajasDialogComponent implements OnInit {

  dataSource = new MatTableDataSource<PdvCaja>([]);
  displayedColumns = ['id', 'responsable', 'fechaApertura', 'fechaCierre', 'acciones'];
  
  // Filtros en formulario
  filtrosForm = new FormGroup({
    fechaInicio: new FormControl(this.getOneWeekAgoDate()),
    fechaFin: new FormControl(new Date())
  });

  /** Últimas cajas del cajero en esta sucursal, paginadas en la filial (#772). */
  pag: PaginacionLista<PdvCaja> = new PaginacionLista<PdvCaja>({
    cargar: (page, size) => this.cajaService.onGetCajasWithFilters(
      null,
      null,
      null,
      this.mainService.usuarioActual.id,
      this.filtrosForm.get('fechaInicio').value,
      this.filtrosForm.get('fechaFin').value,
      this.mainService.sucursalActual?.id || null,
      null,
      null,
      null,
      page,
      size,
      false,
      PROPAGAR_ERROR_DE_RED,
      { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true }
    ).pipe(
      catchError(() => {
        this.notificacionSnackBar.openWarn('No se pudieron cargar las cajas: el servidor no responde.');
        return of(null);
      })
    ),
    pageSize: 10,
    pageSizeOptions: [5, 10, 15, 25, 50],
    alCargar: (res) => this.dataSource.data = res.getContent ?? [],
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.dataSource.data = [];
    },
  });

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
    this.pag.filtrar();
  }

  aplicarFiltros() {
    this.pag.filtrar();
  }

  limpiarFiltros() {
    this.filtrosForm.patchValue({
      fechaInicio: this.getOneWeekAgoDate(),
      fechaFin: new Date()
    });
    this.pag.filtrar();
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
        // Las fallas ya las avisa la cadena de onImprimirBalance (llegan null/false o no emiten).
        if (response) this.notificacionSnackBar.openSucess("Cierre impreso con éxito");
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
