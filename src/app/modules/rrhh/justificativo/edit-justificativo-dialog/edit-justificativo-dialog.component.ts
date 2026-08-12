import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString, stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { LegajoService } from '../../legajo/legajo.service';
import { SubirDocumentoDialogComponent } from '../../legajo/subir-documento-dialog/subir-documento-dialog.component';
import { Justificativo, TipoJustificativo } from '../justificativo.model';
import { JustificativoService } from '../justificativo.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';


export interface JustificativoDialogData {
  funcionarioId: number;
  /** Presente solo al editar; el backend hace update cuando el input trae id. */
  justificativo?: Justificativo;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-justificativo-dialog',
  templateUrl: './edit-justificativo-dialog.component.html',
  styleUrls: ['./edit-justificativo-dialog.component.scss']
})
export class EditJustificativoDialogComponent implements OnInit {

  formGroup: FormGroup;

  esEdicion = false;
  titulo = 'Nuevo justificativo';

  // los tipos vienen del catalogo (solo los cargables a mano: los generados por
  // el sistema — vacacion/feriado — los emite otro modulo)
  tipoOptions: TipoJustificativo[] = [];

  funcionarioControl = new FormControl(null, [Validators.required]);
  fechaControl = new FormControl(new Date(), [Validators.required]);
  tipoControl = new FormControl(null, [Validators.required]);
  observacionControl = new FormControl(null);
  documentoControl = new FormControl(null);

  /** El catalogo decide si el tipo elegido exige respaldo (ej. REPOSO MEDICO, DUELO). */
  requiereDocumento = false;
  documentos: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: JustificativoDialogData,
    private dialogRef: MatDialogRef<EditJustificativoDialogComponent>,
    private justificativoService: JustificativoService,
    private mainService: MainService,
    private legajoService: LegajoService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService
  ) {
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      funcionario: this.funcionarioControl,
      fecha: this.fechaControl,
      tipo: this.tipoControl,
      observacion: this.observacionControl
    });
    const editado = this.data?.justificativo;
    this.esEdicion = editado != null;

    if (this.esEdicion) {
      this.titulo = 'Editar justificativo';
      this.funcionarioControl.setValue(editado.funcionario?.id);
      this.fechaControl.setValue(editado.fecha ? stringToLocalDate(editado.fecha) : new Date());
      this.observacionControl.setValue(editado.observacion);
      this.documentoControl.setValue(editado.documento?.id);
    } else if (this.data?.funcionarioId != null) {
      this.funcionarioControl.setValue(this.data.funcionarioId);
    }

    this.justificativoService.onGetTiposActivos().pipe(untilDestroyed(this))
      .subscribe((res: TipoJustificativo[]) => {
        // los generados por el sistema no se cargan a mano
        this.tipoOptions = (res || []).filter(t => !t.generadoPorSistema);
        if (this.esEdicion) {
          // el tipo actual puede ser de sistema (vacacion/feriado): si no esta en la lista
          // filtrada, se agrega para no perder el valor al abrir el dialogo
          if (editado.tipo != null && !this.tipoOptions.some(t => t.id === editado.tipo.id)) {
            this.tipoOptions = [editado.tipo].concat(this.tipoOptions);
          }
          this.tipoControl.setValue(editado.tipo?.id);
          this.onTipoChange();
          return;
        }
        const porDefecto = this.tipoOptions.find(t => (t.nombre || '').toUpperCase() === 'JUSTIFICADO');
        if (porDefecto) { this.tipoControl.setValue(porDefecto.id); }
        this.onTipoChange();
      });
  }

  /** Recalcula si hace falta adjunto y carga los documentos del legajo del funcionario. */
  onTipoChange() {
    const tipo = this.tipoOptions.find(t => t.id === this.tipoControl.value);
    this.requiereDocumento = tipo != null && tipo.requiereDocumento === true;
    if (this.requiereDocumento) {
      this.cargarDocumentos();
    } else {
      // El campo se oculta, pero su valor seguiria viajando al guardar y adjuntaria
      // un documento a un tipo que ya no lo exige.
      this.documentoControl.setValue(null);
    }
  }

  onFuncionarioChange(id: number) {
    this.funcionarioControl.setValue(id);
    this.documentoControl.setValue(null);
    if (this.requiereDocumento) {
      this.cargarDocumentos();
    }
  }

  private cargarDocumentos() {
    const funcionarioId = this.funcionarioControl.value;
    if (funcionarioId == null) { this.documentos = []; return; }
    this.legajoService.onGetDocumentos(funcionarioId).pipe(untilDestroyed(this))
      .subscribe(res => { this.documentos = res || []; });
  }

  /** Sube un documento nuevo al legajo y lo deja seleccionado. */
  onSubirDocumento() {
    const funcionarioId = this.funcionarioControl.value;
    if (funcionarioId == null) {
      this.notificacion.notification$.next({
        texto: 'Seleccione primero el funcionario', color: NotificacionColor.warn, duracion: 3
      });
      return;
    }
    this.dialog.open(SubirDocumentoDialogComponent, {
      data: { funcionarioId }, width: '520px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res == null) return;
      this.documentos = [res].concat(this.documentos || []);
      this.documentoControl.setValue(res.id);
    });
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) {
      return;
    }
    // El backend tambien lo valida; esto evita el viaje y da un mensaje mas claro.
    if (this.requiereDocumento && this.documentoControl.value == null) {
      this.notificacion.notification$.next({
        texto: 'Este tipo de justificativo exige un documento respaldatorio',
        color: NotificacionColor.warn, duracion: 4
      });
      return;
    }
    const n = new Justificativo();
    n.id = this.data?.justificativo?.id;
    const func = new Funcionario();
    func.id = this.funcionarioControl.value;
    n.funcionario = func;
    n.fecha = dateToString(this.fechaControl.value);
    const tipo = new TipoJustificativo();
    tipo.id = this.tipoControl.value;
    n.tipo = tipo;
    n.observacion = this.observacionControl.value ? this.observacionControl.value.trim().toUpperCase() : null;
    n.registradoPor = this.mainService.usuarioActual;
    n.documento = this.documentoControl.value != null ? { id: this.documentoControl.value } : null;
    // el resolver pisa estos campos con lo que venga en el input, aunque sea null
    n.jornadaId = this.data?.justificativo?.jornadaId;
    n.sucursalId = this.data?.justificativo?.sucursalId;

    this.justificativoService.onSave(n.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) this.dialogRef.close(res);
      });
  }
}
