import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService, NotificacionColor } from '../../../notificacion-snackbar.service';
import { DashboardRrhhService } from './dashboard-rrhh.service';
import { DashboardRrhhKpis } from './dashboard-rrhh.model';

interface KpiCard {
  titulo: string;
  valor: number;
  icon: string;
  color: string;
  sub?: string;
  subValor?: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-dashboard-rrhh',
  templateUrl: './dashboard-rrhh.component.html',
  styleUrls: ['./dashboard-rrhh.component.scss']
})
export class DashboardRrhhComponent implements OnInit {

  periodoControl = new FormControl(null);
  kpis: DashboardRrhhKpis = null;
  cards: KpiCard[] = [];

  constructor(
    private dashboardService: DashboardRrhhService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    const hoy = new Date();
    this.periodoControl.setValue(hoy.getFullYear() + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2));
    this.cargar();
  }

  cargar() {
    if (!this.periodoControl.value) { return; }
    this.dashboardService.onGetKpis(this.periodoControl.value)
      .pipe(untilDestroyed(this)).subscribe((res: DashboardRrhhKpis) => {
        if (res == null) {
          this.notificacion.notification$.next({ texto: 'No se pudieron cargar los KPIs', color: NotificacionColor.warn, duracion: 3 });
          return;
        }
        this.kpis = res;
        this.construirCards(res);
      });
  }

  private construirCards(k: DashboardRrhhKpis) {
    this.cards = [
      { titulo: 'Funcionarios activos', valor: k.funcionariosActivos || 0, icon: 'groups', color: 'azul' },
      { titulo: 'Nómina del mes', valor: k.nominaDelMes || 0, icon: 'payments', color: 'verde' },
      { titulo: 'Liquidaciones pendientes', valor: k.liquidacionesPendientes || 0, icon: 'pending_actions', color: 'ambar' },
      { titulo: 'Vales pendientes', valor: k.valesPendientesCantidad || 0, icon: 'request_quote', color: 'azul', sub: 'Monto', subValor: k.valesPendientesMonto || 0 },
      { titulo: 'Préstamos activos', valor: k.prestamosActivosCantidad || 0, icon: 'account_balance', color: 'azul', sub: 'Saldo', subValor: k.prestamosActivosSaldo || 0 },
      { titulo: 'Penalizaciones del mes', valor: k.penalizacionesMesCantidad || 0, icon: 'gavel', color: 'rojo', sub: 'Monto', subValor: k.penalizacionesMesMonto || 0 },
      { titulo: 'Horas extra del mes', valor: k.horasExtraMesCantidad || 0, icon: 'more_time', color: 'verde', sub: 'Monto', subValor: k.horasExtraMesMonto || 0 },
      { titulo: 'Cuotas vencidas', valor: k.cuotasVencidasCantidad || 0, icon: 'event_busy', color: 'rojo' },
      { titulo: 'Aguinaldo estimado (año)', valor: k.aguinaldoEstimadoAnio || 0, icon: 'card_giftcard', color: 'ambar' }
    ];
  }
}
