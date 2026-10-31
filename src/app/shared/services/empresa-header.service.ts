import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { CONTEXTO_SONDEO } from '../../generics/generic-crud.constantes';
import { GenericCrudService } from '../../generics/generic-crud.service';
import { MainService } from '../../main.service';
import { ConfiguracionGeneralGQL } from '../../modules/empresarial/configuracion-general/graphql/configuracionGeneral';

/** Si la base no tiene configuración general cargada, el header sigue diciendo esto. */
export const NOMBRE_EMPRESA_POR_DEFECTO = 'BODEGA FRANCO';

const CLAVE = 'frc.nombreEmpresa';

/**
 * Nombre de la empresa que muestra el header, leído de `configuracion_general` del central.
 * Cada instancia tiene su base (bodega → BODEGA FRANCO, farmacia → FARMACIA FRANCO), así que
 * el código no cambia por instancia. La consulta va siempre al central, también en modo local.
 * El último nombre queda guardado en esta PC para no mostrar el de por defecto antes del login.
 */
@Injectable({ providedIn: 'root' })
export class EmpresaHeaderService implements OnDestroy {
  nombreEmpresa$ = new BehaviorSubject<string>(EmpresaHeaderService.leerGuardado());

  private authSub: Subscription;

  constructor(
    private genericService: GenericCrudService,
    private configuracionGeneralGQL: ConfiguracionGeneralGQL,
    private mainService: MainService,
  ) {
    this.authSub = this.mainService.authenticationSub
      .pipe(filter((auth) => !!auth))
      .subscribe(() => this.cargar());
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  // Consulta de fondo: sin spinner global ni avisos (igual que las cotizaciones del header).
  private cargar(): void {
    this.genericService
      .onCustomQuery(this.configuracionGeneralGQL, {}, true, { networkError: { propagate: true } }, true, CONTEXTO_SONDEO)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          const nombre = (res?.nombreEmpresa ?? '').trim().toUpperCase();
          if (!nombre) return;
          this.nombreEmpresa$.next(nombre);
          EmpresaHeaderService.guardar(nombre);
        },
        error: () => {},
      });
  }

  private static leerGuardado(): string {
    try {
      return localStorage.getItem(CLAVE) || NOMBRE_EMPRESA_POR_DEFECTO;
    } catch {
      return NOMBRE_EMPRESA_POR_DEFECTO;
    }
  }

  private static guardar(nombre: string): void {
    try {
      localStorage.setItem(CLAVE, nombre);
    } catch {}
  }
}
