import { Component, Inject, OnInit, HostListener } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { Presentacion } from "../../presentacion/presentacion.model";
import { CodigoInput } from "../codigo-input.model";
import { Codigo } from "../codigo.model";
import { CodigoService } from "../codigo.service";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

export class AdicionarCodigoData {
  codigo: Codigo;
  presentacion: Presentacion;
  index: number;
  presentacionIndex: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-adicionar-codigo-dialog",
  templateUrl: "./adicionar-codigo-dialog.component.html",
  styleUrls: ["./adicionar-codigo-dialog.component.scss"],
})
export class AdicionarCodigoDialogComponent implements OnInit {
  formGroup: FormGroup;
  selectedCodigo: Codigo;
  codigoControl = new FormControl(null, Validators.required);
  principalControl = new FormControl(null);
  activoControl = new FormControl(null);
  codigoInput = new CodigoInput;
  isEditting = false;
  isPesable = false;
  inputChanged = false;
  inputTimer: any = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarCodigoData,
    private matDialogRef: MatDialogRef<AdicionarCodigoDialogComponent>,
    private codigoService: CodigoService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private cargandoDialog: CargandoDialogService
  ) {}

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.isEditting) {
      // Prevent form submission if input just changed (likely from barcode scanner)
      if (this.inputChanged) {
        event.preventDefault();
      } else {
        event.preventDefault();
        this.onSave();
      }
    }
  }

  ngOnInit(): void {
    this.createForm();
    if(this.data?.presentacion?.producto?.balanza==true){
      this.codigoControl.setValidators([Validators.required, Validators.minLength(5), Validators.maxLength(5)])
      this.codigoControl.updateValueAndValidity()
      this.isPesable = true;
    }
    if (this.data?.codigo?.id != null) {
      this.cargarDato();
      this.formGroup.disable()
    } else {
      this.isEditting = true;
    }
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("codigo", this.codigoControl);
    this.formGroup.addControl("principal", this.principalControl);
    this.formGroup.addControl("activo", this.activoControl);

    //inicializando controles
    this.principalControl.setValue(false);
    this.activoControl.setValue(true);

    // Add input change listener
    this.codigoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      // Mark input as recently changed
      this.inputChanged = true;
      
      // Clear previous timer
      if (this.inputTimer) {
        clearTimeout(this.inputTimer);
      }
      
      // Set timer to reset inputChanged flag after 500ms
      this.inputTimer = setTimeout(() => {
        this.inputChanged = false;
      }, 500);
    });
  }

  cargarDato() {
    this.selectedCodigo = this.data.codigo;
    this.codigoControl.setValue(this.selectedCodigo.codigo);
    this.principalControl.setValue(this.selectedCodigo.principal);
    this.activoControl.setValue(this.selectedCodigo.activo);

    //cargar input
    this.codigoInput.id = this.selectedCodigo.id;
  }

  onSave() {
    this.codigoInput.codigo = this.codigoControl.value;
    this.codigoInput.activo = this.activoControl.value;
    this.codigoInput.principal = this.principalControl.value;
    this.codigoInput.presentacionId = this.data.presentacion.id;
    //primero buscar si ya existe el codigo a guardar
    let isCodigoInUse = false;
    this.codigoService
      .onGetCodigoPorCodigo(this.codigoInput.codigo).pipe(untilDestroyed(this))
      .subscribe((res: Codigo[]) => {
        if (res != null) {
          switch (res.length) {
            case 0:
              isCodigoInUse = false;
              break;
            case 1:
              if (res[0].id === this.codigoInput.id) {
                isCodigoInUse = false;
              } else {
                isCodigoInUse = true;
              }
              break;
            default:
              isCodigoInUse = true;
              break;
          }

          if(isCodigoInUse){
            this.notificacionSnackBar.notification$.next({
              texto: 'El código ya está en uso',
              duracion: 3,
              color: NotificacionColor.danger
            })
          } else {
            this.codigoService.onSaveCodigo(this.codigoInput).pipe(untilDestroyed(this)).subscribe(res2 => {
              if(res2!=null){
                this.matDialogRef.close({codigo: res2, index: this.data.index, presentacionIndex: this.data.presentacionIndex})
              }
            })
          }
        }
      });
  }

  onCancelar() {
    this.matDialogRef.close()
  }
}
