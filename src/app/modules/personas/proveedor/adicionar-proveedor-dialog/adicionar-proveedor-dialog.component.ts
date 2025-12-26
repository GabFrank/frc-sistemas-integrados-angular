import { 
  Component, 
  Inject, 
  OnInit, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  OnDestroy 
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { MatButton } from "@angular/material/button";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

import { Ciudad } from "../../../general/ciudad/ciudad.model";
import { CiudadService } from "../../../general/ciudad/ciudad.service";
import { Pais } from "../../../general/pais/pais.model";
import { Persona } from "../../persona/persona.model";
import { PersonaService } from "../../persona/persona.service";
import { Proveedor, ProveedorInput } from "../proveedor.model";
import { ProveedorService } from "../proveedor.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
  TableData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { PersonaSearchGQL } from "../../persona/graphql/personaSearch";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { PersonaInput } from "../../persona/persona/persona-input.model";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { MainService } from "../../../../main.service";

export interface AdicionarProveedorData {
  proveedor?: Proveedor;
  isEditing?: boolean;
}

export interface AdicionarProveedorResult {
  proveedor?: Proveedor;
  created?: boolean;
  updated?: boolean;
  cancelled?: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-adicionar-proveedor-dialog",
  templateUrl: "./adicionar-proveedor-dialog.component.html",
  styleUrls: ["./adicionar-proveedor-dialog.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdicionarProveedorDialogComponent implements OnInit, OnDestroy {
  @ViewChild("nombreInput") nombreInput: ElementRef<HTMLInputElement>;
  @ViewChild("apodoInput") apodoInput: ElementRef<HTMLInputElement>;
  @ViewChild("documentoInput") documentoInput: ElementRef<HTMLInputElement>;
  @ViewChild("telefonoInput") telefonoInput: ElementRef<HTMLInputElement>;
  @ViewChild("guardarButton") guardarButton: MatButton;

  // Main form group
  proveedorFormGroup = new FormGroup({
    // Persona fields
    nombre: new FormControl('', [Validators.required, Validators.minLength(2)]),
    apodo: new FormControl(''), // Optional field
    documento: new FormControl('', [Validators.required, Validators.minLength(6)]),
    telefono: new FormControl('', [Validators.minLength(9)]),
    
    // Proveedor fields
    credito: new FormControl(false),
    chequeDias: new FormControl(8, [Validators.min(1), Validators.max(365)])
  });

  // Search control for persona lookup
  buscarPersonaControl = new FormControl('');

  // Selected data
  selectedPersona: Persona | null = null;
  selectedProveedor: Proveedor | null = null;

  // Loading states
  isLoading = false;
  isSearching = false;
  isSaving = false;

  // Computed properties for template usage
  dialogTitleComputed = '';
  isEditingModeComputed = false;
  canSaveComputed = false;
  isFormValidComputed = false;
  showCreditTermsComputed = false;
  hasPersonaSelectedComputed = false;
  personaDisplayNameComputed = '';
  
  // Form field validation computed properties
  nombreValidComputed = false;
  nombreInvalidComputed = false;
  nombreErrorMessageComputed = '';
  nombreIconComputed = 'person';
  
  apodoValidComputed = false;
  apodoInvalidComputed = false;
  apodoErrorMessageComputed = '';
  
  documentoValidComputed = false;
  documentoInvalidComputed = false;
  documentoErrorMessageComputed = '';
  documentoIconComputed = 'badge';
  
  telefonoValidComputed = false;
  telefonoInvalidComputed = false;
  telefonoErrorMessageComputed = '';
  
  chequeDiasValidComputed = false;
  chequeDiasInvalidComputed = false;
  chequeDiasErrorMessageComputed = '';
  
  // Credit toggle computed properties
  creditoIconComputed = 'money_off';
  creditoLabelComputed = 'Sin Crédito';
  
  // Document verification state
  documentVerificationState: 'none' | 'checking' | 'found' | 'available' = 'none';
  documentVerificationMessage = '';
  showDocumentWarning = false;
  foundPersona: Persona | null = null;
  foundProveedor: Proveedor | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarProveedorData,
    private matDialogRef: MatDialogRef<AdicionarProveedorDialogComponent>,
    private personaService: PersonaService,
    private proveedorService: ProveedorService,
    private ciudadService: CiudadService,
    private matDialog: MatDialog,
    private personaSearch: PersonaSearchGQL,
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
    
    // If editing, load existing data
    if (this.data?.isEditing && this.selectedProveedor) {
      this.loadExistingProveedorData();
    }
  }

  ngOnDestroy(): void {
    // Cleanup handled by UntilDestroy decorator
  }

  private setupFormSubscriptions(): void {
    // Search personas debounced
    this.buscarPersonaControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => {
        // Auto-search is handled when user types in the search field
      });

    // Document verification on change
    this.proveedorFormGroup.get('documento')?.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), untilDestroyed(this))
      .subscribe((documento) => {
        if (documento && documento.trim().length >= 6) {
          this.onDocumentVerification(documento.trim());
        } else {
          this.clearDocumentVerification();
        }
      });

    // Form changes to update computed properties
    this.proveedorFormGroup.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
      });

    // Credit toggle to update computed properties
    this.proveedorFormGroup.get('credito')?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateComputedProperties();
      });
  }

  private loadExistingProveedorData(): void {
    if (!this.selectedProveedor || !this.selectedPersona) return;

    this.proveedorFormGroup.patchValue({
      nombre: this.selectedPersona.nombre,
      apodo: this.selectedPersona.apodo || '',
      documento: this.selectedPersona.documento,
      telefono: this.selectedPersona.telefono,
      credito: this.selectedProveedor.credito || false,
      chequeDias: this.selectedProveedor.chequeDias || 8
    });

    this.updateComputedProperties();
  }

  onSearchPersona(): void {
    if (this.isSearching) return;

    const searchText = this.buscarPersonaControl.value?.trim();
    if (!searchText) {
      this.openPersonaSearchDialog();
      return;
    }

    // First try exact search by document or name
    this.isSearching = true;
    this.cdr.markForCheck();

    this.personaService.onGetPorDocumento(searchText.trim())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (persona) => {
          this.isSearching = false;
          if (persona?.id) {
            this.onSelectPersona(persona);
          } else {
            // If not found by document, try by name or open search dialog
            this.openPersonaSearchDialog(searchText);
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSearching = false;
          this.openPersonaSearchDialog(searchText);
          this.cdr.markForCheck();
        }
      });
  }

  private openPersonaSearchDialog(searchText?: string): void {
    const tableData: TableData[] = [
      { id: "id", nombre: "Id" },
      { id: "nombre", nombre: "Nombre" },
      { id: "documento", nombre: "Documento" },
      { id: "telefono", nombre: "Teléfono" }
    ];

    const data: SearchListtDialogData = {
      query: this.personaSearch,
      tableData: tableData,
      titulo: "Buscar Persona",
      search: true,
    };

    this.matDialog
      .open(SearchListDialogComponent, {
        data: data,
        width: "70%",
        height: "80%",
      })
      .afterClosed()
      .subscribe((persona: Persona) => {
        if (persona?.id) {
          this.onSelectPersona(persona);
        }
      });
  }

  onSelectPersona(persona: Persona): void {
    this.selectedPersona = persona;
    
    // Fill form with persona data
    this.proveedorFormGroup.patchValue({
      nombre: persona.nombre,
      apodo: persona.apodo || '',
      documento: persona.documento,
      telefono: persona.telefono || ''
    });

    // Clear search field and show selected persona
    this.buscarPersonaControl.setValue(`${persona.nombre} - ${persona.documento}`);
    
    // Check if this persona is already a proveedor
    if (persona.isProveedor) {
      this.checkExistingProveedor(persona.id);
    }
    
    this.clearDocumentVerification();
    this.updateComputedProperties();
    this.notificacionService.openSucess("Persona seleccionada exitosamente");
  }

  private checkExistingProveedor(personaId: number): void {
    this.proveedorService.onGetPorPersona(personaId)
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
        error: (error) => {
          console.error('Error checking existing proveedor:', error);
        }
      });
  }

  onClearPersonaSelection(): void {
    this.selectedPersona = null;
    this.selectedProveedor = null;
    this.buscarPersonaControl.setValue('');
    this.proveedorFormGroup.patchValue({
      nombre: '',
      apodo: '',
      documento: '',
      telefono: ''
    });
    this.clearDocumentVerification();
    this.updateComputedProperties();
  }

  private onDocumentVerification(documento: string): void {
    if (!documento || documento.length < 6) {
      this.clearDocumentVerification();
      return;
    }

    this.documentVerificationState = 'checking';
    this.documentVerificationMessage = 'Verificando documento...';
    this.cdr.markForCheck();

    this.personaService.onGetPorDocumento(documento.trim())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (persona) => {
          if (persona?.id) {
            this.foundPersona = persona;
            this.documentVerificationState = 'found';
            
            if (persona.isProveedor) {
              this.documentVerificationMessage = 'Este documento ya está registrado como proveedor';
              this.showDocumentWarning = true;
              this.checkExistingProveedor(persona.id);
            } else {
              this.documentVerificationMessage = 'Persona encontrada. ¿Desea usar los datos existentes?';
              this.showDocumentWarning = false;
              this.showUseExistingPersonaDialog(persona);
            }
          } else {
            this.foundPersona = null;
            this.documentVerificationState = 'available';
            this.documentVerificationMessage = 'Documento disponible para nuevo registro';
            this.showDocumentWarning = false;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.foundPersona = null;
          this.documentVerificationState = 'available';
          this.documentVerificationMessage = 'Documento disponible para nuevo registro';
          this.showDocumentWarning = false;
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
          // User chose not to use existing persona, clear the document field
          this.proveedorFormGroup.patchValue({ documento: '' });
          this.clearDocumentVerification();
        }
      });
  }

  private clearDocumentVerification(): void {
    this.documentVerificationState = 'none';
    this.documentVerificationMessage = '';
    this.showDocumentWarning = false;
    this.foundPersona = null;
    this.foundProveedor = null;
  }

  onGuardar(): void {
    if (!this.canSaveComputed || this.isSaving) {
      return;
    }

    const formValue = this.proveedorFormGroup.value;
    
    // Validate required fields
    if (!formValue.nombre?.trim() || !formValue.documento?.trim()) {
      this.notificacionService.openWarn("Complete todos los campos requeridos");
      return;
    }

    this.isSaving = true;
    this.updateComputedProperties();

    if (this.selectedPersona) {
      // Use existing persona
      this.createOrUpdateProveedor(this.selectedPersona);
    } else {
      // Create new persona first, then proveedor
      this.createPersonaThenProveedor(formValue);
    }
  }

  private createPersonaThenProveedor(formValue: any): void {
    const personaInput = new PersonaInput();
    personaInput.nombre = formValue.nombre.trim().toUpperCase();
    personaInput.apodo = formValue.apodo?.trim().toUpperCase() || '';
    personaInput.documento = formValue.documento.trim();
    personaInput.telefono = formValue.telefono?.trim() || '';

    this.personaService.onSavePersona(personaInput)
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
          console.error('Error creating persona:', error);
          this.isSaving = false;
          this.updateComputedProperties();
          this.notificacionService.openWarn("Error al crear la persona");
        }
      });
  }

  private createOrUpdateProveedor(persona: Persona): void {
    const formValue = this.proveedorFormGroup.value;
    
    const proveedorInput = new ProveedorInput();
    
    if (this.selectedProveedor?.id) {
      // Updating existing proveedor
      proveedorInput.id = this.selectedProveedor.id;
      proveedorInput.creadoEn = this.selectedProveedor.creadoEn;
      proveedorInput.usuarioId = this.selectedProveedor.usuario?.id;
    } else {
      // Creating new proveedor
      proveedorInput.usuarioId = this.mainService.usuarioActual?.id;
    }
    
    proveedorInput.personaId = persona.id;
    proveedorInput.credito = formValue.credito || false;
    proveedorInput.chequeDias = formValue.chequeDias || 8;

    this.proveedorService.onSave(proveedorInput)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (proveedor) => {
          if (proveedor?.id) {
            const isUpdate = !!this.selectedProveedor?.id;
            const result: AdicionarProveedorResult = {
              proveedor: proveedor,
              created: !isUpdate,
              updated: isUpdate,
              cancelled: false
            };
            
            this.notificacionService.openSucess(
              isUpdate ? "Proveedor actualizado exitosamente" : "Proveedor creado exitosamente"
            );
            this.matDialogRef.close(result);
          } else {
            this.isSaving = false;
            this.updateComputedProperties();
            this.notificacionService.openWarn("Error al guardar el proveedor");
          }
        },
        error: (error) => {
          console.error('Error saving proveedor:', error);
          this.isSaving = false;
          this.updateComputedProperties();
          this.notificacionService.openWarn("Error al guardar el proveedor");
        }
      });
  }

  onCancelar(): void {
    const result: AdicionarProveedorResult = {
      cancelled: true
    };
    this.matDialogRef.close(result);
  }

  // Focus management methods
  focusNombre(): void {
    if (this.nombreInput?.nativeElement) {
      this.nombreInput.nativeElement.focus();
    }
  }

  focusApodo(): void {
    if (this.apodoInput?.nativeElement) {
      this.apodoInput.nativeElement.focus();
    }
  }

  focusDocumento(): void {
    if (this.documentoInput?.nativeElement) {
      this.documentoInput.nativeElement.focus();
    }
  }

  focusTelefono(): void {
    if (this.telefonoInput?.nativeElement) {
      this.telefonoInput.nativeElement.focus();
    }
  }

  focusGuardarButton(): void {
    if (this.guardarButton?._elementRef?.nativeElement) {
      this.guardarButton._elementRef.nativeElement.focus();
    }
  }

  // Enter key handlers for keyboard navigation
  onNombreEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.proveedorFormGroup.get('nombre')?.valid) {
        this.focusApodo();
      } else {
        this.proveedorFormGroup.get('nombre')?.markAsTouched();
        this.updateComputedProperties();
      }
    }
  }

  onApodoEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.focusDocumento();
    }
  }

  onDocumentoEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.proveedorFormGroup.get('documento')?.valid) {
        this.focusTelefono();
      } else {
        this.proveedorFormGroup.get('documento')?.markAsTouched();
        this.updateComputedProperties();
      }
    }
  }

  onTelefonoEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.canSaveComputed) {
        this.onGuardar();
      } else {
        this.focusGuardarButton();
      }
    }
  }

  onGuardarButtonEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onGuardar();
    }
  }

  // Method to update computed properties for template usage
  private updateComputedProperties(): void {
    // Dialog title
    this.dialogTitleComputed = this.selectedProveedor?.id ? 'Editar Proveedor' : 'Nuevo Proveedor';
    
    // Editing mode
    this.isEditingModeComputed = !!this.data?.isEditing && !!this.selectedProveedor?.id;
    
    // Form validation
    this.isFormValidComputed = this.proveedorFormGroup.valid;
    
    // Can save computation
    this.canSaveComputed = this.isFormValidComputed && !this.isSaving && !this.isLoading;
    
    // Credit terms visibility and properties
    const creditoValue = !!this.proveedorFormGroup.get('credito')?.value;
    this.showCreditTermsComputed = creditoValue;
    this.creditoIconComputed = creditoValue ? 'account_balance' : 'money_off';
    this.creditoLabelComputed = creditoValue ? 'Con Crédito' : 'Sin Crédito';
    
    // Persona selection state
    this.hasPersonaSelectedComputed = !!this.selectedPersona;
    this.personaDisplayNameComputed = this.selectedPersona 
      ? `${this.selectedPersona.nombre} - ${this.selectedPersona.documento}`
      : '';
      
    // Update form field computed properties
    this.updateFieldComputedProperties('nombre');
    this.updateFieldComputedProperties('apodo');
    this.updateFieldComputedProperties('documento');
    this.updateFieldComputedProperties('telefono');
    this.updateFieldComputedProperties('chequeDias');
    
    // Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  private updateFieldComputedProperties(fieldName: string): void {
    const control = this.proveedorFormGroup.get(fieldName);
    const isValid = !!(control && control.valid && control.touched);
    const isInvalid = !!(control && control.invalid && control.touched);
    const errorMessage = this.getFieldErrorMessage(fieldName);
    
    switch (fieldName) {
      case 'nombre':
        this.nombreValidComputed = isValid;
        this.nombreInvalidComputed = isInvalid;
        this.nombreErrorMessageComputed = errorMessage;
        this.nombreIconComputed = isValid ? 'check_circle' : (isInvalid ? 'error' : 'person');
        break;
        
      case 'apodo':
        this.apodoValidComputed = isValid;
        this.apodoInvalidComputed = isInvalid;
        this.apodoErrorMessageComputed = errorMessage;
        break;
        
      case 'documento':
        this.documentoValidComputed = isValid;
        this.documentoInvalidComputed = isInvalid;
        this.documentoErrorMessageComputed = errorMessage;
        this.documentoIconComputed = isValid ? 'check_circle' : (isInvalid ? 'error' : 'badge');
        break;
        
      case 'telefono':
        this.telefonoValidComputed = isValid;
        this.telefonoInvalidComputed = isInvalid;
        this.telefonoErrorMessageComputed = errorMessage;
        break;
        
      case 'chequeDias':
        this.chequeDiasValidComputed = isValid;
        this.chequeDiasInvalidComputed = isInvalid;
        this.chequeDiasErrorMessageComputed = errorMessage;
        break;
    }
  }

  // Helper method to get form control error messages
  getFieldErrorMessage(fieldName: string): string {
    const control = this.proveedorFormGroup.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) {
      return `${fieldName} es requerido`;
    }
    if (errors['minlength']) {
      return `${fieldName} debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
    }
    if (errors['min']) {
      return `${fieldName} debe ser mayor a ${errors['min'].min}`;
    }
    if (errors['max']) {
      return `${fieldName} debe ser menor a ${errors['max'].max}`;
    }
    return 'Campo inválido';
  }

  // Helper methods for template - REMOVED to follow performance rule
  // All validation logic now uses computed properties updated in updateComputedProperties()
}
