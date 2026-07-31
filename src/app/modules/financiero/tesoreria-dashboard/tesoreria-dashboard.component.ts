import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin } from 'rxjs';
import { TesoreriaReporteService } from './tesoreria-reporte.service';
import { SaldoTesoreria, VencimientoTesoreria, AgingTesoreria } from './tesoreria-reporte.model';

// Nota: dashboard de solo lectura (query-only, sin mutaciones) — no requiere flag
// `puedeGestionar` ni gating de botones; el acceso a la pantalla en sí ya está
// gateado por rol desde el menú (ver side-mini-variant.component.ts, acción
// 'tesoreria-dashboard': TESORERIA_VER/TESORERIA_GESTIONAR/ADMIN).
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-tesoreria-dashboard',
  templateUrl: './tesoreria-dashboard.component.html',
  styleUrls: ['./tesoreria-dashboard.component.scss']
})
export class TesoreriaDashboardComponent implements OnInit {

  isLoading = false;

  saldoList: SaldoTesoreria[] = [];
  vencimientoList: VencimientoTesoreria[] = [];
  aging: AgingTesoreria;

  diasControl = 30;

  displayedColumnsSaldo = ['moneda', 'efectivo', 'banco', 'bancoReservado', 'total'];
  displayedColumnsVencimiento = ['tipo', 'descripcion', 'monto', 'fecha', 'diasRestantes'];

  constructor(
    private tesoreriaReporteService: TesoreriaReporteService,
  ) { }

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo() {
    this.isLoading = true;
    forkJoin({
      saldo: this.tesoreriaReporteService.onGetSaldoConsolidado(),
      vencimientos: this.tesoreriaReporteService.onGetProximosVencimientos(this.diasControl),
      aging: this.tesoreriaReporteService.onGetAgingCpp(),
    }).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.saldoList = res.saldo || [];
        this.vencimientoList = (res.vencimientos || []).map(v => ({
          ...v,
          // Bandera pre-calculada para no llamar funciones desde el HTML
          vencido: v.diasRestantes != null && v.diasRestantes < 0
        }));
        this.aging = res.aging || new AgingTesoreria();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onCambiarDias(dias: number) {
    this.diasControl = dias;
    this.cargarTodo();
  }

  onRefrescar() {
    this.cargarTodo();
  }
}
