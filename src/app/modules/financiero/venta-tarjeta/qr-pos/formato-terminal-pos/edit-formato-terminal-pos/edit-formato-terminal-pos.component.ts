import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { mensajeDeError } from '../../mensaje-error';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../../../notificacion-snackbar.service';
import { MainService } from '../../../../../../main.service';
import { FormatoQrPos } from '../../formato-qr-pos.model';
import { MAX_LONGITUD_QR, parsearCupon } from '../../qr-pos-parser';
import { ProveedorServicio } from '../../../../../personas/proveedor-servicio/proveedor-servicio.model';
import { ProveedorServicioService } from '../../../../../personas/proveedor-servicio/proveedor-servicio.service';
import {
  FormatoTerminalPos,
  TIPOS_FORMATO_TERMINAL,
  TIPO_MAQUINA,
} from '../formato-terminal-pos.model';
import { FormatoTerminalPosService } from '../formato-terminal-pos.service';
import { VistaPreviaFormatoComponent } from '../vista-previa-formato/vista-previa-formato.component';

/** La solapa del patrón y la cadena de ejemplo. */
const TAB_COMO_SE_LEE = 1;

/** La última solapa. Al entrar hay que recargar lo que muestra. */
const TAB_VISTA_PREVIA = 4;

export interface EditFormatoTerminalPosData {
  formato?: FormatoTerminalPos;
}

interface FilaPreview {
  campo: string;
  valor: string;
}

/**
 * Alta y edición de un formato de terminal POS.
 *
 * La pantalla existe para no tener que hacer un release cada vez que aparece un modelo de aparato
 * nuevo. Como el patrón que se carga acá termina corriendo en la caja de cada sucursal, no deja
 * guardar nada que no se haya probado antes contra la cadena de ejemplo: la vista previa de abajo
 * es exactamente lo que el PDV va a leer del cupón.
 *
 * <b>La diferencia con el ABM viejo de `formato_qr_pos`</b>: allá la unicidad era por proveedor y
 * el mensaje era «el proveedor ya tiene el formato X». Eso prohibía lo que esta tabla existe para
 * permitir —Bancard v5.2 y v5.5 conviviendo— así que acá un proveedor puede tener varios, y lo
 * que no se puede repetir es el nombre dentro del proveedor.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-edit-formato-terminal-pos',
  templateUrl: './edit-formato-terminal-pos.component.html',
  styleUrls: ['./edit-formato-terminal-pos.component.scss'],
})
export class EditFormatoTerminalPosComponent implements OnInit {

  formGroup: FormGroup;
  guardando = false;

  /** Algo se guardó --el formato o su mapa--, así que la lista tiene que recargar al cerrar. */
  private huboCambios = false;

  preview: FilaPreview[] = [];
  errorPreview: string = null;

  readonly maxLongitud = MAX_LONGITUD_QR;
  readonly tipos = TIPOS_FORMATO_TERMINAL;

  /**
   * Campos, no getters: este repo prohibe getters en bindings porque se re-evaluan en cada ciclo
   * de change detection. Se actualizan desde `valueChanges`, que es donde el valor cambia.
   */
  ayudaTipo: string = null;
  esMaquina = false;

  tabActivo = 0;

  /**
   * El formato tal como está guardado. El panel del mapa lo necesita con id: las regiones cuelgan
   * de él, y un formato que todavía no se guardó no tiene dónde colgarlas.
   */
  formatoGuardado: FormatoTerminalPos = null;

  @ViewChild('vistaPrevia') vistaPrevia: VistaPreviaFormatoComponent;

  /**
   * Qué tab tiene algo sin completar. Con los campos repartidos en tabs, un requerido vacío puede
   * quedar escondido detrás de otra solapa: sin esto el usuario ve un Guardar que no guarda y no
   * tiene forma de saber por qué.
   */
  incompletos = { aparato: false, lectura: false, campos: false };

  proveedores: ProveedorServicio[] = [];

  /** Se ofrece como punto de partida: es el formato que ya está en producción. */
  readonly mapeoEjemplo = JSON.stringify(
    {
      codigoAutorizacion: { de: 'auth', obligatorio: true },
      numeroBoleta: { de: 'bol' },
      moneda: { de: 'cur', mapa: { PYG: 1, BRL: 2, USD: 3 } },
      monto: { de: 'amt', escalaSegunMoneda: true, obligatorio: true },
      identificadorTransaccion: { de: 'ref' },
      fecha: { de: 'ts', formato: 'yyyyMMddHHmm', zona: 'America/Asuncion' },
    },
    null,
    2
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditFormatoTerminalPosData,
    private dialogRef: MatDialogRef<EditFormatoTerminalPosComponent>,
    private formatoService: FormatoTerminalPosService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private mainService: MainService,
    private proveedorServicioService: ProveedorServicioService
  ) {}

  ngOnInit(): void {
    const f = this.data?.formato;
    this.formatoGuardado = f?.id ? f : null;
    this.formGroup = new FormGroup({
      nombre: new FormControl(f?.nombre || null, Validators.required),
      // El tipo no tiene default: elegirlo es una decisión, y un default silencioso deja
      // terminales leyendo por el camino equivocado sin que nadie lo haya decidido.
      tipo: new FormControl(f?.tipo || null, Validators.required),
      // Obligatorios porque los DOS tipos que esta pantalla ofrece matchean texto. Si algún día se
      // ofrece API --que no parsea texto y puede no tener patrón-- estos dos pasan a condicionales.
      patron: new FormControl(f?.patron || null, Validators.required),
      // Indentado al abrir: en la base se guarda como venga --a veces una sola linea de 200
      // caracteres-- y asi no se lee ni se corrige. Si no es JSON valido se deja tal cual, que es
      // justamente cuando hay que poder verlo para arreglarlo.
      mapeo: new FormControl(indentar(f?.mapeo) || null, Validators.required),
      ejemplo: new FormControl(f?.ejemplo || null, Validators.required),
      activo: new FormControl(f?.activo !== false),
      // null = comodín: se prueba cuando la terminal no tiene un formato propio asignado.
      proveedorServicioId: new FormControl(
        f?.proveedorServicioId ?? f?.proveedorServicio?.id ?? null
      ),
    });

    this.proveedorServicioService
      .onGetPaginated(0, 200)
      .pipe(untilDestroyed(this))
      .subscribe((res) => (this.proveedores = res?.getContent ?? []));

    // El preview se recalcula solo. Es la única forma de que quien carga el formato vea, antes de
    // guardar, que el patrón separa los campos donde corresponde: un grupo corrido deja el importe
    // en el lugar de la boleta y eso en producción se descubre cobrando.
    this.formGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.refrescarTipo();
      this.refrescarIncompletos();
      this.recalcular();
    });
    this.refrescarTipo();
    this.refrescarIncompletos();
    this.recalcular();
  }

  /**
   * Qué camino se abre con el tipo elegido y, sobre todo, cuál se cierra. Es lo que el
   * administrador necesita leer antes de guardar.
   */
  private refrescarTipo(): void {
    const v = this.formGroup.get('tipo').value;
    this.ayudaTipo = this.tipos.find((t) => t.valor === v)?.ayuda || null;
    this.esMaquina = v === TIPO_MAQUINA;
  }

  private refrescarIncompletos(): void {
    const falta = (c: string) => this.formGroup.get(c).invalid;
    this.incompletos = {
      aparato: falta('nombre') || falta('tipo'),
      lectura: falta('patron') || falta('ejemplo'),
      campos: falta('mapeo'),
    };
  }

  private recalcular(): void {
    this.preview = [];
    this.errorPreview = null;

    const { patron, mapeo, ejemplo } = this.formGroup.value;
    if (!patron || !mapeo || !ejemplo) return;

    // Se usa el mismo motor que el PDV, no una imitación: si acá se ve bien, en la caja se ve
    // igual. Los decimales van fijos porque son los de financiero.moneda.
    const formato: FormatoQrPos = { nombre: 'previsualización', patron, mapeo, ejemplo, activo: true };
    const r = parsearCupon(ejemplo, [formato], { 1: 0, 2: 2, 3: 2 });
    if (!r.ok) {
      // El motor devuelve el mensaje del CAJERO --"registralo desde el celular"--, que acá no
      // significa nada: quien mira esta pantalla está escribiendo el patrón, no cobrando. El
      // motivo real es siempre el mismo y es el único accionable.
      this.errorPreview = 'El patrón se aplica sobre el texto que devuelve el OCR --con sus'
        + ' rarezas: un cero donde el papel dice O, un paréntesis de otro ancho-- y no sobre lo que'
        + ' dice el papel. Subí la foto en "El mapa del cupón" y tocá "Usar como cadena de ejemplo":'
        + ' trae el texto exacto, que a mano es imposible de acertar.';
      return;
    }
    const d = r.datos;
    this.preview = [
      { campo: 'Código de autorización', valor: mostrar(d.codigoAutorizacion) },
      { campo: 'Número de boleta', valor: mostrar(d.numeroBoleta) },
      { campo: 'Moneda (id)', valor: mostrar(d.monedaId) },
      { campo: 'Monto', valor: mostrar(d.monto) },
      { campo: 'Identificador de transacción', valor: mostrar(d.identificadorTransaccion) },
      { campo: 'Fecha', valor: d.fecha ? d.fecha.toLocaleString('es-PY') : '—' },
    ];
  }

  usarMapeoEjemplo(): void {
    this.formGroup.get('mapeo').setValue(this.mapeoEjemplo);
  }

  /** Para el JSON que se pega de un lado y viene en una sola linea. */
  formatearMapeo(): void {
    const actual = this.formGroup.get('mapeo').value;
    const lindo = indentar(actual);
    if (lindo === actual) {
      this.notificacionSnackbar.notification$.next({
        color: NotificacionColor.warn,
        texto: 'No se puede indentar: todavia no es un JSON valido.',
        duracion: 4,
      });
      return;
    }
    this.formGroup.get('mapeo').setValue(lindo);
  }

  onGuardar(): void {
    if (this.guardando) return;

    // El boton NO se deshabilita cuando el formulario esta incompleto: lo que falta puede estar en
    // un tab que no se ve, y un boton muerto sin explicacion es peor que un aviso. Se avisa y se
    // lleva al tab donde esta el hueco.
    if (this.formGroup.invalid) {
      const destino = this.incompletos.aparato ? 0 : this.incompletos.lectura ? 1 : 2;
      const donde = ['"Qué aparato es"', '"Cómo se lee el cupón"', '"Qué campos produce"'][destino];
      this.tabActivo = destino;
      this.notificacionSnackbar.notification$.next({
        color: NotificacionColor.warn,
        texto: 'Falta completar algo en ' + donde + '.',
        duracion: 5,
      });
      return;
    }

    if (this.errorPreview || this.preview.length === 0) {
      this.tabActivo = 1;
      this.notificacionSnackbar.notification$.next({
        color: NotificacionColor.warn,
        texto: this.errorPreview
          ? 'El patrón no reconoce la cadena de ejemplo. El motivo está en "Cómo se lee el cupón".'
          : 'Completá el patrón, el mapeo y la cadena de ejemplo: todavía no se extrae ningún campo.',
        duracion: 5,
      });
      return;
    }

    this.guardando = true;
    const v = this.formGroup.value;
    this.formatoService
      .onSave({
        id: this.data?.formato?.id,
        nombre: v.nombre,
        tipo: v.tipo,
        patron: v.patron,
        mapeo: v.mapeo,
        ejemplo: v.ejemplo,
        activo: v.activo,
        proveedorServicioId: v.proveedorServicioId ?? null,
        usuarioId: this.mainService?.usuarioActual?.id,
      })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.guardando = false;
          this.notificacionSnackbar.openSucess('Formato guardado');
          this.dialogRef.close(res);
        },
        error: (err) => {
          this.guardando = false;
          // El backend valida lo mismo que la pantalla y devuelve el motivo exacto --nombre
          // repetido en el proveedor, tipo inválido, patrón sin anclar-- y mostrarlo tal cual es
          // más útil que un "algo salió mal".
          this.notificacionSnackbar.notification$.next({
            color: NotificacionColor.danger,
            texto: mensajeDeError(err, 'No se pudo guardar el formato.'),
            duracion: 8,
          });
        },
      });
  }

  /**
   * El mapa ya se guardó solo contra el backend. Lo único que hace falta acá es recordar que algo
   * cambió, para que al cerrar la lista se refresque: la columna del mapa muestra si lo tiene.
   */
  onMapaGuardado(): void {
    this.huboCambios = true;
  }

  /**
   * Al entrar a la vista previa se recarga lo que muestra.
   *
   * <p>Sus `@Input` no cambian --el formato es el mismo-- así que sin esto una foto sacada en la
   * solapa del mapa no aparecería hasta cerrar y volver a abrir el formato.
   */
  onCambioDeTab(evento: any): void {
    if (evento?.index === TAB_VISTA_PREVIA) this.vistaPrevia?.recargar();
  }

  /**
   * Toma el texto que el OCR leyó como cadena de ejemplo y lleva a la solapa del patrón.
   *
   * <p>Es donde se ve al instante si el patrón lo reconoce, que es lo único que hace falta saber
   * para poder guardar.
   */
  onUsarComoEjemplo(texto: string): void {
    if (!texto) return;
    this.formGroup.get('ejemplo').setValue(texto);
    this.tabActivo = TAB_COMO_SE_LEE;
    this.notificacionSnackbar.openSucess('Cadena de ejemplo tomada de la foto');
  }

  onCancelar(): void {
    this.dialogRef.close(this.huboCambios ? this.formatoGuardado ?? true : undefined);
  }
}

/** Devuelve el mismo texto si no es un objeto JSON valido: nunca pierde lo que el usuario escribio. */
function indentar(json: string): string {
  if (!json) return json;
  try {
    const o = JSON.parse(json);
    if (o === null || typeof o !== 'object' || Array.isArray(o)) return json;
    return JSON.stringify(o, null, 2);
  } catch {
    return json;
  }
}

function mostrar(valor: any): string {
  if (valor === undefined || valor === null) return '—';
  if (valor === '') return '(vacío)';
  return String(valor);
}
