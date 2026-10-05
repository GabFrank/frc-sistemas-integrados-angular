import { Component, Inject, Input, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Product } from "electron/main";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { ProductoComponent } from "../../producto/edit-producto/producto.component";
import { Producto } from "../../producto/producto.model";
import { DialogData } from "../../producto/search-producto-dialog/search-producto-dialog.component";
import { TipoPresentacion } from "../../tipo-presentacion/tipo-presentacion.model";
import { TipoPresentacionService } from "../../tipo-presentacion/tipo-presentacion.service";
import { Presentacion } from "../presentacion.model";
import { PresentacionInput } from "../presentacion.model-input";
import { PresentacionService } from "../presentacion.service";

/**
 * Valor de cierre cuando un alta quedó sin confirmar: no trae la presentación, pero avisa a quien abrió el
 * diálogo que recargue las presentaciones (pudo haberse guardado).
 */
export const PRESENTACION_SIN_CONFIRMAR = { sinConfirmar: true };

export class AdicionarPresentacionData {
  presentacion: Presentacion;
  producto: Producto;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { finalize } from "rxjs/operators";
import { esRechazoDelServidor } from "../../../../commons/core/utils/graphqlErrorUtils";
import { esTimeoutDeLink } from "../../../../shared/services/timeout-link";
import { ContextoConsulta, PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from "../../../../generics/generic-crud.service";

const CONSULTA_DE_FONDO: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-adicionar-presentacion",
  templateUrl: "./adicionar-presentacion.component.html",
  styleUrls: ["./adicionar-presentacion.component.scss"],
})
export class AdicionarPresentacionComponent implements OnInit {
  selectedProducto: Producto = new Producto();
  selectedPresentacion: Presentacion = new Presentacion();
  selectedTipoPresentacion: TipoPresentacion = new TipoPresentacion();
  presentacionInput: PresentacionInput = new PresentacionInput();
  tipoPresentacionList: TipoPresentacion[];
  /** Los tipos de presentación no cargaron: el select requerido queda vacío (#390). */
  tiposFallo = false;
  guardando = false;
  /**
   * Un ALTA quedó sin respuesta: pudo haberse guardado y las presentaciones no tienen unicidad, así que volver a
   * guardar la duplicaría. Guardar queda bloqueado en este diálogo (#390).
   */
  altaSinConfirmar = false;
  verificando = false;
  /** Resultado de la última verificación, para el cartel. Nunca afirma «no se guardó». */
  textoVerificacion = '';
  //form group and form controls
  formGroup: FormGroup;
  descripcionControl = new FormControl(null, Validators.required);
  cantidadControl = new FormControl(null, Validators.required);
  activoControl = new FormControl(true);
  principalControl = new FormControl(false);
  productoControl = new FormControl(null);
  tipoPresentacionControl = new FormControl(null, Validators.required);
  imagenPrincipalControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarPresentacionData,
    private matDialogRef: MatDialogRef<AdicionarPresentacionComponent>,
    private presentacionService: PresentacionService,
    private tipoPresentacionService: TipoPresentacionService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private cargandoDialog: CargandoDialogService
  ) { }

  ngOnInit(): void {
    //inicializando arrays
    this.tipoPresentacionList = [];

    this.selectedPresentacion = this.data.presentacion;
    this.selectedProducto = this.data.producto;

    this.createForm();
    this.createTipoPresentacionSelect();

    if (this.selectedPresentacion != null) {
      this.cargarPresentacion();
    }
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("descripcion", this.descripcionControl);
    this.formGroup.addControl("cantidad", this.cantidadControl);
    this.formGroup.addControl("activo", this.activoControl);
    this.formGroup.addControl("principal", this.principalControl);
    this.formGroup.addControl("producto", this.productoControl);
    this.formGroup.addControl("tipoPresentacion", this.tipoPresentacionControl);
    this.formGroup.addControl(
      "imagenPrincipalControl",
      this.imagenPrincipalControl
    );

    //inicializar valores en el form
    this.activoControl.setValue(true);
    this.principalControl.setValue(false);

    //cargar
  }

  onSave() {
    if (this.guardando || this.altaSinConfirmar) return;
    const esAlta = this.selectedPresentacion == null;
    if (this.selectedPresentacion != null) {
      this.presentacionInput.id = this.selectedPresentacion.id;
    }
    if (this.descripcionControl.value == '') {
      this.descripcionControl.setValue(null)
    }
    this.presentacionInput.descripcion = this.descripcionControl.value;
    this.presentacionInput.productoId = this.selectedProducto.id;
    this.presentacionInput.tipoPresentacionId =
      this.tipoPresentacionControl.value;
    this.presentacionInput.cantidad = this.cantidadControl.value;
    this.presentacionInput.activo = this.activoControl.value;
    this.presentacionInput.principal = this.principalControl.value;
    this.guardando = true;
    this.presentacionService
      .onSavePresentacion(this.presentacionInput).pipe(untilDestroyed(this), finalize(() => this.guardando = false))
      .subscribe({ next: (res) => {
        this.guardando = false;
        if (res != null) {
          this.matDialogRef.close(res);
        }
      }, error: (error) => {
        this.guardando = false;
        // Rechazo: el servidor dijo que no (ya avisó el servicio); se puede corregir y reintentar
        if (esRechazoDelServidor(error)) return;
        if (esAlta) {
          // Sin respuesta en un alta: pudo haberse guardado. No se reintenta a ciegas.
          this.altaSinConfirmar = true;
          return;
        }
        // Edición: lleva su id, reintentar es inocuo. (Con respuesta vacía ya avisó el servicio; en el corte, el link.)
        if (!Array.isArray(error) && !esTimeoutDeLink(error)) {
          this.notificacionSnackBar.openWarn('No se pudo confirmar el guardado: podés volver a intentar.', 6);
        }
      } });
  }

  /**
   * Busca la presentación del alta sin confirmar entre las del producto. Solo concluye en positivo: si hay
   * EXACTAMENTE una con esa descripción, cantidad y tipo, es la que se guardó y se cierra con ella. En cualquier
   * otro caso Guardar sigue bloqueado: el servidor puede confirmar el alta después de esta búsqueda.
   */
  onVerificar() {
    if (this.verificando || !this.altaSinConfirmar) return;
    this.verificando = true;
    this.textoVerificacion = '';
    const noSePudo = () => {
      this.verificando = false;
      this.textoVerificacion = 'No se pudo verificar: volvé a intentar, o cancelá y revisá las presentaciones del producto.';
    };
    // Lo que se mandó (el servicio ya reemplazó la descripción vacía por la cantidad)
    const enviado = this.presentacionInput;
    const texto = (valor: any) => (valor ?? '').toString().trim().toUpperCase();
    this.presentacionService.onGetPresentacionesPorProductoIdParaDialogo(this.selectedProducto.id)
      .pipe(untilDestroyed(this))
      .subscribe({ error: noSePudo, next: (presentaciones) => {
        if (presentaciones == null) {
          noSePudo();
          return;
        }
        this.verificando = false;
        const iguales = presentaciones.filter((p) =>
          texto(p?.descripcion) === texto(enviado.descripcion)
          && Number(p?.cantidad) === Number(enviado.cantidad)
          && Number(p?.tipoPresentacion?.id) === Number(enviado.tipoPresentacionId));
        if (iguales.length === 1) {
          this.notificacionSnackBar.openSucess('La presentación ya estaba guardada.');
          this.matDialogRef.close(iguales[0]);
          return;
        }
        this.textoVerificacion = iguales.length > 1
          ? 'Hay más de una presentación igual en el producto: cancelá y revisalas.'
          : 'Todavía no aparece: puede estar procesándose. Cancelá y revisá las presentaciones antes de volver a cargarla.';
      } });
  }

  onCancelar() {
    this.matDialogRef.close(this.altaSinConfirmar ? PRESENTACION_SIN_CONFIRMAR : null);
  }

  cargarPresentacion() {
    this.descripcionControl.setValue(this.selectedPresentacion.descripcion);
    this.principalControl.setValue(this.selectedPresentacion.principal);
    this.activoControl.setValue(this.selectedPresentacion.activo);
    this.cantidadControl.setValue(this.selectedPresentacion.cantidad);
    this.selectedTipoPresentacion = this.selectedPresentacion.tipoPresentacion;
    this.tipoPresentacionControl.setValue(this.selectedTipoPresentacion.id);
  }

  //tipo presentacion
  createTipoPresentacionSelect() {
    this.tiposFallo = false;
    this.tipoPresentacionService.onGetPresentaciones(true, PROPAGAR_ERROR_DE_RED, CONSULTA_DE_FONDO)
      .pipe(untilDestroyed(this)).subscribe({ error: () => {
        this.tiposFallo = true;
      }, next: (res) => {
        if (res == null) {
          this.tiposFallo = true; // error del servidor: ya avisó el servicio
          return;
        }
        this.tipoPresentacionList = res.sort((a, b) => {
          if (a.id > b.id) {
            return 1;
          } else {
            return -1;
          }
        });
      } });
  }

  onTipoPresentacionSelect(e) { }

  //fin tipo presentacion
}
