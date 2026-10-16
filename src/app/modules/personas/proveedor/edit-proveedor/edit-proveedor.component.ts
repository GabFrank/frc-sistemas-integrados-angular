import { LECTURA_ESTRICTA } from '../../../../generics/generic-crud.service';
import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  Optional
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatButton } from "@angular/material/button";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

import { Persona } from "../../persona/persona.model";
import { PersonaService } from "../../persona/persona.service";
import { Proveedor, ProveedorInput } from "../proveedor.model";
import { ProveedorService } from "../proveedor.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { PersonaInput } from "../../persona/persona/persona-input.model";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { MainService } from "../../../../main.service";
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { OpcionesBuscador } from "../../../../shared/services/buscador.service";

export interface EditProveedorData {
  proveedor?: Proveedor;
  isEditing?: boolean;
  /** Alta desde Personas («Crear proveedor»): la persona ya elegida. */
  persona?: Persona;
}

export interface EditProveedorResult {
  saved?: boolean;
  proveedor?: Proveedor;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-edit-proveedor",
  templateUrl: "./edit-proveedor.component.html",
  styleUrls: ["./edit-proveedor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditProveedorComponent implements OnInit, OnDestroy {
  @ViewChild("nombreInput") nombreInput: ElementRef<HTMLInputElement>;
  @ViewChild("apodoInput") apodoInput: ElementRef<HTMLInputElement>;
  @ViewChild("documentoInput") documentoInput: ElementRef<HTMLInputElement>;
  @ViewChild("telefonoInput") telefonoInput: ElementRef<HTMLInputElement>;
  @ViewChild("guardarButton") guardarButton: MatButton;

  proveedorFormGroup = new FormGroup({
    nombre: new FormControl("", [Validators.required, Validators.minLength(2)]),
    apodo: new FormControl(""),
    documento: new FormControl("", [Validators.required, Validators.minLength(6)]),
    telefono: new FormControl("", [Validators.minLength(9)]),
    credito: new FormControl(false),
    chequeDias: new FormControl(8, [Validators.min(1), Validators.max(365)])
  });


  personaControl = new FormControl<Persona>(null);
  /** «Adicionar» del buscador abre el alta de persona. */
  readonly opcionesPersona: OpcionesBuscador = { adicionar: true };
  selectedPersona: Persona | null = null;
  selectedProveedor: Proveedor | null = null;

  isLoading = false;
  isSaving = false;

  dialogTitleComputed = "";
  isEditingModeComputed = false;
  canSaveComputed = false;
  isFormValidComputed = false;
  showCreditTermsComputed = false;
  hasPersonaSelectedComputed = false;
  personaDisplayNameComputed = "";

  nombreValidComputed = false;
  nombreInvalidComputed = false;
  nombreErrorMessageComputed = "";
  nombreIconComputed = "person";

  apodoValidComputed = false;
  apodoInvalidComputed = false;
  apodoErrorMessageComputed = "";

  documentoValidComputed = false;
  documentoInvalidComputed = false;
  documentoErrorMessageComputed = "";
  documentoIconComputed = "badge";

  telefonoValidComputed = false;
  telefonoInvalidComputed = false;
  telefonoErrorMessageComputed = "";

  chequeDiasValidComputed = false;
  chequeDiasInvalidComputed = false;
  chequeDiasErrorMessageComputed = "";

  creditoIconComputed = "money_off";
  creditoLabelComputed = "Sin Crédito";

  documentVerificationState: "none" | "checking" | "found" | "available" | "unverified" = "none";
  documentVerificationMessage = "";
  showDocumentWarning = false;
  foundPersona: Persona | null = null;
  foundProveedor: Proveedor | null = null;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: EditProveedorData | null,
    @Optional() private matDialogRef: MatDialogRef<EditProveedorComponent>,
    private personaService: PersonaService,
    private proveedorService: ProveedorService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {
    if (data?.proveedor) {
      this.selectedProveedor = data.proveedor;
      this.selectedPersona = data.proveedor.persona;
    }
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.updateComputedProperties();
    if (this.data?.isEditing && this.selectedProveedor?.id) {
      this.proveedorService
        .onGetPorId(this.selectedProveedor.id)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (full) => {
            if (full) {
              this.selectedProveedor = full;
              this.selectedPersona = full.persona ?? this.selectedPersona;
            }
            this.loadExistingProveedorData();
          },
          // Editar con los datos parciales de la lista podía pisar el apodo o el teléfono de la persona al
          // guardar. Si no se pudo leer el registro completo, no se edita (#390).
          error: () => {
            this.notificacionService.openWarn('No se pudieron cargar los datos completos: volvé a abrirlo para editar.', 6);
            if (this.matDialogRef != null) this.matDialogRef.close();
            else this.loadExistingProveedorData();
          }
        });
    } else if (this.data?.persona != null) {
      this.onSelectPersona(this.data.persona);
    } else {
      this.loadExistingProveedorData();
    }
  }

  ngOnDestroy(): void {}

  private setupFormSubscriptions(): void {
    this.proveedorFormGroup
      .get("documento")
      ?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe((documento: string) => {
        if (
          documento &&
          typeof documento === "string" &&
          documento.trim().length >= 6
        ) {
          this.onDocumentVerification(documento.trim());
        } else {
          this.clearDocumentVerification();
        }
      });

    this.proveedorFormGroup.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
      });

    this.proveedorFormGroup
      .get("credito")
      ?.valueChanges.pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
      });
  }

  private loadExistingProveedorData(): void {
    if (!this.selectedProveedor || !this.selectedPersona) return;
    this.proveedorFormGroup.patchValue({
      nombre: this.selectedPersona.nombre,
      apodo: this.selectedPersona.apodo || "",
      documento: this.selectedPersona.documento,
      telefono: this.selectedPersona.telefono || "",
      credito: this.selectedProveedor.credito || false,
      chequeDias: this.selectedProveedor.chequeDias || 8
    });
    this.updateComputedProperties();
  }

  /** Elegir carga sus datos; limpiar el campo (su botón ✕) vuelve el formulario a una persona nueva. */
  onPersonaSelectionChange(persona: Persona): void {
    if (persona?.id) {
      this.onSelectPersona(persona);
    } else {
      this.onClearPersonaSelection();
    }
  }

  onSelectPersona(persona: Persona): void {
    this.selectedPersona = persona;
    this.personaControl.setValue(persona);
    this.proveedorFormGroup.patchValue({
      nombre: persona.nombre,
      apodo: persona.apodo || "",
      documento: persona.documento,
      telefono: persona.telefono || ""
    });
    if (persona.isProveedor) {
      this.checkExistingProveedor(persona.id);
    }
    this.clearDocumentVerification();
    this.updateComputedProperties();
    this.notificacionService.openSucess("Persona seleccionada exitosamente");
  }

  private checkExistingProveedor(personaId: number): void {
    this.proveedorService
      .onGetPorPersona(personaId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (proveedor) => {
          if (proveedor?.id) {
            this.dialogosService
              .confirm(
                "Proveedor Existente",
                "Esta persona ya está registrada como proveedor. ¿Desea cargar los datos existentes?"
              )
              .subscribe((confirmed) => {
                if (confirmed) {
                  this.selectedProveedor = proveedor;
                  this.proveedorFormGroup.patchValue({
                    credito: proveedor.credito || false,
                    chequeDias: proveedor.chequeDias || 8
                  });
                  this.updateComputedProperties();
                }
              });
          }
        },
        error: () => {}
      });
  }

  onClearPersonaSelection(): void {
    this.selectedPersona = null;
    this.personaControl.setValue(null);
    this.selectedProveedor = null;
    this.proveedorFormGroup.patchValue({
      nombre: "",
      apodo: "",
      documento: "",
      telefono: ""
    });
    this.clearDocumentVerification();
    this.updateComputedProperties();
  }

  private onDocumentVerification(documento: string): void {
    if (!documento || documento.length < 6) {
      this.clearDocumentVerification();
      return;
    }
    this.documentVerificationState = "checking";
    this.documentVerificationMessage = "Verificando documento...";
    this.cdr.markForCheck();
    this.personaService
      .onGetPorDocumento(documento.trim(), true, LECTURA_ESTRICTA)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (persona) => {
          // Es la persona ya elegida (de la lista o de Personas): no se pregunta si usarla.
          if (persona?.id != null && persona.id == this.selectedPersona?.id) {
            this.clearDocumentVerification();
            this.cdr.markForCheck();
            return;
          }
          if (persona?.id) {
            this.foundPersona = persona;
            this.documentVerificationState = "found";
            if (persona.isProveedor) {
              this.documentVerificationMessage =
                "Este documento ya está registrado como proveedor";
              this.showDocumentWarning = true;
              this.checkExistingProveedor(persona.id);
            } else {
              this.documentVerificationMessage =
                "Persona encontrada. ¿Desea usar los datos existentes?";
              this.showDocumentWarning = false;
              this.showUseExistingPersonaDialog(persona);
            }
          } else {
            this.foundPersona = null;
            this.documentVerificationState = "available";
            this.documentVerificationMessage =
              "Documento disponible para nuevo registro";
            this.showDocumentWarning = false;
          }
          this.cdr.markForCheck();
        },
        // No se pudo consultar (red o rechazo del servidor): no es «documento disponible» (#390).
        error: () => {
          this.foundPersona = null;
          this.documentVerificationState = "unverified";
          this.documentVerificationMessage =
            "No se pudo verificar el documento. Confirmá que no esté registrado antes de guardar.";
          this.showDocumentWarning = true;
          this.cdr.markForCheck();
        }
      });
  }

  private showUseExistingPersonaDialog(persona: Persona): void {
    this.dialogosService
      .confirm(
        "Persona Existente",
        `Ya existe una persona registrada con este documento: ${persona.nombre}. ¿Desea usar los datos existentes?`
      )
      .subscribe((confirmed) => {
        if (confirmed) {
          this.onSelectPersona(persona);
        } else {
          this.proveedorFormGroup.patchValue({ documento: "" });
          this.clearDocumentVerification();
        }
      });
  }

  private clearDocumentVerification(): void {
    this.documentVerificationState = "none";
    this.documentVerificationMessage = "";
    this.showDocumentWarning = false;
    this.foundPersona = null;
    this.foundProveedor = null;
  }

  onGuardar(): void {
    if (!this.canSaveComputed || this.isSaving) return;
    const formValue = this.proveedorFormGroup.value;
    if (!formValue.nombre?.trim() || !formValue.documento?.trim()) {
      this.notificacionService.openWarn("Complete todos los campos requeridos");
      return;
    }
    this.isSaving = true;
    this.updateComputedProperties();
    if (this.selectedPersona) {
      this.updatePersonaThenProveedor(this.selectedPersona, formValue);
    } else {
      this.createPersonaThenProveedor(formValue);
    }
  }

  private updatePersonaThenProveedor(persona: Persona, formValue: any): void {
    // Convert current raw persona object to Persona class instance and get its Input model
    const personaModel = Object.assign(new Persona(), persona);
    const personaInput = personaModel.toInput();

    // Overwrite the specific fields modified in the Proveedor form
    personaInput.nombre = formValue.nombre?.trim().toUpperCase();
    personaInput.apodo = formValue.apodo?.trim().toUpperCase() || "";
    personaInput.documento = formValue.documento?.trim();
    personaInput.telefono = formValue.telefono?.trim() || "";

    this.personaService
      .onSavePersona(personaInput)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (updatedPersona) => {
          if (updatedPersona?.id) {
            this.selectedPersona = updatedPersona;
            this.createOrUpdateProveedor(updatedPersona);
          } else {
            this.isSaving = false;
            this.updateComputedProperties();
            this.notificacionService.openWarn("Error al actualizar la persona");
          }
        },
        error: () => {
          this.isSaving = false;
          this.updateComputedProperties();
          // El genérico ya avisó, rechazo o corte (#488)
        }
      });
  }

  private createPersonaThenProveedor(formValue: any): void {
    const personaInput = new PersonaInput();
    personaInput.nombre = formValue.nombre.trim().toUpperCase();
    personaInput.apodo = formValue.apodo?.trim().toUpperCase() || "";
    personaInput.documento = formValue.documento.trim();
    personaInput.telefono = formValue.telefono?.trim() || "";
    this.personaService
      .onSavePersona(personaInput)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (persona) => {
          if (persona?.id) {
            this.selectedPersona = persona;
            this.createOrUpdateProveedor(persona);
          } else {
            this.isSaving = false;
            this.updateComputedProperties();
            this.notificacionService.openWarn("Error al crear la persona");
          }
        },
        error: (error) => {
          this.isSaving = false;
          this.updateComputedProperties();
          // El genérico ya avisó. Tras un corte la persona pudo crearse: se vuelve a verificar el documento, que la
          // ofrece si existe (el documento es único: repetir no la duplica) (#488)
          if (erroresDeRechazo(error) == null) {
            this.onDocumentVerification(personaInput.documento);
          }
        }
      });
  }

  private createOrUpdateProveedor(persona: Persona): void {
    const formValue = this.proveedorFormGroup.value;
    const proveedorInput = new ProveedorInput();
    if (this.selectedProveedor?.id) {
      proveedorInput.id = this.selectedProveedor.id;
      proveedorInput.creadoEn = this.selectedProveedor.creadoEn;
      proveedorInput.usuarioId = this.selectedProveedor.usuario?.id;
    } else {
      proveedorInput.usuarioId = this.mainService.usuarioActual?.id;
    }
    proveedorInput.personaId = persona.id;
    proveedorInput.credito = formValue.credito || false;
    proveedorInput.chequeDias = formValue.chequeDias || 8;
    this.proveedorService
      .onSave(proveedorInput, { avisarExito: false })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (proveedor) => {
          if (proveedor?.id) {
            const isUpdate = !!this.selectedProveedor?.id;
            this.notificacionService.openSucess(
              isUpdate
                ? "Proveedor actualizado exitosamente"
                : "Proveedor creado exitosamente"
            );
            const result: EditProveedorResult = {
              saved: true,
              proveedor
            };
            if (this.matDialogRef) {
              this.matDialogRef.close(result);
            }
          } else {
            this.isSaving = false;
            this.updateComputedProperties();
            this.notificacionService.openWarn("Error al guardar el proveedor");
          }
        },
        error: () => {
          this.isSaving = false;
          this.updateComputedProperties();
          // El genérico ya avisó, rechazo o corte (#488)
        }
      });
  }

  onCancelar(): void {
    const result: EditProveedorResult = { saved: false };
    if (this.matDialogRef) {
      this.matDialogRef.close(result);
    }
  }

  focusNombre(): void {
    this.nombreInput?.nativeElement?.focus();
  }
  focusApodo(): void {
    this.apodoInput?.nativeElement?.focus();
  }
  focusDocumento(): void {
    this.documentoInput?.nativeElement?.focus();
  }
  focusTelefono(): void {
    this.telefonoInput?.nativeElement?.focus();
  }
  focusGuardarButton(): void {
    this.guardarButton?._elementRef?.nativeElement?.focus();
  }

  onNombreEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      if (this.proveedorFormGroup.get("nombre")?.valid) {
        this.focusApodo();
      } else {
        this.proveedorFormGroup.get("nombre")?.markAsTouched();
        this.updateComputedProperties();
      }
    }
  }
  onApodoEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.focusDocumento();
    }
  }
  onDocumentoEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      if (this.proveedorFormGroup.get("documento")?.valid) {
        this.focusTelefono();
      } else {
        this.proveedorFormGroup.get("documento")?.markAsTouched();
        this.updateComputedProperties();
      }
    }
  }
  onTelefonoEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      if (this.canSaveComputed) {
        this.onGuardar();
      } else {
        this.focusGuardarButton();
      }
    }
  }
  onGuardarButtonEnter(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.onGuardar();
    }
  }

  private updateComputedProperties(): void {
    this.dialogTitleComputed = this.selectedProveedor?.id
      ? "Editar Proveedor"
      : "Nuevo Proveedor";
    this.isEditingModeComputed =
      !!this.data?.isEditing && !!this.selectedProveedor?.id;
    this.isFormValidComputed = this.proveedorFormGroup.valid;
    this.canSaveComputed =
      this.isFormValidComputed && !this.isSaving && !this.isLoading;
    const creditoValue = !!this.proveedorFormGroup.get("credito")?.value;
    this.showCreditTermsComputed = creditoValue;
    this.creditoIconComputed = creditoValue ? "account_balance" : "money_off";
    this.creditoLabelComputed = creditoValue ? "Con Crédito" : "Sin Crédito";
    this.hasPersonaSelectedComputed = !!this.selectedPersona;
    this.personaDisplayNameComputed = this.selectedPersona
      ? `${this.selectedPersona.nombre} - ${this.selectedPersona.documento}`
      : "";
    this.updateFieldComputedProperties("nombre");
    this.updateFieldComputedProperties("apodo");
    this.updateFieldComputedProperties("documento");
    this.updateFieldComputedProperties("telefono");
    this.updateFieldComputedProperties("chequeDias");
    this.cdr.markForCheck();
  }

  private updateFieldComputedProperties(fieldName: string): void {
    const control = this.proveedorFormGroup.get(fieldName);
    const isValid = !!(control && control.valid && control.touched);
    const isInvalid = !!(control && control.invalid && control.touched);
    const errorMessage = this.getFieldErrorMessage(fieldName);
    switch (fieldName) {
      case "nombre":
        this.nombreValidComputed = isValid;
        this.nombreInvalidComputed = isInvalid;
        this.nombreErrorMessageComputed = errorMessage;
        this.nombreIconComputed = isValid
          ? "check_circle"
          : isInvalid
            ? "error"
            : "person";
        break;
      case "apodo":
        this.apodoValidComputed = isValid;
        this.apodoInvalidComputed = isInvalid;
        this.apodoErrorMessageComputed = errorMessage;
        break;
      case "documento":
        this.documentoValidComputed = isValid;
        this.documentoInvalidComputed = isInvalid;
        this.documentoErrorMessageComputed = errorMessage;
        this.documentoIconComputed = isValid
          ? "check_circle"
          : isInvalid
            ? "error"
            : "badge";
        break;
      case "telefono":
        this.telefonoValidComputed = isValid;
        this.telefonoInvalidComputed = isInvalid;
        this.telefonoErrorMessageComputed = errorMessage;
        break;
      case "chequeDias":
        this.chequeDiasValidComputed = isValid;
        this.chequeDiasInvalidComputed = isInvalid;
        this.chequeDiasErrorMessageComputed = errorMessage;
        break;
    }
  }

  getFieldErrorMessage(fieldName: string): string {
    const control = this.proveedorFormGroup.get(fieldName);
    if (!control?.errors || !control.touched) return "";
    const errors = control.errors;
    if (errors["required"]) return `${fieldName} es requerido`;
    if (errors["minlength"])
      return `${fieldName} debe tener al menos ${errors["minlength"].requiredLength} caracteres`;
    if (errors["min"])
      return `${fieldName} debe ser mayor a ${errors["min"].min}`;
    if (errors["max"])
      return `${fieldName} debe ser menor a ${errors["max"].max}`;
    return "Campo inválido";
  }
}
