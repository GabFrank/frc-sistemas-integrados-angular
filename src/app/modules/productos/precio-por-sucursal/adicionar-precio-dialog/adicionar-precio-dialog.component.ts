import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { MainService } from '../../../../main.service';
import { Presentacion } from '../../presentacion/presentacion.model';
import { TipoPrecio } from '../../tipo-precio/tipo-precio.model';
import { TipoPrecioService } from '../../tipo-precio/tipo-precio.service';
import { PrecioPorSucursalInput } from '../precio-por-sucursal-input.model';
import { PrecioPorSucursal } from '../precio-por-sucursal.model';
import { PrecioPorSucursalService } from '../precio-por-sucursal.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import {
  evaluarMargenPrecio,
  MARGEN_MINIMO_PORCENTAJE,
} from '../margen-precio.util';

export class AdicionarPrecioPorSucursalData {
  precio: PrecioPorSucursal;
  presentacion: Presentacion;
  /** Costo medio del producto en guaraníes, por unidad base de stock. */
  costoMedio?: number;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { concat } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { ContextoConsulta, PROPAGAR_ERROR_DE_RED, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';

/** Lectura de precios antes de guardar: error de red y de servidor llegan acá (un solo aviso, el del diálogo). */
const LECTURA_PRECIOS: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA_PRECIOS: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
/**
 * Valor de cierre cuando un guardado quedó sin confirmar (o a medias): no trae el precio, pero no es null,
 * así que quien abrió el diálogo recarga los precios de la presentación.
 */
export const PRECIO_SIN_CONFIRMAR = { sinConfirmar: true };

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-precio-dialog',
  templateUrl: './adicionar-precio-dialog.component.html',
  styleUrls: ['./adicionar-precio-dialog.component.scss']
})
export class AdicionarPrecioDialogComponent implements OnInit {
  formGroup: FormGroup;
  selectedPrecioPorSucursal: PrecioPorSucursal;
  precioControl = new FormControl(null, Validators.required);
  principalControl = new FormControl(null);
  tipoPrecioControl = new FormControl(null, Validators.required);
  activoControl = new FormControl(null);
  precioInput = new PrecioPorSucursalInput;
  isEditting = false;
  tipoPrecioList: TipoPrecio[];
  tiposPrecioFallo = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarPrecioPorSucursalData,
    private matDialogRef: MatDialogRef<AdicionarPrecioDialogComponent>,
    private precioService: PrecioPorSucursalService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private tipoPrecioService: TipoPrecioService,
    private cargandoDialog: CargandoDialogService,
    private mainService: MainService,
    private dialogosService: DialogosService
  ) {}

  ngOnInit(): void {
    this.createForm();

    this.tipoPrecioList = []

    this.loadTipoPrecios()

    if (this.data?.precio?.id != null) {
      this.cargarDato();
      this.formGroup.disable()
    } else {
      this.isEditting = true;
    }
  }

  loadTipoPrecios(){
    this.tiposPrecioFallo = false;
    this.tipoPrecioService.onGetAllTipoPrecios(true, PROPAGAR_ERROR_DE_RED, CONSULTA_PRECIOS).pipe(untilDestroyed(this)).subscribe({ error: () => {
      this.tiposPrecioFallo = true;
      this.notificacionSnackBar.openWarn('No se pudieron cargar los tipos de precio: usá «Reintentar».', 5);
    }, next: res => {
      if(res!=null){
        this.tipoPrecioList = res;
      } else {
        this.tiposPrecioFallo = true; // error del servidor: ya se avisó
      }
    } })
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("precio", this.precioControl);
    this.formGroup.addControl("principal", this.principalControl);
    this.formGroup.addControl("activo", this.activoControl);
    this.formGroup.addControl("tipoPrecio", this.tipoPrecioControl);

    this.principalControl.setValue(false);
    this.activoControl.setValue(true);
  }

  cargarDato() {
    this.selectedPrecioPorSucursal = this.data.precio;
    this.precioControl.setValue(this.selectedPrecioPorSucursal.precio);
    this.principalControl.setValue(this.selectedPrecioPorSucursal.principal);
    this.activoControl.setValue(this.selectedPrecioPorSucursal.activo);
    
    if (this.selectedPrecioPorSucursal.tipoPrecio && this.selectedPrecioPorSucursal.tipoPrecio.id) {
      this.tipoPrecioControl.setValue(this.selectedPrecioPorSucursal.tipoPrecio.id);
    }

    this.precioInput.id = this.selectedPrecioPorSucursal.id;

    console.log('Tipo precio cargado:', this.tipoPrecioControl.value);
  }

  onSave() {
    if (!this.formGroup.valid) {
      this.notificacionSnackBar.notification$.next({
        texto: "Por favor complete todos los campos obligatorios",
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }

    this.precioInput.precio = this.precioControl.value;
    this.precioInput.activo = this.activoControl.value;
    this.precioInput.principal = this.principalControl.value;
    this.precioInput.presentacionId = this.data.presentacion.id;
    this.precioInput.tipoPrecioId = this.tipoPrecioControl.value;

    if (this.precioInput.id == null) {
      this.precioService.onGetPrecioPorSurursalPorPresentacionId(this.data.presentacion.id, true, LECTURA_PRECIOS, CONSULTA_PRECIOS)
        .pipe(untilDestroyed(this))
        .subscribe({ error: () => this.avisarPreciosSinLeer(), next: (preciosExistentes: PrecioPorSucursal[]) => {
          if (preciosExistentes == null) {
            // Sin precios llega []: un null es un fallo, no «no existe ese tipo»
            this.avisarPreciosSinLeer();
            return;
          }
          const yaExiste = preciosExistentes.some(
            precio => precio.tipoPrecio?.id === this.precioInput.tipoPrecioId
          );

          if (yaExiste) {
            this.notificacionSnackBar.notification$.next({
              texto: "Ya existe un precio con ese tipo de precio para esta presentación.",
              color: NotificacionColor.warn,
              duracion: 3
            });
            return;
          }

          this.verificarMargen();
        } });
      return;
    }

    this.verificarMargen();
  }

  /**
   * Avisa cuando el precio deja un margen menor al mínimo sobre el costo del producto.
   * El usuario elige entre cancelar (no guarda y el diálogo queda abierto con el valor
   * cargado, para corregirlo ahí mismo), aplicar el precio mínimo sugerido, o guardar
   * igual el precio que ingresó.
   */
  private verificarMargen() {
    const evaluacion = evaluarMargenPrecio(
      Number(this.precioControl.value),
      this.data?.costoMedio,
      this.data?.presentacion?.cantidad
    );

    if (evaluacion == null || !evaluacion.debeAvisar) {
      this.continuarGuardado();
      return;
    }

    const precioSugerido = Math.round(evaluacion.precioMinimoSugerido);

    this.dialogosService
      .confirm(
        'Margen por debajo del mínimo',
        `El precio ingresado deja un margen de ${this.formatearPorcentaje(
          evaluacion.margenPorcentaje
        )}% sobre el costo.`,
        `Se espera un margen mínimo de ${MARGEN_MINIMO_PORCENTAJE}%.`,
        [
          `Costo de la presentación: ${this.formatearGs(
            evaluacion.costoPresentacion
          )}`,
          `Precio ingresado: ${this.formatearGs(
            Number(this.precioControl.value)
          )}`,
          `Precio mínimo sugerido: ${this.formatearGs(precioSugerido)}`,
        ],
        true,
        'Cancelar',
        'Usar precio sugerido',
        'Continuar igual'
      )
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        // DialogosComponent enfoca siempre el primer botón, y cada botón cierra con un valor
        // fijo: el 1° con true, el 2° con false y el 3° con null. "Cancelar" va primero para
        // que un Enter reflejo no se saltee el aviso. Con tres botones el diálogo se puede
        // cerrar con ESC, que devuelve undefined y también cuenta como cancelar.
        if (res === false) {
          this.aplicarPrecioSugerido(precioSugerido);
          this.continuarGuardado();
        } else if (res === null) {
          this.continuarGuardado();
        }
      });
  }

  /** Reemplaza el precio ingresado por el mínimo sugerido, antes de guardar. */
  private aplicarPrecioSugerido(precioSugerido: number) {
    this.precioControl.setValue(precioSugerido);
    this.precioInput.precio = precioSugerido;
  }

  private formatearGs(valor: number): string {
    return Math.round(valor).toLocaleString('es-PY');
  }

  private formatearPorcentaje(valor: number): string {
    return valor.toFixed(1).replace('.', ',');
  }

  private avisarPreciosSinLeer(): void {
    this.notificacionSnackBar.openWarn(
      'No se pudieron leer los precios de la presentación: no se guardó nada. Volvé a intentar.', 6);
  }

  private continuarGuardado() {
    const { requestId } = this.cargandoDialog.openDialog();

    if (this.principalControl.value !== true) {
      this.guardarPrecio(requestId, false);
      return;
    }
    // Precio principal: primero se baja el principal anterior. Sin poder leer los precios, o sin poder bajarlo,
    // NO se guarda el nuevo (quedarían dos principales) (#390).
    this.precioService.onGetPrecioPorSurursalPorPresentacionId(this.data.presentacion.id, true, LECTURA_PRECIOS,
      CONSULTA_PRECIOS, true)
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => {
        this.cargandoDialog.closeDialog(requestId);
        this.avisarPreciosSinLeer();
      }, next: (preciosExistentes: PrecioPorSucursal[]) => {
        if (preciosExistentes == null) {
          this.cargandoDialog.closeDialog(requestId);
          this.avisarPreciosSinLeer();
          return;
        }
        const bajas = preciosExistentes
          .filter(precio => precio.principal && precio.id !== this.precioInput.id)
          .map(precio => {
            const updateInput = new PrecioPorSucursalInput();
            updateInput.id = precio.id;
            updateInput.precio = precio.precio;
            updateInput.activo = precio.activo;
            updateInput.principal = false;
            updateInput.presentacionId = this.data.presentacion.id;
            updateInput.tipoPrecioId = precio.tipoPrecio?.id;
            updateInput.sucursalId = this.mainService?.sucursalActual?.id;
            updateInput.usuarioId = null;
            // Al central, como el alta: los precios se replican central → filial, una baja hecha en el filial se pierde
            return this.precioService.onSave(updateInput).pipe(take(1));
          });

        if (bajas.length === 0) {
          this.guardarPrecio(requestId, false);
          return;
        }
        // De a una: si una falla no se sigue con las demás
        concat(...bajas).pipe(toArray(), untilDestroyed(this)).subscribe({
          next: () => this.guardarPrecio(requestId, true),
          error: () => {
            this.cargandoDialog.closeDialog(requestId);
            this.notificacionSnackBar.openWarn(
              'No se pudo quitar el precio principal anterior: el precio nuevo NO se guardó. Revisá los precios de la presentación.', 10);
            // La baja pudo haberse aplicado: el padre recarga los precios
            this.matDialogRef.close(PRECIO_SIN_CONFIRMAR);
          }
        });
      } });
  }

  /** `seBajoElPrincipal`: ya se quitó el principal anterior; si este guardado falla, la presentación queda sin principal. */
  private guardarPrecio(requestId: number, seBajoElPrincipal: boolean) {
    this.precioInput.sucursalId = this.mainService?.sucursalActual?.id;

    this.precioService.onSave(this.precioInput).pipe(untilDestroyed(this)).subscribe(res => {
      this.cargandoDialog.closeDialog(requestId);
      if (res != null) {
        this.matDialogRef.close(res);
      } else {
        this.notificacionSnackBar.openWarn(
          'No se pudo confirmar el guardado del precio: revisá los precios de la presentación.', 8);
        this.matDialogRef.close(PRECIO_SIN_CONFIRMAR);
      }
    }, error => {
      this.cargandoDialog.closeDialog(requestId);
      if (Array.isArray(error) && !seBajoElPrincipal) {
        // El servidor respondió que no y no se tocó nada más: se puede corregir y reintentar acá mismo
        this.notificacionSnackBar.notification$.next({
          texto: "Error al guardar el precio",
          color: NotificacionColor.warn,
          duracion: 3
        });
        return;
      }
      if (Array.isArray(error)) {
        this.notificacionSnackBar.openWarn(
          'No se guardó el precio nuevo y el principal anterior ya se había quitado: la presentación quedó sin precio principal. Revisá sus precios.', 12);
      } else if (!esTimeoutDeLink(error)) {
        // Sin respuesta: pudo haberse guardado (en el corte por tiempo ya avisa el link)
        this.notificacionSnackBar.openWarn(
          'No se pudo confirmar el guardado: pudo haberse guardado. Revisá los precios de la presentación antes de reintentar.', 10);
      }
      this.matDialogRef.close(PRECIO_SIN_CONFIRMAR);
    });
  }

  onCancelar() {
    this.matDialogRef.close()
  }

}
