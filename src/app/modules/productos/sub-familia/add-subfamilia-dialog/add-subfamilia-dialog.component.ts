import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { SelectIconDialogComponent } from '../../../../shared/select-icon-dialog/select-icon-dialog.component';
import { SubfamiliaInput } from '../graphql/subfamilia-input.model';
import { Subfamilia } from '../sub-familia.model';
import { SubFamiliaService } from '../sub-familia.service';

/**
 * Valor de cierre cuando un alta quedó sin confirmar: no trae la subfamilia, pero avisa a quien abrió el diálogo
 * que recargue su lista (pudo haberse guardado).
 */
export const SUBFAMILIA_SIN_CONFIRMAR = { sinConfirmar: true };

export interface AddSubfamiliaData {
  familiaId: number;
  subfamilia: Subfamilia;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { finalize } from 'rxjs/operators';
import { esRechazoDelServidor } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { ContextoConsulta, QueryError } from '../../../../generics/generic-crud.service';
import { TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.constantes';

/** Verificación de un alta sin respuesta: el error de red y el del servidor llegan acá («no se pudo verificar»). */
const LECTURA_VERIFICACION: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA_VERIFICACION: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
/** Cuántas subfamilias se piden al verificar; si hay más coincidencias que esto, no se concluye nada. */
const TAMANO_VERIFICACION = 100;
const normalizarNombre = (nombre: any): string => (nombre ?? '').toString().trim().replace(/\s+/g, ' ').toUpperCase();

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-subfamilia-dialog',
  templateUrl: './add-subfamilia-dialog.component.html',
  styleUrls: ['./add-subfamilia-dialog.component.scss']
})
export class AddSubfamiliaDialogComponent implements OnInit {

  subfamiliaInput: SubfamiliaInput;
  formGroup: FormGroup;

  //form controls
  idControl = new FormControl(null);
  nombreControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl(null);
  activoControl = new FormControl(true);
  posicionControl = new FormControl(null);
  usuarioIdControl = new FormControl(null);
  iconoControl = new FormControl('block');
  listPos: number[] = [];

  //controladores de estado
  isCancelar = true;
  isGuardar = true;
  isEditar = false;
  /** Guardando: sin doble «Guardar» y sin cerrar el diálogo (Esc o clic afuera) hasta saber qué pasó. */
  guardando = false;
  /**
   * Un ALTA quedó sin respuesta: pudo haberse guardado y las subfamilias no tienen nombre único, así que volver a
   * guardar la duplicaría. Guardar queda bloqueado en este diálogo (#390).
   */
  altaSinConfirmar = false;
  /** Nombre que se mandó en el alta sin confirmar (Cancelar limpia el formulario). */
  private nombreSinConfirmar = '';
  verificando = false;
  /** Resultado de la última verificación, para el cartel. Nunca afirma «no se guardó». */
  textoVerificacion = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddSubfamiliaData,
    public mainService: MainService,
    private subfamiliaService: SubFamiliaService,
    private dialogRef: MatDialogRef<AddSubfamiliaDialogComponent>,
    private matDialog: MatDialog,
    private notificationBar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loadData();
    this.asegurarPosicionActual();
    // La posición no ordena nada: si el conteo no llega, la lista queda con la posición actual y no se bloquea
    this.subfamiliaService.onCountSubfamilia().pipe(untilDestroyed(this)).subscribe({ error: () => {}, next: (res) => {
      if (res == null) return;
      const posiciones: number[] = [];
      for (let index = 0; index < res + 1; index++) {
        posiciones.push(index + 1);
      }
      this.listPos = posiciones;
      this.asegurarPosicionActual();
    } });
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl('id', this.idControl);
    this.formGroup.addControl('nombre', this.nombreControl);
    this.formGroup.addControl('descripcion', this.descripcionControl);
    this.formGroup.addControl('activo', this.activoControl);
    this.formGroup.addControl('posicion', this.posicionControl);
    this.formGroup.addControl('icono', this.iconoControl);
  }

  loadData() {
    if (this.data?.subfamilia != null) {
      this.idControl.setValue(this.data.subfamilia.id);
      this.nombreControl.setValue(this.data.subfamilia.nombre);
      this.descripcionControl.setValue(this.data.subfamilia?.descripcion);
      this.activoControl.setValue(this.data.subfamilia?.activo);
      this.iconoControl.setValue(this.data.subfamilia?.icono);
      this.posicionControl.setValue(this.data.subfamilia.posicion)
    }
  }

  searchIcon() {
    this.matDialog
      .open(SelectIconDialogComponent, {
        width: '600px',
        height: '500px',
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.iconoControl.setValue(res);
      });
  }

  /** En edición, la posición guardada siempre está entre las opciones (si no, el select se ve en blanco). */
  private asegurarPosicionActual(): void {
    // El modelo la trae como texto: se deja tal cual (es el valor que tiene el control)
    const actual: any = this.data?.subfamilia?.posicion;
    if (actual != null && !this.listPos.some((p) => p === actual)) this.listPos = [...this.listPos, actual];
  }

  onCerrar() {
    this.dialogRef.close(this.altaSinConfirmar ? SUBFAMILIA_SIN_CONFIRMAR : null);
  }

  /**
   * Busca la subfamilia del alta sin confirmar. Solo concluye en positivo: si en esa familia hay EXACTAMENTE una
   * con ese nombre, es la que se guardó y se cierra con ella. En cualquier otro caso Guardar sigue bloqueado: el
   * servidor puede confirmar el alta después de esta búsqueda.
   */
  onVerificar() {
    if (this.verificando || !this.altaSinConfirmar) return;
    this.verificando = true;
    this.textoVerificacion = '';
    const noSePudo = () => {
      this.verificando = false;
      this.textoVerificacion = 'No se pudo verificar: volvé a intentar, o cerrá y revisá la lista.';
    };
    this.subfamiliaService
      .onSearchSubfamilia(this.data.familiaId, this.nombreSinConfirmar, 0, TAMANO_VERIFICACION, true,
        LECTURA_VERIFICACION, CONSULTA_VERIFICACION)
      .pipe(untilDestroyed(this))
      .subscribe({ error: noSePudo, next: (page: any) => {
        if (page?.getContent == null) {
          noSePudo();
          return;
        }
        this.verificando = false;
        const buscado = normalizarNombre(this.nombreSinConfirmar);
        const iguales = page.getContent.filter((s: Subfamilia) => normalizarNombre(s?.nombre) === buscado);
        const hayMasPaginas = (page.getTotalElements ?? 0) > page.getContent.length;
        if (iguales.length === 1 && !hayMasPaginas) {
          this.notificationBar.openSucess('La subfamilia ya estaba guardada.');
          this.subfamiliaService.recargarListas();
          this.dialogRef.close(iguales[0]);
          return;
        }
        this.textoVerificacion = iguales.length > 1
          ? 'Hay más de una subfamilia con ese nombre en la familia: cerrá y revisá la lista.'
          : 'Todavía no aparece: puede estar procesándose. Cerrá y revisá la lista antes de volver a cargarla.';
      } });
  }

  onCancelar() {
    this.nombreControl.reset();
    this.descripcionControl.reset();
    this.activoControl.setValue(true);
    this.iconoControl.setValue('block');
  }

  onGuardar() {
    this.onSave();
  }

  onEditar() {}

  onSave() {
    if (this.guardando || this.altaSinConfirmar) return;
    const esAlta = this.data.subfamilia == null;
    this.subfamiliaInput = new SubfamiliaInput();
    if(this.data.subfamilia!=null){
      this.subfamiliaInput.id = this.data.subfamilia.id;
      this.subfamiliaInput.posicion = this.posicionControl.value;
    } else {
      this.subfamiliaInput.posicion = this.listPos.length+1;
    }
    // En edición el diálogo se abre sin `familiaId`: se manda la familia de la propia subfamilia. Sin esto el
    // servidor la guardaba sin familia (la sacaba de su familia al editarla).
    const familiaId = this.data.familiaId ?? this.data.subfamilia?.familia?.id;
    if(familiaId!=null){
      this.subfamiliaInput.familiaId = familiaId
    } else if (!esAlta) {
      // Guardarla así la dejaría sin familia
      this.notificationBar.openWarn('No se pudo determinar la familia de esta subfamilia: no se guardó. Cerrá y volvé a abrirla.', 6);
      return;
    }
    this.subfamiliaInput.nombre = this.nombreControl.value?.toUpperCase();
    this.subfamiliaInput.descripcion =
      this.descripcionControl.value?.toUpperCase();
    this.subfamiliaInput.activo = true;
    this.subfamiliaInput.icono = this.iconoControl.value;
    this.guardando = true;
    this.dialogRef.disableClose = true;
    const fin = () => {
      this.guardando = false;
      // Con un alta sin confirmar solo se sale por «Cerrar», que avisa a quien abrió que recargue
      this.dialogRef.disableClose = this.altaSinConfirmar;
    };
    this.subfamiliaService.onSaveSubfamilia(this.subfamiliaInput).pipe(untilDestroyed(this), finalize(fin)).subscribe({
      next: (res) => {
        fin();
        // «Guardado con éxito» ya lo muestra el servicio
        if (res != null) this.dialogRef.close(res);
      },
      error: (error) => {
        fin();
        // Rechazo: el servidor dijo que no (ya avisó el servicio); se puede corregir y reintentar
        if (esRechazoDelServidor(error)) return;
        if (esAlta) {
          // Sin respuesta en un alta: pudo haberse guardado. No se reintenta a ciegas.
          this.altaSinConfirmar = true;
          this.nombreSinConfirmar = this.subfamiliaInput.nombre;
          return;
        }
        // Edición: lleva su id, reintentar es inocuo. (Con respuesta vacía ya avisó el servicio; en el corte, el link.)
        if (!Array.isArray(error) && !esTimeoutDeLink(error)) {
          this.notificationBar.openWarn('No se pudo confirmar el guardado: podés volver a intentar.', 6);
        }
      }
    });
  }

}
