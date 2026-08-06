import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  Optional,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

import { MainService } from "../../../../main.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { PersonaInput } from "../../persona/persona/persona-input.model";
import { Persona } from "../../persona/persona.model";
import { PersonaService } from "../../persona/persona.service";
import {
  ProveedorServicio,
  ProveedorServicioInput,
} from "../proveedor-servicio.model";
import { ProveedorServicioService } from "../proveedor-servicio.service";

export interface EditProveedorServicioData {
  proveedorServicio?: ProveedorServicio;
  isEditing?: boolean;
}

export interface EditProveedorServicioResult {
  saved?: boolean;
  proveedorServicio?: ProveedorServicio;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-edit-proveedor-servicio",
  templateUrl: "./edit-proveedor-servicio.component.html",
  styleUrls: ["./edit-proveedor-servicio.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProveedorServicioComponent implements OnInit {
  @ViewChild("nombreInput") nombreInput: ElementRef<HTMLInputElement>;
  @ViewChild("apodoInput") apodoInput: ElementRef<HTMLInputElement>;
  @ViewChild("documentoInput") documentoInput: ElementRef<HTMLInputElement>;
  @ViewChild("telefonoInput") telefonoInput: ElementRef<HTMLInputElement>;
  @ViewChild("nombreContactoInput")
  nombreContactoInput: ElementRef<HTMLInputElement>;
  @ViewChild("numeroContactoInput")
  numeroContactoInput: ElementRef<HTMLInputElement>;
  @ViewChild("guardarButton") guardarButton: MatButton;

  proveedorServicioFormGroup = new FormGroup({
    nombre: new FormControl("", [Validators.required, Validators.minLength(2)]),
    apodo: new FormControl(""),
    documento: new FormControl("", [
      Validators.required,
      Validators.minLength(6),
    ]),
    telefono: new FormControl("", [Validators.minLength(9)]),
    nombreContacto: new FormControl(""),
    numeroContacto: new FormControl(""),
  });

  personaList: Persona[] = [];
  selectedPersona: Persona | null = null;
  selectedProveedorServicio: ProveedorServicio | null = null;

  isLoading = false;
  isSearching = false;
  isSaving = false;

  dialogTitleComputed = "";
  isEditingModeComputed = false;
  canSaveComputed = false;
  isFormValidComputed = false;
  hasPersonaSelectedComputed = false;
  personaDisplayNameComputed = "";

  nombreValidComputed = false;
  nombreInvalidComputed = false;
  nombreErrorMessageComputed = "";
  nombreIconComputed = "person";

  apodoInvalidComputed = false;
  apodoErrorMessageComputed = "";

  documentoValidComputed = false;
  documentoInvalidComputed = false;
  documentoErrorMessageComputed = "";
  documentoIconComputed = "badge";

  telefonoInvalidComputed = false;
  telefonoErrorMessageComputed = "";

  documentVerificationState: "none" | "checking" | "found" | "available" =
    "none";
  documentVerificationMessage = "";
  showDocumentWarning = false;
  foundPersona: Persona | null = null;

  constructor(
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public data: EditProveedorServicioData | null,
    @Optional()
    private matDialogRef: MatDialogRef<EditProveedorServicioComponent>,
    private personaService: PersonaService,
    private proveedorServicioService: ProveedorServicioService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {
    if (data?.proveedorServicio) {
      this.selectedProveedorServicio = data.proveedorServicio;
      this.selectedPersona = data.proveedorServicio.persona;
    }
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.updateComputedProperties();
    if (this.data?.isEditing && this.selectedProveedorServicio?.id) {
      this.proveedorServicioService
        .onGetPorId(this.selectedProveedorServicio.id)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (full) => {
            if (full) {
              this.selectedProveedorServicio = full;
              this.selectedPersona = full.persona ?? this.selectedPersona;
            }
            this.loadExistingData();
          },
          error: () => this.loadExistingData(),
        });
    } else {
      this.loadExistingData();
    }
  }

  private setupFormSubscriptions(): void {
    this.proveedorServicioFormGroup
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

    this.proveedorServicioFormGroup.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
      });
  }

  private loadExistingData(): void {
    if (!this.selectedProveedorServicio || !this.selectedPersona) return;
    this.proveedorServicioFormGroup.patchValue({
      nombre: this.selectedPersona.nombre,
      apodo: this.selectedPersona.apodo || "",
      documento: this.selectedPersona.documento,
      telefono: this.selectedPersona.telefono || "",
      nombreContacto: this.selectedProveedorServicio.nombreContacto || "",
      numeroContacto: this.selectedProveedorServicio.numeroContacto || "",
    });
    this.updateComputedProperties();
  }

  onPersonaInputChange(searchText: string): void {
    if (!searchText || searchText.trim().length < 2) {
      this.personaList = [];
      return;
    }
    this.isSearching = true;
    this.cdr.markForCheck();
    this.personaService
      .onSearchSilent(searchText.trim(), true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (personas) => {
          this.personaList = personas || [];
          this.isSearching = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.personaList = [];
          this.isSearching = false;
          this.cdr.markForCheck();
        },
      });
  }

  onPersonaSelectionChange(persona: Persona): void {
    if (persona?.id) {
      this.onSelectPersona(persona);
    }
  }

  onSelectPersona(persona: Persona): void {
    this.selectedPersona = persona;
    this.proveedorServicioFormGroup.patchValue({
      nombre: persona.nombre,
      apodo: persona.apodo || "",
      documento: persona.documento,
      telefono: persona.telefono || "",
    });
    this.checkExistingProveedorServicio(persona.id);
    this.clearDocumentVerification();
    this.updateComputedProperties();
    this.notificacionService.openSucess("Persona seleccionada exitosamente");
  }

  private checkExistingProveedorServicio(personaId: number): void {
    this.proveedorServicioService
      .onGetPorPersona(personaId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (proveedorServicio) => {
          if (proveedorServicio?.id) {
            this.dialogosService
              .confirm(
                "Proveedor de servicio existente",
                "Esta persona ya está registrada como proveedor de servicio. ¿Desea cargar los datos existentes?"
              )
              .subscribe((confirmed) => {
                if (confirmed) {
                  this.selectedProveedorServicio = proveedorServicio;
                  this.proveedorServicioFormGroup.patchValue({
                    nombreContacto: proveedorServicio.nombreContacto || "",
                    numeroContacto: proveedorServicio.numeroContacto || "",
                  });
                  this.updateComputedProperties();
                }
              });
          }
        },
        error: () => {},
      });
  }

  onClearPersonaSelection(): void {
    this.selectedPersona = null;
    this.selectedProveedorServicio = null;
    this.personaList = [];
    this.proveedorServicioFormGroup.patchValue({
      nombre: "",
      apodo: "",
      documento: "",
      telefono: "",
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
      .onGetPorDocumento(documento.trim())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (persona) => {
          if (persona?.id) {
            this.foundPersona = persona;
            this.documentVerificationState = "found";
            this.documentVerificationMessage =
              "Persona encontrada. ¿Desea usar los datos existentes?";
            this.showDocumentWarning = false;
            this.showUseExistingPersonaDialog(persona);
          } else {
            this.foundPersona = null;
            this.documentVerificationState = "available";
            this.documentVerificationMessage =
              "Documento disponible para nuevo registro";
            this.showDocumentWarning = false;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.foundPersona = null;
          this.documentVerificationState = "available";
          this.documentVerificationMessage =
            "Documento disponible para nuevo registro";
          this.showDocumentWarning = false;
          this.cdr.markForCheck();
        },
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
          this.proveedorServicioFormGroup.patchValue({ documento: "" });
          this.clearDocumentVerification();
        }
      });
  }

  private clearDocumentVerification(): void {
    this.documentVerificationState = "none";
    this.documentVerificationMessage = "";
    this.showDocumentWarning = false;
    this.foundPersona = null;
  }

  onGuardar(): void {
    if (!this.canSaveComputed || this.isSaving) return;
    const formValue = this.proveedorServicioFormGroup.value;
    if (!formValue.nombre?.trim() || !formValue.documento?.trim()) {
      this.notificacionService.openWarn("Complete todos los campos requeridos");
      return;
    }
    this.isSaving = true;
    this.updateComputedProperties();
    if (this.selectedPersona) {
      this.updatePersonaThenProveedorServicio(this.selectedPersona, formValue);
    } else {
      this.createPersonaThenProveedorServicio(formValue);
    }
  }

  private updatePersonaThenProveedorServicio(
    persona: Persona,
    formValue: any
  ): void {
    const personaModel = Object.assign(new Persona(), persona);
    const personaInput = personaModel.toInput();

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
            this.createOrUpdateProveedorServicio(updatedPersona);
          } else {
            this.onSaveError("Error al actualizar la persona");
          }
        },
        error: () => this.onSaveError("Error al actualizar la persona"),
      });
  }

  private createPersonaThenProveedorServicio(formValue: any): void {
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
            this.createOrUpdateProveedorServicio(persona);
          } else {
            this.onSaveError("Error al crear la persona");
          }
        },
        error: () => this.onSaveError("Error al crear la persona"),
      });
  }

  private createOrUpdateProveedorServicio(persona: Persona): void {
    const formValue = this.proveedorServicioFormGroup.value;
    const input = new ProveedorServicioInput();
    if (this.selectedProveedorServicio?.id) {
      input.id = this.selectedProveedorServicio.id;
      input.usuarioId = this.selectedProveedorServicio.usuario?.id;
    } else {
      input.usuarioId = this.mainService.usuarioActual?.id;
    }
    input.personaId = persona.id;
    input.nombreContacto =
      formValue.nombreContacto?.trim().toUpperCase() || null;
    input.numeroContacto = formValue.numeroContacto?.trim() || null;

    this.proveedorServicioService
      .onSave(input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (proveedorServicio) => {
          if (proveedorServicio?.id) {
            const isUpdate = !!this.selectedProveedorServicio?.id;
            this.notificacionService.openSucess(
              isUpdate
                ? "Proveedor de servicio actualizado exitosamente"
                : "Proveedor de servicio creado exitosamente"
            );
            const result: EditProveedorServicioResult = {
              saved: true,
              proveedorServicio,
            };
            if (this.matDialogRef) {
              this.matDialogRef.close(result);
            }
          } else {
            this.onSaveError("Error al guardar el proveedor de servicio");
          }
        },
        error: () =>
          this.onSaveError("Error al guardar el proveedor de servicio"),
      });
  }

  private onSaveError(mensaje: string): void {
    this.isSaving = false;
    this.updateComputedProperties();
    this.notificacionService.openWarn(mensaje);
  }

  onCancelar(): void {
    const result: EditProveedorServicioResult = { saved: false };
    if (this.matDialogRef) {
      this.matDialogRef.close(result);
    }
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
  focusNombreContacto(): void {
    this.nombreContactoInput?.nativeElement?.focus();
  }
  focusNumeroContacto(): void {
    this.numeroContactoInput?.nativeElement?.focus();
  }
  focusGuardarButton(): void {
    this.guardarButton?._elementRef?.nativeElement?.focus();
  }

  onNombreEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      if (this.proveedorServicioFormGroup.get("nombre")?.valid) {
        this.focusApodo();
      } else {
        this.proveedorServicioFormGroup.get("nombre")?.markAsTouched();
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
      if (this.proveedorServicioFormGroup.get("documento")?.valid) {
        this.focusTelefono();
      } else {
        this.proveedorServicioFormGroup.get("documento")?.markAsTouched();
        this.updateComputedProperties();
      }
    }
  }
  onTelefonoEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.focusNombreContacto();
    }
  }
  onNombreContactoEnter(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      this.focusNumeroContacto();
    }
  }
  onNumeroContactoEnter(event: KeyboardEvent): void {
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
    this.dialogTitleComputed = this.selectedProveedorServicio?.id
      ? "Editar Proveedor de Servicio"
      : "Nuevo Proveedor de Servicio";
    this.isEditingModeComputed =
      !!this.data?.isEditing && !!this.selectedProveedorServicio?.id;
    this.isFormValidComputed = this.proveedorServicioFormGroup.valid;
    this.canSaveComputed =
      this.isFormValidComputed && !this.isSaving && !this.isLoading;
    this.hasPersonaSelectedComputed = !!this.selectedPersona;
    this.personaDisplayNameComputed = this.selectedPersona
      ? `${this.selectedPersona.nombre} - ${this.selectedPersona.documento}`
      : "";
    this.updateFieldComputedProperties("nombre");
    this.updateFieldComputedProperties("apodo");
    this.updateFieldComputedProperties("documento");
    this.updateFieldComputedProperties("telefono");
    this.cdr.markForCheck();
  }

  private updateFieldComputedProperties(fieldName: string): void {
    const control = this.proveedorServicioFormGroup.get(fieldName);
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
        this.telefonoInvalidComputed = isInvalid;
        this.telefonoErrorMessageComputed = errorMessage;
        break;
    }
  }

  getFieldErrorMessage(fieldName: string): string {
    const control = this.proveedorServicioFormGroup.get(fieldName);
    if (!control?.errors || !control.touched) return "";
    const errors = control.errors;
    if (errors["required"]) return `${fieldName} es requerido`;
    if (errors["minlength"])
      return `${fieldName} debe tener al menos ${errors["minlength"].requiredLength} caracteres`;
    return "Campo inválido";
  }
}
