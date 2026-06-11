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
    this.timerSub = timer(REFRESH_MS, REFRESH_MS).subscribe(() => this.fetchAll());
  }

  private loadMonedas(): void {
    this.monedaService
      .onGetAll()
      .pipe(take(1))
      .subscribe((res) => {
        if (!res) return;
        this.monedas = res
          .filter((m) => DEFAULT_DENOMS.includes((m.denominacion || '').toUpperCase()))
          .sort((a, b) => this.denomRank(a) - this.denomRank(b));
        this.fetchAll();
      });
  }

  private fetchAll(): void {
    if (!this.monedas.length) return;
    const next: CotizacionView[] = [];
    let pending = this.monedas.length;
    this.monedas.forEach((moneda) => {
      this.cambioService
        .getUltimoCambioPorMonedaId(moneda.id)
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
            if (--pending === 0) this.emit(next);
          },
          error: () => {
            if (--pending === 0) this.emit(next);
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
