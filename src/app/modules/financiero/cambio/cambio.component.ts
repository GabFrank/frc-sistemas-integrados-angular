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
import { timer } from 'rxjs';
import { avisoTrasMutacion, RECARGA_TRAS_CORTE_MS } from '../../../commons/core/utils/graphqlErrorUtils';

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
            // `false` cubre tanto "nortecambios no respondió" como "la integración está
            // apagada por configuración". El mensaje viejo ("no se encontraron cambios")
            // sugería un problema de datos, que no es ninguno de los dos casos.
            this.notificacionSnackbar.openWarn('No se pudo actualizar la cotización de mercado');
          }
          this.onGetMonedas();
        },
        // El central nunca rechaza (devuelve false). Sin respuesta pudo actualizarse: se avisa (el corte por tiempo ya lo
        // avisó el link) y se recarga cuando el central tuvo tiempo; antes recargaba al instante y sin aviso (#501)
        error: (e) => {
          const aviso = avisoTrasMutacion(e, 'se actualizó la cotización de mercado');
          if (aviso != null) {
            this.notificacionSnackbar.openWarn(aviso, 8);
          }
          timer(RECARGA_TRAS_CORTE_MS).pipe(untilDestroyed(this)).subscribe(() => this.onGetMonedas());
        }
      });
  }
}
