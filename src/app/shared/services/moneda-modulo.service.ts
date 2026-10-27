import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { MainService } from '../../main.service';
import { GenericCrudService } from '../../generics/generic-crud.service';
import { CONTEXTO_SONDEO, LECTURA_ESTRICTA } from '../../generics/generic-crud.constantes';
import { Moneda } from '../../modules/financiero/moneda/moneda.model';
import { MonedaService } from '../../modules/financiero/moneda/moneda.service';
import { MonedaDeModuloGQL } from '../../modules/financiero/moneda/graphql/monedaDeModulo';
import { MonedaEmpresaGQL } from '../../modules/financiero/moneda/graphql/monedaEmpresa';
import { ModuloMoneda } from '../../modules/financiero/moneda/configuracion-moneda-modulo/configuracion-moneda-modulo.model';

/**
 * La moneda de la empresa entre una lista de monedas, para un central que no tiene `monedaEmpresa`:
 * la marcada principal; si no hay, la del guaraní (por denominación); si tampoco, la primera.
 */
export function elegirMonedaEmpresa(monedas: Moneda[] | null | undefined): Moneda | null {
  if (!monedas?.length) return null;
  return monedas.find((m) => m?.principal === true)
    ?? monedas.find((m) => (m?.denominacion || '').toUpperCase().includes('GUARANI'))
    ?? monedas[0];
}

/**
 * Qué moneda usa cada módulo (`monedaDeModulo` del central) y cuál es la de la empresa
 * (`monedaEmpresa`). Sin configuración, todos los módulos usan la de la empresa.
 *
 * Arranca con el login, como `CotizacionHeaderService`: consultas de fondo, sin spinner global ni
 * avisos. Contra un central que todavía no tiene estas consultas, cae a la lista de monedas: la
 * principal, si no el guaraní, si no la primera. Así ningún consumidor se queda sin moneda.
 *
 * Se instancia desde `AppComponent` para escuchar el login desde el arranque.
 */
@Injectable({ providedIn: 'root' })
export class MonedaModuloService implements OnDestroy {

  /** La moneda de la empresa; null hasta resolverla. */
  readonly empresa$ = new BehaviorSubject<Moneda | null>(null);

  /**
   * true = el central contesta las consultas nuevas; false = no las conoce (se usa el respaldo);
   * null = todavía no se sabe.
   */
  readonly contratoNuevo$ = new BehaviorSubject<boolean | null>(null);

  private porModulo = new Map<string, BehaviorSubject<Moneda | null>>();
  private cargandoEmpresa = false;
  private authSub: Subscription;

  constructor(
    private mainService: MainService,
    private genericService: GenericCrudService,
    private monedaService: MonedaService,
    private monedaDeModuloGQL: MonedaDeModuloGQL,
    private monedaEmpresaGQL: MonedaEmpresaGQL,
  ) {
    this.authSub = this.mainService.authenticationSub.subscribe((auth) => {
      if (auth) {
        this.bootstrap();
      } else if (auth === false) {
        this.limpiar();
      }
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  /**
   * La moneda de un módulo; para PDV, de la sucursal (sin sucursal = la de toda la empresa).
   * Emite cuando se resuelve y de nuevo tras {@link refrescar}. Nunca emite null.
   */
  monedaDe(modulo: ModuloMoneda, sucursalId?: number | null): Observable<Moneda> {
    const clave = `${modulo}|${sucursalId ?? ''}`;
    let sujeto = this.porModulo.get(clave);
    if (!sujeto) {
      sujeto = new BehaviorSubject<Moneda | null>(null);
      this.porModulo.set(clave, sujeto);
      this.cargarModulo(modulo, sucursalId ?? null, sujeto);
    }
    return sujeto.pipe(filter((m) => m != null));
  }

  /** Vuelve a leer todo (tras guardar o desactivar una configuración). */
  refrescar(): void {
    this.cargarEmpresa();
    this.porModulo.forEach((sujeto, clave) => {
      const [modulo, sucursal] = clave.split('|');
      this.cargarModulo(modulo as ModuloMoneda, sucursal ? Number(sucursal) : null, sujeto);
    });
  }

  private bootstrap(): void {
    this.contratoNuevo$.next(null);
    this.refrescar();
  }

  private limpiar(): void {
    this.empresa$.next(null);
    this.contratoNuevo$.next(null);
    // Los sujetos se conservan (alguien puede estar suscripto): vuelven a null, que no se emite,
    // y el próximo login los vuelve a cargar.
    this.porModulo.forEach((sujeto) => sujeto.next(null));
  }

  private cargarEmpresa(): void {
    if (this.cargandoEmpresa) return;
    this.cargandoEmpresa = true;
    this.genericService
      .onCustomQuery(this.monedaEmpresaGQL, {}, true, LECTURA_ESTRICTA, true, CONTEXTO_SONDEO)
      .pipe(take(1))
      .subscribe({
        next: (moneda: Moneda) => {
          this.cargandoEmpresa = false;
          this.contratoNuevo$.next(true);
          if (moneda) {
            this.empresa$.next(moneda);
          } else {
            this.empresaDesdeLista();
          }
        },
        error: () => {
          this.cargandoEmpresa = false;
          this.contratoNuevo$.next(false);
          this.empresaDesdeLista();
        },
      });
  }

  /** Respaldo para un central sin `monedaEmpresa`: la elige de la lista de monedas. */
  private empresaDesdeLista(): void {
    this.monedaService
      .onGetAllEnSegundoPlano(true, { graphError: { show: false }, networkError: { show: false, propagate: true } })
      .pipe(take(1))
      .subscribe({
        next: (monedas) => {
          const elegida = elegirMonedaEmpresa(monedas);
          if (elegida) this.empresa$.next(elegida);
        },
        // Sin red: se vuelve a intentar en el próximo login o refresco.
        error: () => {},
      });
  }

  private cargarModulo(modulo: ModuloMoneda, sucursalId: number | null,
                       sujeto: BehaviorSubject<Moneda | null>): void {
    if (this.contratoNuevo$.value === false) {
      this.usarEmpresa(sujeto);
      return;
    }
    this.genericService
      .onCustomQuery(this.monedaDeModuloGQL, { modulo, sucursalId }, true, LECTURA_ESTRICTA, true, CONTEXTO_SONDEO)
      .pipe(take(1))
      .subscribe({
        next: (moneda: Moneda) => (moneda ? sujeto.next(moneda) : this.usarEmpresa(sujeto)),
        error: () => this.usarEmpresa(sujeto),
      });
  }

  private usarEmpresa(sujeto: BehaviorSubject<Moneda | null>): void {
    const actual = this.empresa$.value;
    if (actual) {
      sujeto.next(actual);
      return;
    }
    if (!this.cargandoEmpresa) this.cargarEmpresa();
    this.empresa$.pipe(filter((m) => m != null), take(1)).subscribe((m) => sujeto.next(m));
  }
}
