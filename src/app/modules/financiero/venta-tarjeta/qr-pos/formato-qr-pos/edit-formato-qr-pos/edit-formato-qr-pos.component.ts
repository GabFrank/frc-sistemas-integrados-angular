import { Component, Inject, OnInit } from '@angular/core';
import { mensajeDeError } from '../../mensaje-error';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../../../notificacion-snackbar.service';
import { MainService } from '../../../../../../main.service';
import { FormatoQrPos } from '../../formato-qr-pos.model';
import { FormatoQrPosService } from '../../formato-qr-pos.service';
import { MAX_LONGITUD_QR, parsearCupon } from '../../qr-pos-parser';
import { ProveedorServicio } from '../../../../../personas/proveedor-servicio/proveedor-servicio.model';
import { ProveedorServicioService } from '../../../../../personas/proveedor-servicio/proveedor-servicio.service';

export interface EditFormatoQrPosData {
  formato?: FormatoQrPos;
}

interface FilaPreview {
  campo: string;
  valor: string;
}

/**
 * Alta y edición de un formato de QR de POS.
 *
 * La pantalla existe para no tener que hacer un release cada vez que un proveedor nuevo empieza
 * a imprimir su QR. Como el patrón que se carga acá termina corriendo en la caja de cada
 * sucursal, la pantalla no deja guardar nada que no haya probado antes contra la cadena de
 * ejemplo: la vista previa de abajo es exactamente lo que el PDV va a leer del cupón.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-edit-formato-qr-pos',
  templateUrl: './edit-formato-qr-pos.component.html',
  styleUrls: ['./edit-formato-qr-pos.component.scss'],
})
export class EditFormatoQrPosComponent implements OnInit {

  formGroup: FormGroup;
  guardando = false;

  /** Vista previa del parseo, recalculada en cada cambio. */
  preview: FilaPreview[] = [];
  errorPreview: string = null;

  readonly maxLongitud = MAX_LONGITUD_QR;

  /**
   * Proveedores a los que se le puede asignar el formato.
   *
   * Sin este campo, TODO formato cargado desde acá quedaba como comodín para siempre, y con eso
   * quedaban muertas dos cosas que dependen de saber el proveedor: la detección de cupón de otra
   * terminal (`formatoCruzado`) y el orden en que se prueban los formatos (`ordenarPorProveedor`).
   */
  proveedores: ProveedorServicio[] = [];

  /** Se ofrece como punto de partida: es el formato que ya está en producción. */
  readonly mapeoEjemplo = JSON.stringify(
    {
      codigoAutorizacion: { de: 'auth' },
      numeroBoleta: { de: 'bol' },
      moneda: { de: 'cur', mapa: { PYG: 1, BRL: 2, USD: 3 } },
      monto: { de: 'amt', escalaSegunMoneda: true },
      identificadorTransaccion: { de: 'ref' },
      fecha: { de: 'ts', formato: 'yyyyMMddHHmm', zona: 'America/Asuncion' },
    },
    null,
    2
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditFormatoQrPosData,
    private dialogRef: MatDialogRef<EditFormatoQrPosComponent>,
    private formatoQrPosService: FormatoQrPosService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private mainService: MainService,
    private proveedorServicioService: ProveedorServicioService
  ) {}

  ngOnInit(): void {
    const f = this.data?.formato;
    this.formGroup = new FormGroup({
      nombre: new FormControl(f?.nombre || null, Validators.required),
      patron: new FormControl(f?.patron || null, Validators.required),
      mapeo: new FormControl(f?.mapeo || null, Validators.required),
      ejemplo: new FormControl(f?.ejemplo || null, Validators.required),
      activo: new FormControl(f?.activo !== false),
      // null = comodín: se prueba contra cualquier terminal. Es lo correcto para un proveedor que
      // todavía no está cargado como ProveedorServicio.
      proveedorServicioId: new FormControl(
        f?.proveedorServicioId ?? f?.proveedorServicio?.id ?? null
      ),
    });

    this.proveedorServicioService
      .onGetPaginated(0, 200)
      .pipe(untilDestroyed(this))
      .subscribe((res) => (this.proveedores = res?.getContent ?? []));

    // El preview se recalcula solo. Es la única forma de que quien carga el formato vea, antes
    // de guardar, que el patrón separa los campos donde corresponde: un grupo corrido deja el
    // importe en el lugar de la boleta y eso en producción se descubre cobrando.
    this.formGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.recalcular());
    this.recalcular();
  }

  private recalcular(): void {
    this.preview = [];
    this.errorPreview = null;

    const { patron, mapeo, ejemplo } = this.formGroup.value;
    if (!patron || !mapeo || !ejemplo) return;

    const formato: FormatoQrPos = { nombre: 'previsualización', patron, mapeo, ejemplo, activo: true };
    // Se usa el mismo motor que el PDV, no una imitación: si acá se ve bien, en la caja se ve
    // igual. Los decimales van fijos porque son los de financiero.moneda.
    const r = parsearCupon(ejemplo, [formato], { 1: 0, 2: 2, 3: 2 });
    if (!r.ok) {
      this.errorPreview = r.error;
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

  onGuardar(): void {
    if (this.formGroup.invalid || this.guardando) return;
    if (this.errorPreview || this.preview.length === 0) {
      this.notificacionSnackbar.notification$.next({
        color: NotificacionColor.warn,
        texto: 'Corregí el patrón hasta que la vista previa muestre los campos.',
        duracion: 5,
      });
      return;
    }

    this.guardando = true;
    const v = this.formGroup.value;
    this.formatoQrPosService
      .onSave({
        id: this.data?.formato?.id,
        nombre: v.nombre,
        patron: v.patron,
        mapeo: v.mapeo,
        ejemplo: v.ejemplo,
        activo: v.activo,
        // Del formulario, no del formato original: antes se releía el valor viejo, así que el
        // campo era inasignable e ineditable.
        proveedorServicioId: this.formGroup.value.proveedorServicioId ?? null,
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
          // El backend valida lo mismo que la pantalla y devuelve el motivo exacto; mostrarlo
          // tal cual es más útil que un "algo salió mal".
          this.notificacionSnackbar.notification$.next({
            color: NotificacionColor.danger,
            texto: mensajeDeError(err, 'No se pudo guardar el formato.'),
            duracion: 8,
          });
        },
      });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}

function mostrar(valor: any): string {
  if (valor === undefined || valor === null) return '—';
  if (valor === '') return '(vacío)';
  return String(valor);
}
