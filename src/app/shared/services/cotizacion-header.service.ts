import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { Cambio } from '../../modules/financiero/cambio/cambio.model';
import { CambioService } from '../../modules/financiero/cambio/cambio.service';
import { Moneda } from '../../modules/financiero/moneda/moneda.model';
import { MonedaService } from '../../modules/financiero/moneda/moneda.service';
import { MainService } from '../../main.service';

export interface CotizacionView {
  moneda: Moneda;
  local: number;
  ventaMercado: number;
  compraMercado: number;
  fecha: Date;
}

const REFRESH_MS = 10 * 60 * 1000;

const DEFAULT_DENOMS = ['DOLAR', 'DOLARES', 'DOLAR AMERICANO', 'REAL', 'REALES'];

@Injectable({ providedIn: 'root' })
export class CotizacionHeaderService implements OnDestroy {
  cotizaciones$ = new BehaviorSubject<CotizacionView[]>([]);

  private monedas: Moneda[] = [];
  /** Evita dos cargas de monedas en vuelo a la vez (timer + botón manual). */
  private cargandoMonedas = false;
  /**
   * Cada `fetchAll` toma un número y solo publica si sigue siendo el más reciente: sin esto, la
   * respuesta lenta de un tick del timer pisa la de un click manual más nuevo.
   */
  private secuencia = 0;
  private authSub: Subscription;
  private timerSub: Subscription;

  constructor(
    private monedaService: MonedaService,
    private cambioService: CambioService,
    private mainService: MainService,
  ) {
    this.authSub = this.mainService.authenticationSub
      .pipe(filter((auth) => !!auth))
      .subscribe(() => this.bootstrap());
  }

  refresh(): void {
    if (!this.monedas.length) {
      this.loadMonedas();
      return;
    }
    this.fetchAll();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.timerSub?.unsubscribe();
  }

  private bootstrap(): void {
    this.timerSub?.unsubscribe();
    this.loadMonedas();
    // refresh() y no fetchAll(): si el bootstrap no pudo cargar las monedas, fetchAll sale
    // temprano con la lista vacía y el header quedaba en «Sin cotización» hasta re-loguear.
    this.timerSub = timer(REFRESH_MS, REFRESH_MS).subscribe(() => this.refresh());
  }

  // Las consultas del header van por los métodos «EnSegundoPlano»: es un poll de fondo, y no puede
  // abrir el spinner global. Ese spinner es uno solo para toda la app con refcount, así que una
  // request colgada del header tapaba la pantalla entera — hasta 5 min con el timeout de reportes.
  private loadMonedas(): void {
    if (this.cargandoMonedas) return;
    this.cargandoMonedas = true;
    this.monedaService
      .onGetAllEnSegundoPlano()
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.cargandoMonedas = false;
          if (!res) return;
          this.monedas = res
            .filter((m) => DEFAULT_DENOMS.includes((m.denominacion || '').toUpperCase()))
            .sort((a, b) => this.denomRank(a) - this.denomRank(b));
          this.fetchAll();
        },
        // Sin red: se reintenta en el próximo tick del timer. No es un error para el usuario.
        error: () => (this.cargandoMonedas = false),
      });
  }

  private fetchAll(): void {
    if (!this.monedas.length) return;
    const mia = ++this.secuencia;
    const next: CotizacionView[] = [];
    let pending = this.monedas.length;
    let fallos = 0;
    const terminar = () => {
      if (--pending !== 0 || mia !== this.secuencia) return;
      // Si no llegó ninguna, se conserva la última conocida: un corte de red de un tick no
      // tiene por qué borrar lo que ya se mostraba. Si la cotización no carga, no pasa nada.
      if (fallos === this.monedas.length) return;
      this.emit(next);
    };
    this.monedas.forEach((moneda) => {
      this.cambioService
        .getUltimoCambioPorMonedaIdEnSegundoPlano(moneda.id)
        .pipe(take(1))
        .subscribe({
          next: (cambio: Cambio) => {
            if (cambio) {
              next.push({
                moneda,
                local: cambio.valorEnGs,
                ventaMercado: cambio.valorEnGsVentaMercado,
                compraMercado: cambio.valorEnGsCompraMercado,
                fecha: cambio.creadoEn,
              });
            }
            terminar();
          },
          error: () => {
            fallos++;
            terminar();
          },
        });
    });
  }

  private emit(next: CotizacionView[]): void {
    next.sort((a, b) => this.denomRank(a.moneda) - this.denomRank(b.moneda));
    this.cotizaciones$.next(next);
  }

  private denomRank(m: Moneda): number {
    const d = (m?.denominacion || '').toUpperCase();
    if (d.startsWith('DOLAR')) return 0;
    if (d.startsWith('REAL')) return 1;
    return 99;
  }
}
