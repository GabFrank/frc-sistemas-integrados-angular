import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { VersionClienteService } from '../../../configuracion/version-cliente/version-cliente.service';
import {
  LARGO_MAXIMO_VERSION_MINIMA, normalizarVersionMinima, PATRON_VERSION_MINIMA
} from '../../../../commons/core/utils/versionUtils';
import {
  ConfiguracionMonedaModulo,
  ModuloMoneda,
  MODULOS_MONEDA
} from './configuracion-moneda-modulo.model';
import {
  ConfiguracionMonedaModuloService, configuracionesVisibles, esCentralSinMonedaPorModulo, otrasActivasConLaMismaMoneda
} from './configuracion-moneda-modulo.service';
import { AddConfiguracionMonedaModuloDialogComponent } from './add-configuracion-moneda-modulo-dialog/add-configuracion-moneda-modulo-dialog.component';

/** Fila de la tabla con los textos ya armados (el template no llama funciones). */
interface FilaConfiguracion {
  configuracion: ConfiguracionMonedaModulo;
  id: number;
  modulo: string;
  sucursal: string;
  moneda: string;
  vigenteDesde: Date;
  activo: boolean;
  usuario: string;
  /** Hay un cambio de `activo` en vuelo para esta fila. */
  guardando: boolean;
}

type EstadoCarga = 'cargando' | 'error' | 'vacio' | 'datos';

/**
 * Moneda por módulo: qué moneda usa cada módulo (compras, costos, precios, PDV, facturación) desde cuándo.
 *
 * Las filas no se editan: «Nueva configuración» crea otra, y desactivar la vigente vuelve el módulo
 * a la anterior activa. Sin filas, todos los módulos usan la moneda de la empresa.
 *
 * Abajo, solo para ADMIN, la versión mínima del escritorio que admite el central.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-configuracion-moneda-modulo',
  templateUrl: './configuracion-moneda-modulo.component.html',
  styleUrls: ['./configuracion-moneda-modulo.component.scss']
})
export class ConfiguracionMonedaModuloComponent implements OnInit {

  readonly modulos = MODULOS_MONEDA;
  moduloFiltroControl = new FormControl<ModuloMoneda | null>(null);
  /** false = una vista por módulo y sucursal (la que rige y las programadas); true = todas las filas. */
  verHistorialControl = new FormControl(false);
  /** Lo que devolvió el central, sin agrupar. */
  private todas: ConfiguracionMonedaModulo[] = [];

  displayedColumns = ['modulo', 'sucursal', 'moneda', 'vigenteDesde', 'activo', 'usuario'];
  dataSource = new MatTableDataSource<FilaConfiguracion>([]);
  estado: EstadoCarga = 'cargando';
  mensajeError = '';

  puedeConfigurar = false;
  esAdmin = false;

  /** `4.12.0` o `4.12.0-alpha.345` (#710). Vacío apaga el control. */
  versionMinimaControl = new FormControl('', [
    Validators.pattern(PATRON_VERSION_MINIMA), Validators.maxLength(LARGO_MAXIMO_VERSION_MINIMA),
  ]);
  /** null = sin control; undefined = no se pudo leer. */
  versionMinimaActual: string | null | undefined = undefined;
  guardandoVersion = false;

  constructor(
    private service: ConfiguracionMonedaModuloService,
    private versionClienteService: VersionClienteService,
    private mainService: MainService,
    private dialog: MatDialog,
    private dialogos: DialogosService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.puedeConfigurar = this.mainService.tieneAlgunRol([ROLES.CONFIGURAR_MONEDA, ROLES.ADMIN]);
    this.esAdmin = this.mainService.tieneAlgunRol([ROLES.ADMIN]);
    this.cargar();
    if (this.esAdmin) this.cargarVersionMinima();
  }

  cargar(): void {
    this.estado = 'cargando';
    this.mensajeError = '';
    this.service.onGetConfiguraciones(this.moduloFiltroControl.value)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.todas = res || [];
          this.aplicarVista();
          this.estado = this.todas.length ? 'datos' : 'vacio';
        },
        error: (err) => {
          this.todas = [];
          this.dataSource.data = [];
          this.estado = 'error';
          // Un central sin V258.5 no conoce el tipo ni la query: no es una falla, falta actualizarlo.
          if (esCentralSinMonedaPorModulo(err)) {
            this.mensajeError = 'El servidor central todavía no tiene esta función: hay que actualizarlo.';
            return;
          }
          this.mensajeError = err?.message || 'No se pudo consultar el servidor.';
          this.notificacion.openAlgoSalioMal('No se pudieron cargar las configuraciones: ' + this.mensajeError);
        },
      });
  }

  aplicarVista(): void {
    const filas = this.verHistorialControl.value ? this.todas : configuracionesVisibles(this.todas, new Date());
    this.dataSource.data = filas.map((c) => this.aFila(c));
  }

  onLimpiarFiltro(): void {
    this.moduloFiltroControl.setValue(null);
    this.cargar();
  }

  onNueva(): void {
    if (!this.puedeConfigurar) return;
    this.dialog.open(AddConfiguracionMonedaModuloDialogComponent, {
      width: '520px',
      data: { modulo: this.moduloFiltroControl.value },
    }).afterClosed().pipe(take(1)).subscribe((res) => {
      if (res) {
        this.service.refrescarMonedasDeModulo();
        this.cargar();
      }
    });
  }

  onToggleActivo(fila: FilaConfiguracion, activo: boolean): void {
    if (!this.puedeConfigurar || fila.guardando) {
      fila.activo = !activo;
      return;
    }
    const titulo = activo ? 'Activar configuración' : 'Desactivar configuración';
    // Con otras activas iguales debajo, desactivar esta no cambia la moneda: hay que decirlo.
    const repetidas = activo ? 0 : otrasActivasConLaMismaMoneda(this.todas, fila.configuracion);
    const detalle = activo
      ? `${fila.modulo} (${fila.sucursal}) vuelve a usar ${fila.moneda} desde su fecha de vigencia.`
      : `Si es la vigente, ${fila.modulo} (${fila.sucursal}) vuelve a la configuración activa anterior, o a la moneda de la empresa.`
        + (repetidas ? ` Hay ${repetidas} más activa${repetidas > 1 ? 's' : ''} con ${fila.moneda}: para dejar de usarla, desactivalas desde «Ver historial».` : '');
    this.dialogos.confirm(titulo, detalle, null, null, true, 'Sí', 'No', null, true, !activo)
      .pipe(take(1))
      .subscribe((ok) => {
        if (ok !== true) {
          fila.activo = !activo;
          return;
        }
        fila.guardando = true;
        this.service.onSetActivo(fila.id, activo).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            fila.guardando = false;
            this.notificacion.openSucess(activo ? 'Configuración activada' : 'Configuración desactivada');
            this.service.refrescarMonedasDeModulo();
            this.cargar();
          },
          // El rechazo ya lo avisó el genérico: la fila vuelve a como estaba.
          error: () => {
            fila.guardando = false;
            fila.activo = !activo;
          },
        });
      });
  }

  private cargarVersionMinima(): void {
    this.versionClienteService.onGetVersionMinimaEnSegundoPlano()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (version) => {
          this.versionMinimaActual = version ?? null;
          this.versionMinimaControl.setValue(version || '');
        },
        // Un central sin la consulta: la sección lo dice y no deja guardar.
        error: () => (this.versionMinimaActual = undefined),
      });
  }

  onGuardarVersionMinima(): void {
    if (!this.esAdmin || this.guardandoVersion || this.versionMinimaControl.invalid) return;
    const valor = normalizarVersionMinima(this.versionMinimaControl.value);
    this.guardandoVersion = true;
    this.versionClienteService.onSetVersionMinima(valor || null).pipe(untilDestroyed(this)).subscribe({
      next: (version) => {
        this.guardandoVersion = false;
        this.versionMinimaActual = version || null;
        this.versionMinimaControl.setValue(version || '');
        this.notificacion.openSucess(version ? `Versión mínima: ${version}` : 'Control de versión mínima apagado');
      },
      error: () => (this.guardandoVersion = false),
    });
  }

  private aFila(c: ConfiguracionMonedaModulo): FilaConfiguracion {
    return {
      configuracion: c,
      id: c.id,
      modulo: c.modulo,
      sucursal: c.sucursal?.nombre || 'Todas',
      moneda: c.moneda ? `${c.moneda.denominacion}${c.moneda.simbolo ? ' (' + c.moneda.simbolo + ')' : ''}` : '-',
      vigenteDesde: c.vigenteDesde,
      activo: c.activo !== false,
      usuario: c.usuarioNickname || '-',
      guardando: false,
    };
  }
}
