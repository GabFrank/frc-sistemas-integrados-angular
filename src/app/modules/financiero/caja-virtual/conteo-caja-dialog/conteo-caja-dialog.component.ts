import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual, CajaVirtualTipoMovimiento, MovimientoCajaVirtual } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaBillete } from '../../moneda/moneda-billetes/moneda-billetes.model';
import { MonedaBilletesService } from '../../moneda/moneda-billetes/moneda-billetes.service';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { GrillaConteoComponent } from '../../../../shared/components/grilla-conteo/grilla-conteo.component';

export interface ConteoCajaDialogData {
  cajaVirtual: CajaVirtual;
  moneda: Moneda;
  /** Saldo que el sistema tiene registrado para (caja, moneda) — contra esto se calcula la diferencia. */
  saldoSistema: number;
  /** Color de la card que abrió el diálogo, para que el diálogo se lea como continuación de ella. */
  color?: string;
}

/** Lo que se guarda en localStorage. Se indexa por VALOR y no por id de billete:
 *  el id puede cambiar si se recrea la denominación, el valor no. */
interface ConteoGuardado {
  cantidades: { [valor: string]: number };
  actualizadoEn: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-conteo-caja-dialog',
  templateUrl: './conteo-caja-dialog.component.html',
  styleUrls: ['./conteo-caja-dialog.component.scss']
})
export class ConteoCajaDialogComponent implements OnInit {

  @ViewChild(GrillaConteoComponent) grilla: GrillaConteoComponent;

  /** digitsInfo del pipe number para los valores de denominación. */
  formato = '1.0-2';
  total = 0;
  diferencia = 0;
  /** Etiqueta y color de la diferencia, precalculados (no se llaman funciones desde el HTML). */
  diferenciaLabel = '';
  diferenciaColor = '#b0bec5';
  hayDiferencia = false;

  /** Decimales de la moneda: define el redondeo de la diferencia y el formato mostrado. */
  private decimales = 2;

  cargando = true;
  guardando = false;
  puedeGestionar = false;
  actualizadoEn: string = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConteoCajaDialogData,
    private dialogRef: MatDialogRef<ConteoCajaDialogComponent>,
    private monedaBilletesService: MonedaBilletesService,
    private cajaVirtualService: CajaVirtualService,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    const m = this.data.moneda;
    this.decimales = m?.decimales != null
      ? m.decimales
      : ((m?.denominacion || '').toUpperCase().includes('GUARAN') ? 0 : 2);
    this.formato = `1.0-${this.decimales}`;
    const guardado = this.leerGuardado();
    this.cantidadesGuardadas = guardado?.cantidades || {};
    this.actualizadoEn = guardado?.actualizadoEn || null;
    this.cargando = false;
  }

  /** Clave de persistencia local: una por (caja, moneda). */
  private get storageKey(): string {
    return `frc.conteo-caja-virtual.${this.data.cajaVirtual?.id}.${this.data.moneda?.id}`;
  }

  /** Cantidades con las que arranca la grilla, recuperadas de localStorage. */
  cantidadesGuardadas: { [valor: string]: number } = {};

  /** La grilla avisa cuánto sumó; acá se compara contra el saldo del sistema. */
  onTotalChange(total: number) {
    this.total = total;
    this.recalcular();
  }

  /** La grilla avisa qué cantidades hay cargadas; acá se persisten. */
  onCantidadesChange(cantidades: { [valor: string]: number }) {
    this.cantidadesGuardadas = cantidades;
    this.guardarLocal();
  }

  private leerGuardado(): ConteoGuardado {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) as ConteoGuardado : null;
    } catch {
      return null;
    }
  }

  /** Persiste el conteo en cada cambio: cerrar el diálogo (o la app) no debe perderlo. */
  /** Persiste el conteo en cada cambio: cerrar el diálogo no debe perderlo. */
  private guardarLocal() {
    const payload: ConteoGuardado = {
      cantidades: this.cantidadesGuardadas,
      actualizadoEn: new Date().toISOString(),
    };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
      this.actualizadoEn = payload.actualizadoEn;
    } catch {
      // Cuota llena / modo privado: el conteo sigue usable en memoria, solo no sobrevive.
    }
  }

  private recalcular() {
    const sistema = this.data.saldoSistema || 0;
    // Redondear a los decimales de la moneda: restar dos doubles deja basura binaria
    // (3339.78 - 3300 = 39.780000000000002) que terminaría posteada como cantidad del AJUSTE.
    const f = Math.pow(10, this.decimales);
    this.diferencia = Math.round((this.total - sistema) * f) / f;
    this.hayDiferencia = Math.abs(this.diferencia) > 0.005;
    if (!this.hayDiferencia) {
      this.diferenciaLabel = 'Sin diferencia';
      this.diferenciaColor = '#81c784';
    } else if (this.diferencia > 0) {
      this.diferenciaLabel = 'Sobrante';
      this.diferenciaColor = '#64b5f6';
    } else {
      this.diferenciaLabel = 'Faltante';
      this.diferenciaColor = '#ff8a80';
    }
  }

  onLimpiar() {
    this.dialogosService.confirm(
      'Limpiar conteo', '¿Borrar todas las cantidades cargadas?', null, null, true, 'Sí, limpiar', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true) return;
      this.grilla?.limpiar();
    });
  }

  onCopiarTotal() {
    const texto = String(this.total);
    const ok = (msg: string) => this.notificacion.notification$.next(
      { texto: msg, color: NotificacionColor.success, duracion: 2 });
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(texto)
        .then(() => ok('Total copiado'))
        .catch(() => this.copiarFallback(texto));
    } else {
      this.copiarFallback(texto);
    }
  }

  /** Electron viejo / contexto sin permiso de clipboard: input temporal + execCommand. */
  private copiarFallback(texto: string) {
    try {
      const el = document.createElement('textarea');
      el.value = texto;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.notificacion.notification$.next({ texto: 'Total copiado', color: NotificacionColor.success, duracion: 2 });
    } catch {
      this.notificacion.notification$.next({ texto: 'No se pudo copiar', color: NotificacionColor.warn, duracion: 3 });
    }
  }

  /**
   * Postea un AJUSTE firmado por la diferencia, dejando el saldo del sistema igual al contado.
   * El AJUSTE conserva el signo de la cantidad en TesoreriaService.signedDelta, así que la
   * diferencia va tal cual (negativa si falta plata).
   */
  onCrearAjuste() {
    if (!this.hayDiferencia || this.guardando) return;
    const simbolo = this.data.moneda?.simbolo || '';
    const signo = this.diferencia > 0 ? '+' : '';
    this.dialogosService.confirm(
      'Crear ajuste por conteo',
      `Se registrará un AJUSTE de ${signo}${this.fmt(this.diferencia)} ${simbolo} para dejar el saldo del sistema igual al conteo.`,
      `Sistema: ${this.fmt(this.data.saldoSistema)} ${simbolo} · Contado: ${this.fmt(this.total)} ${simbolo}`,
      null, true, 'Sí, ajustar', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true) return;
      this.guardando = true;
      const mov = new MovimientoCajaVirtual();
      mov.cajaVirtual = this.data.cajaVirtual;
      mov.tipoMovimiento = CajaVirtualTipoMovimiento.AJUSTE;
      mov.cantidad = this.diferencia;
      mov.moneda = this.data.moneda;
      mov.usuario = this.mainService.usuarioActual;
      mov.activo = true;
      mov.descripcion = `AJUSTE POR CONTEO DE CAJA (SISTEMA ${this.fmt(this.data.saldoSistema)} / CONTADO ${this.fmt(this.total)})`;
      this.cajaVirtualService.onSaveMovimiento(mov)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: r => {
            this.guardando = false;
            if (r == null) return;
            // El snackbar de éxito lo emite GenericCrudService.onSaveCustom; no duplicarlo acá.
            this.dialogRef.close(true);
          },
          error: err => {
            this.guardando = false;
            const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo crear el ajuste';
            this.notificacion.notification$.next({ texto: msg, color: NotificacionColor.warn, duracion: 5 });
          }
        });
    });
  }

  /** Formato es-PY con los decimales de la moneda (el mensaje de confirmación no pasa por pipes). */
  private fmt(n: number): string {
    return (n || 0).toLocaleString('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: this.decimales,
    });
  }

  onCancelar() {
    this.dialogRef.close(false);
  }
}
