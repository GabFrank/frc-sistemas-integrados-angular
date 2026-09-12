import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../notificacion-snackbar.service';
import { mensajeDeError } from '../../venta-tarjeta/qr-pos/mensaje-error';
import { TerminalPos } from '../terminal-pos.model';
import { TerminalPosService } from '../terminal-pos.service';

export interface ConfigurarTerminalPosData {
  terminalPos: TerminalPos;
}

/** Un campo del cupón, con el nombre que el administrador entiende. */
interface CampoConfigurable {
  clave: string;
  etiqueta: string;
  exigido: boolean;
  /** Lo declara obligatorio el formato: no se puede destildar desde acá. */
  fijoPorFormato: boolean;
}

const ETIQUETAS: { [clave: string]: string } = {
  codigoAutorizacion: 'Código de autorización',
  numeroBoleta: 'Número de boleta',
  monto: 'Monto del cupón',
  terminal: 'Identificador de la terminal',
  identificadorTransaccion: 'Referencia del proveedor',
  moneda: 'Moneda',
};

/**
 * Configuración por aparato.
 *
 * Dos perillas que la configuración general del módulo no puede cubrir, porque valen para toda la
 * empresa y esto es por máquina: si en ESTA caja se puede tipear el cupón a mano, y qué campos no
 * se pueden dejar vacíos.
 *
 * <b>Apagar la carga a mano puede dejar a una caja sin poder cobrar.</b> El tipo del formato ya
 * cierra el camino que no corresponde —una terminal WEB no ofrece la cámara, una MAQUINA no ofrece
 * el lector— y eso sólo es aceptable porque la carga a mano es la salida universal. El backend
 * rechaza apagarla cuando es el último camino y devuelve el motivo; acá se avisa antes, para que
 * el administrador no llegue al rechazo sin entender por qué.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-configurar-terminal-pos-dialog',
  templateUrl: './configurar-terminal-pos-dialog.component.html',
  styleUrls: ['./configurar-terminal-pos-dialog.component.scss'],
})
export class ConfigurarTerminalPosDialogComponent implements OnInit {

  /** `null` = hereda la configuración general. Tres estados, no dos. */
  cargaManual: boolean = null;
  campos: CampoConfigurable[] = [];
  guardando = false;
  error: string = null;

  /**
   * Por qué esta terminal no puede apagar la carga a mano. `null` = sí puede.
   * Campo plano: el template lo bindea y el repo prohíbe getters en bindings.
   */
  motivoNoSePuedeApagar: string = null;

  titulo = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfigurarTerminalPosData,
    public dialogRef: MatDialogRef<ConfigurarTerminalPosDialogComponent>,
    private terminalPosService: TerminalPosService,
    private notificacionSnackbar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    const t = this.data?.terminalPos;
    this.titulo = [t?.descripcion, t?.codigo].filter(Boolean).join(' - ') || 'Terminal';
    this.cargaManual = t?.cargaManualPermitida ?? null;
    this.motivoNoSePuedeApagar = this.calcularMotivo(t);
    this.campos = this.armarCampos(t);
  }

  /**
   * El mismo criterio que aplica el backend, adelantado a la pantalla.
   *
   * No reemplaza a la validación del servidor —la de verdad es esa, y esta copia puede quedar
   * desactualizada— pero evita que el administrador tenga que chocarse con un rechazo para
   * enterarse de una regla que se puede explicar antes.
   */
  private calcularMotivo(t: TerminalPos): string {
    if (!t?.formatoTerminalPos) {
      return 'Esta terminal no tiene formato asignado, así que la venta con tarjeta ya está ' +
        'bloqueada y la carga a mano es el único camino que le queda.';
    }
    const tipo = t.formatoTerminalPos.tipo;
    if (tipo !== 'MAQUINA' && tipo !== 'WEB') {
      return `Su formato es de tipo ${tipo}, cuyo camino todavía no está implementado. Si además ` +
        'se apaga la carga a mano, esta caja no tiene con qué cobrar.';
    }
    return null;
  }

  /**
   * Los campos que se pueden exigir, y cuáles ya vienen exigidos por el formato.
   *
   * <b>La lista por terminal sólo puede APRETAR.</b> Los que el formato ya declara obligatorios
   * quedan tildados y bloqueados: si se pudieran aflojar, esta pantalla —que parece menor— sería
   * una forma de saltear la validación del formato, que comparten todas las terminales del mismo
   * modelo. El backend lo rechaza igual; acá directamente no se ofrece.
   */
  private armarCampos(t: TerminalPos): CampoConfigurable[] {
    const delFormato = new Set<string>(this.obligatoriosDelFormato(t));
    const propios = new Set<string>(t?.camposObligatorios ?? []);

    return Object.keys(ETIQUETAS)
      .filter((clave) => this.formatoProduce(t, clave))
      .map((clave) => ({
        clave,
        etiqueta: ETIQUETAS[clave],
        exigido: delFormato.has(clave) || propios.has(clave),
        fijoPorFormato: delFormato.has(clave),
      }));
  }

  /** Qué campos produce el formato. Exigir uno que no produce bloquearía todas las ventas. */
  private formatoProduce(t: TerminalPos, clave: string): boolean {
    const mapeo = this.leerMapeo(t);
    // Sin mapeo legible se ofrecen todos: es preferible a una pantalla vacía. El backend valida.
    return mapeo == null ? true : Object.prototype.hasOwnProperty.call(mapeo, clave);
  }

  private obligatoriosDelFormato(t: TerminalPos): string[] {
    const mapeo = this.leerMapeo(t);
    if (!mapeo) return [];
    return Object.keys(mapeo).filter((k) => mapeo[k]?.obligatorio === true);
  }

  private leerMapeo(t: TerminalPos): any {
    try {
      const m = t?.formatoTerminalPos?.mapeo;
      return m ? JSON.parse(m) : null;
    } catch {
      return null;
    }
  }

  onCambiarCarga(valor: boolean): void {
    this.cargaManual = valor;
  }

  onCambiarCampo(clave: string, exigido: boolean): void {
    const c = this.campos.find((x) => x.clave === clave);
    if (c && !c.fijoPorFormato) c.exigido = exigido;
  }

  onGuardar(): void {
    if (this.guardando) return;
    this.guardando = true;
    this.error = null;

    // Lista vacía = null = "que se deduzca del formato". Mandar [] sería decir "ninguno es
    // obligatorio", que es justo lo que esta pantalla no puede decir.
    const exigidos = this.campos.filter((c) => c.exigido).map((c) => c.clave);

    this.terminalPosService
      .onConfigurar(this.data.terminalPos.id, this.cargaManual, exigidos.length ? exigidos : null)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.guardando = false;
          this.notificacionSnackbar.openSucess('Configuración guardada');
          this.dialogRef.close(res ?? true);
        },
        error: (err) => {
          this.guardando = false;
          // El backend devuelve el motivo exacto --por ejemplo que este sería el último camino--
          // y mostrarlo tal cual le dice al administrador qué hacer.
          this.error = mensajeDeError(err, 'No se pudo guardar la configuración.');
          this.notificacionSnackbar.notification$.next({
            color: NotificacionColor.danger,
            texto: this.error,
            duracion: 8,
          });
        },
      });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
