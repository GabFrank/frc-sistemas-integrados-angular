import { CrearCambioDialogComponent } from './crear-cambio-dialog/crear-cambio-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MonedaService } from './../moneda/moneda.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Cambio } from './cambio.model';
import { CambioService } from './cambio.service';
import { Moneda } from '../moneda/moneda.model';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';

interface MonedaCambioRow {
  moneda: Moneda;
  ultimoCambio: Cambio;
}

@UntilDestroy()
@Component({
  selector: 'app-cambio',
  templateUrl: './cambio.component.html',
  styleUrls: ['./cambio.component.scss']
})
export class CambioComponent implements OnInit {

  dataSourceActual = new MatTableDataSource<MonedaCambioRow>([])

  displayedColumnsActual = [
    'moneda',
    'cotizacionVenta',
    'ventaMercado',
    'compraMercado',
    'fecha',
    'accion'
  ]

  constructor(
    private cambioService: CambioService,
    private monedaService: MonedaService,
    private matDialog: MatDialog,
    private notificacionSnackbar: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.onGetMonedas()
  }

  onEditCambio(row: MonedaCambioRow, i){
    this.matDialog.open(CrearCambioDialogComponent, {
      data: {
        moneda: row.moneda,
        ultimoCambio: row.ultimoCambio
      }
    }).afterClosed().subscribe(res => {
      if(res?.cambio != null){
        this.onGetMonedas()
      }
    })
  }

  onGetMonedas(){
    this.monedaService.onGetAll()
    .pipe(untilDestroyed(this))
    .subscribe(res => {
      if(res != null){
        const monedas = res.filter(m => m.denominacion != 'GUARANI');
        const rows: MonedaCambioRow[] = monedas.map(m => ({ moneda: m, ultimoCambio: null }));
        this.dataSourceActual.data = rows;
        rows.forEach((row, idx) => {
          this.cambioService.getUltimoCambioPorMonedaId(row.moneda.id)
            .pipe(untilDestroyed(this))
            .subscribe(cambio => {
              if (cambio != null) {
                row.ultimoCambio = cambio;
                this.dataSourceActual.data = [...this.dataSourceActual.data];
              }
            });
        });
      }
    })
  }

  onActualizarCotizaciones(): void {
    this.cambioService.onActualizarCotizacionesMercado()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (ok) => {
          if (ok) {
            this.notificacionSnackbar.openSucess('Cotizaciones de mercado actualizadas');
          } else {
            this.notificacionSnackbar.openWarn('No se encontraron cambios para actualizar');
          }
          this.onGetMonedas();
        },
        error: () => {
          this.onGetMonedas();
        }
      });
  }
}
