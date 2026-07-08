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
    { titulo: 'Resumen IPS', descripcion: 'Base salarial y aportes al IPS (funcionario y patronal) por funcionario.', icon: 'account_balance', accion: 'ips' },
    { titulo: 'Vales pendientes', descripcion: 'Vales solicitados/confirmados sin descontar, con su monto.', icon: 'request_quote', accion: 'vales' },
    { titulo: 'Préstamos activos', descripcion: 'Préstamos a funcionarios con saldo pendiente.', icon: 'account_balance_wallet', accion: 'prestamos' },
    { titulo: 'Aguinaldo del año', descripcion: 'Aguinaldos calculados del año del período seleccionado.', icon: 'card_giftcard', accion: 'aguinaldo' }
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
    const periodo = this.periodoControl.value;
    const necesitaPeriodo = accion === 'nomina' || accion === 'ips' || accion === 'aguinaldo';
    if (necesitaPeriodo && !periodo) {
      this.notificacion.notification$.next({ texto: 'Ingrese el período (YYYY-MM)', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    let obs;
    switch (accion) {
      case 'nomina': obs = this.reportesService.onNominaMes(periodo); break;
      case 'ips': obs = this.reportesService.onResumenIps(periodo); break;
      case 'vales': obs = this.reportesService.onValesPendientes(); break;
      case 'prestamos': obs = this.reportesService.onPrestamosActivos(); break;
      case 'aguinaldo': obs = this.reportesService.onAguinaldoAnual(Number(periodo.substring(0, 4))); break;
      default: return;
    }
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
