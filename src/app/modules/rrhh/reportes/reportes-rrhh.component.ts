import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService, NotificacionColor } from '../../../notificacion-snackbar.service';
import { ReportesRrhhService } from './reportes-rrhh.service';

interface ReporteOpcion { titulo: string; descripcion: string; icon: string; accion: string; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-reportes-rrhh',
  templateUrl: './reportes-rrhh.component.html',
  styleUrls: ['./reportes-rrhh.component.scss']
})
export class ReportesRrhhComponent implements OnInit {

  periodoControl = new FormControl(null);
  generando = false;

  reportes: ReporteOpcion[] = [
    { titulo: 'Nómina del mes', descripcion: 'Liquidaciones aprobadas/pagadas del período con haberes, descuentos y neto.', icon: 'receipt_long', accion: 'nomina' },
    { titulo: 'Resumen IPS', descripcion: 'Base salarial y aportes al IPS (funcionario y patronal) por funcionario.', icon: 'account_balance', accion: 'ips' }
  ];

  constructor(
    private reportesService: ReportesRrhhService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    const hoy = new Date();
    this.periodoControl.setValue(hoy.getFullYear() + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2));
  }

  onGenerar(accion: string) {
    if (!this.periodoControl.value) {
      this.notificacion.notification$.next({ texto: 'Ingrese el período (YYYY-MM)', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    const periodo = this.periodoControl.value;
    const obs = accion === 'nomina'
      ? this.reportesService.onNominaMes(periodo)
      : this.reportesService.onResumenIps(periodo);
    this.generando = true;
    obs.pipe(untilDestroyed(this)).subscribe((base64: string) => {
      this.generando = false;
      this.abrirPdf(base64);
    }, () => { this.generando = false; });
  }

  private abrirPdf(base64: string) {
    if (!base64) {
      this.notificacion.notification$.next({ texto: 'No se pudo generar el reporte', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    const src = base64.startsWith('data:') ? base64 : 'data:application/pdf;base64,' + base64;
    const win = window.open();
    if (win) { win.document.write('<iframe src="' + src + '" frameborder="0" style="width:100%;height:100%"></iframe>'); }
  }
}
