import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Moneda } from '../../../../financiero/moneda/moneda.model';
import { MonedaService } from '../../../../financiero/moneda/moneda.service';
import { FormaPago } from '../../../../financiero/forma-pago/forma-pago.model';
import { FormaPagoService } from '../../../../financiero/forma-pago/forma-pago.service';
import { PagoDetalle } from '../../pago-detalle/pago-detalle.model';
import { PagoDetalleService } from '../../pago-detalle/pago-detalle.service';
import { PdvCaja } from '../../../../financiero/pdv/caja/caja.model';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../../empresarial/sucursal/sucursal.service';
import { CajaService } from '../../../../financiero/pdv/caja/caja.service';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { PagoDetalleCuota, PagoDetalleCuotaEstado } from '../../pago-detalle-cuota/pago-detalle-cuota.model';
import { PagoDetalleCuotaService } from '../../pago-detalle-cuota/pago-detalle-cuota.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, Observable, of, tap, catchError, merge } from 'rxjs';
import { dateToString } from '../../../../../commons/core/utils/dateUtils';

export interface PagoDetalleDialogData {
  pagoId: number;
  pagoDetalle?: PagoDetalle;
  preselectedMonedaId?: number;
  preselectedFormaPagoId?: number;
  preselectedTotal?: number;
  maxAmount?: number; // Maximum amount allowed (faltaPagar from parent component)
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-pago-detalle-dialog',
  templateUrl: './pago-detalle-dialog.component.html',
  styleUrls: ['./pago-detalle-dialog.component.scss']
})
export class PagoDetalleDialogComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isEdit = false;
  
  // New property to track if pago detalle form is in edit mode
  isPagoDetalleFormEditable = false;
  
  // Store initial values for reset functionality
  initialFormValues: any = {};
  
  // Options for selects
  monedas: Moneda[] = [];
  formasPago: FormaPago[] = [];
  sucursales: Sucursal[] = [];
  cajas: PdvCaja[] = [];

  // Para la tabla de cuotas
  pagoDetalleCuotas: PagoDetalleCuota[] = [];
  displayedColumns: string[] = ['numeroCuota', 'fechaVencimiento', 'estado', 'totalFinal', 'totalPagado', 'cheque', 'acciones'];
  
  // Track the cuota being edited
  editingCuotaId: number | null = null;
  
  // Tracking total sum of cuotas
  totalCuotasSum: number = 0;
  remainingTotal: number = 0;
  cuotaFormEnabled = false;
  cuotaFormValid = false;

  // Form controls for the cuota form - create with disabled state initially
  numeroCuotaControl = new FormControl({value: 1, disabled: true}, [Validators.required, Validators.min(1)]);
  fechaVencimientoControl = new FormControl({value: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), disabled: true}, Validators.required);
  estadoControl = new FormControl({value: PagoDetalleCuotaEstado.PENDIENTE, disabled: true}, Validators.required);
  totalFinalControl = new FormControl({value: 0, disabled: true}, [Validators.required, Validators.min(0)]);

  // Currency formatting
  selectedCurrencySymbol: string = '';
  selectedCurrencyCode: string = '';
  selectedCurrency: any;

  currencyOptionsGuarani = {
    allowNegative: true,
    precision: 0,
    thousands: ".",
    nullable: false,
    inputMode: CurrencyMaskInputMode.NATURAL,
    align: "right",
    allowZero: true,
    decimal: null,
    prefix: "",
    suffix: "",
    max: null,
    min: null,
  };

  currencyOptionsNoGuarani = {
    allowNegative: true,
    precision: 2,
    thousands: ",",
    nullable: false,
    inputMode: CurrencyMaskInputMode.FINANCIAL,
    align: "right",
    allowZero: true,
    decimal: ".",
    prefix: "",
    suffix: "",
    max: null,
    min: null,
  };

  constructor(
    private dialogRef: MatDialogRef<PagoDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PagoDetalleDialogData,
    private fb: FormBuilder,
    private pagoDetalleService: PagoDetalleService,
    private pagoDetalleCuotaService: PagoDetalleCuotaService,
    private monedaService: MonedaService,
    private formaPagoService: FormaPagoService,
    private sucursalService: SucursalService,
    private cajaService: CajaService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    // Initialize form
    this.createForm();
    
    // Set edit mode based on data
    this.isEdit = !!this.data.pagoDetalle;
    
    // If in edit mode, prepare the form with existing data and set to read-only initially
    if (this.isEdit) {
      this.prepareEditMode();
    } else {
      // For new records, make the form editable by default
      this.isPagoDetalleFormEditable = true;
    }
    
    // Check for max amount in data for validation
    if (this.data.maxAmount !== undefined) {
      // Add validator for max amount if provided
      this.addMaxAmountValidator();
    }
    
    // Fetch required data
    this.loadData();
    
    // Initial fecha vencimiento state based on plazo
    this.updateFechaVencimientoState(this.form.get('plazo').value);
    
    // Listen for changes to the total field
    this.form.get('total').valueChanges.subscribe(value => {
      this.validateTotalAgainstMaxAmount(value);
      this.validateTotalAgainstCuotasSum(value);
      this.calculateRemainingTotal();
      this.updateCuotaFormEnabledState();
    });
    
    // Listen for changes to the form's valid state
    this.form.statusChanges.subscribe(() => {
      this.updateCuotaFormEnabledState();
    });
    
    // Listen for changes to cuota form controls
    this.totalFinalControl.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined) {
        this.validateTotalFinal(value);
      }
    });
    
    // Combined form controls changes for cuota form validation
    merge(
      this.numeroCuotaControl.valueChanges,
      this.fechaVencimientoControl.valueChanges,
      this.estadoControl.valueChanges,
      this.totalFinalControl.valueChanges
    ).subscribe(() => {
      this.updateCuotaFormValidState();
    });
    
    // Listen for plazo changes to update fecha vencimiento
    this.form.get('plazo').valueChanges.subscribe(plazo => {
      this.updateFechaVencimientoState(plazo);
    });
    
    // Initial calculation of remaining total
    this.calculateRemainingTotal();
  }

  /**
   * Update fecha vencimiento state based on plazo option
   * @param plazo Whether payment is on installments
   */
  updateFechaVencimientoState(plazo: boolean): void {
    if (plazo) {
      // If paying in installments, enable fecha vencimiento to allow future dates
      this.fechaVencimientoControl.enable();
      
      // Set a default date 30 days in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      this.fechaVencimientoControl.setValue(futureDate);
    } else {
      // If not paying in installments, set to current date and disable
      this.fechaVencimientoControl.setValue(new Date());
      this.fechaVencimientoControl.disable();
    }
  }

  /**
   * Update the enabled/disabled state of form controls based on edit mode
   */
  updateFormControlStates(): void {
    if (this.isEdit) {
      this.numeroCuotaControl.enable();
      this.fechaVencimientoControl.enable();
      this.estadoControl.enable();
      this.totalFinalControl.enable();
    } else {
      this.numeroCuotaControl.disable();
      this.fechaVencimientoControl.disable();
      this.estadoControl.disable();
      this.totalFinalControl.disable();
    }
  }

  /**
   * Updates the total final in the cuota form based on the total and number of cuotas
   */
  updateCuotaTotal(): void {
    const total = this.form.get('total').value;
    const cuotas = this.form.get('cuotas').value;
    
    if (total && cuotas && cuotas > 0) {
      // Calculate the total per cuota (total divided by number of cuotas)
      const totalPerCuota = total / cuotas;
      
      // Make sure the calculated value doesn't exceed remaining total
      const valueToSet = Math.min(totalPerCuota, this.remainingTotal || totalPerCuota);
      this.totalFinalControl.setValue(valueToSet);
    } else if (total) {
      // If no cuotas specified but there is a total, set full amount
      const valueToSet = Math.min(total, this.remainingTotal || total);
      this.totalFinalControl.setValue(valueToSet);
    }
  }

  /**
   * Actualiza el símbolo y código de la moneda seleccionada
   * @param monedaId ID de la moneda seleccionada
   */
  updateSelectedCurrencySymbol(monedaId: number): void {
    if (!monedaId || !this.monedas.length) {
      this.selectedCurrencySymbol = '';
      this.selectedCurrencyCode = '';
      return;
    }

    const selectedMoneda = this.monedas.find(m => m.id === monedaId);
    if (!selectedMoneda) return;
    
    this.selectedCurrencySymbol = selectedMoneda.simbolo || '';
    this.selectedCurrencyCode = ''; // We don't need the code for this component, just initializing to avoid errors
    
    // Only update total if we're not in edit mode and we have preselectedTotal
    if (!this.isEdit && this.data.preselectedTotal !== undefined && selectedMoneda.cambio) {
      this.form.get('total').setValue(this.data.preselectedTotal / selectedMoneda.cambio);
    }
    
    //here use swtich case to compare, if symbol is PYG, use currencyOptionsGuarani, if symbol is USD, BRL, ARS, use currencyOptionsNoGuarani
    switch (selectedMoneda?.simbolo) {
      case 'PYG':
        this.selectedCurrency = this.currencyOptionsGuarani;
        break;
      case 'USD':
      case 'BRL':
      case 'ARS':
        this.selectedCurrency = this.currencyOptionsNoGuarani;
        break;
      default:
        this.selectedCurrency = this.currencyOptionsNoGuarani;
        break;
    }
  }

  /**
   * Calculate and update the sum of all cuotas' totalFinal values
   */
  updateTotalCuotasSum(): void {
    if (!this.pagoDetalleCuotas || this.pagoDetalleCuotas.length === 0) {
      this.totalCuotasSum = 0;
    } else {
      this.totalCuotasSum = this.pagoDetalleCuotas.reduce((sum, cuota) => sum + (cuota.totalFinal || 0), 0);
    }
    
    // After updating the sum, validate the current total against it
    this.validateTotalAgainstCuotasSum(this.form.get('total').value);
    
    this.updateRemainingTotal();
  }

  /**
   * Validate that the total is not less than the sum of cuotas
   */
  validateTotalAgainstCuotasSum(total: number): void {
    if (this.totalCuotasSum > 0 && total < this.totalCuotasSum) {
      this.form.get('total').setErrors({ lessThanCuotasSum: true });
    } else if (this.form.get('total').hasError('lessThanCuotasSum')) {
      // Remove the error if the value is now valid
      const errors = { ...this.form.get('total').errors };
      delete errors['lessThanCuotasSum'];
      this.form.get('total').setErrors(Object.keys(errors).length ? errors : null);
    }
  }

  /**
   * Update the remaining total available for new cuotas
   */
  updateRemainingTotal(): void {
    const pagoDetalleTotal = this.form.get('total')?.value || 0;
    this.remainingTotal = Math.max(0, pagoDetalleTotal - this.totalCuotasSum);
    
    // Update the validation state of the totalFinal control
    this.validateTotalFinal(this.totalFinalControl.value);
    
    // Enable/disable cuota form based on whether there's remaining total
    this.updateCuotaFormEnabledState();
  }
  
  /**
   * Enable or disable the cuota form based on the remaining total
   */
  updateCuotaFormEnabledState(): void {
    // When editing a cuota, we always want the form enabled
    const isEditingCuota = this.editingCuotaId !== null;
    
    if (isEditingCuota) {
      // When editing a cuota, the form is always enabled
      this.cuotaFormEnabled = true;
    } else {
      // For new cuotas, follow the regular logic
      const isFormEditable = this.isEdit && this.isPagoDetalleFormEditable;
      const hasTotalValue = this.form.get('total').value > 0;
      const isValidForCurrentTotal = !this.form.get('total').hasError('exceedsMaxAmount') && 
                                    !this.form.get('total').hasError('lessThanCuotasSum');
      
      // Enable if in edit mode, has valid total value and total doesn't exceed max amount
      this.cuotaFormEnabled = isFormEditable && hasTotalValue && isValidForCurrentTotal;
    }
    
    // Update the control states based on the form enabled state
    this.updateCuotaFormControlStates();
    
    // For the save button we need additional validation
    this.updateCuotaFormValidState();
  }
  
  /**
   * Set enabled/disabled state for individual cuota form controls
   */
  updateCuotaFormControlStates(): void {
    // When editing a cuota, we always want controls enabled (unless estado restrictions apply)
    const isEditingCuota = this.editingCuotaId !== null;
    
    // Also check if there's remaining total that can be added
    const hasRemainingTotal = this.remainingTotal > 0;
    const isPlazoEnabled = this.form.get('plazo').value;
    
    if (isEditingCuota) {
      // When editing a cuota:
      
      // These fields are editable when editing a cuota
      this.totalFinalControl.enable();
      
      // Fecha vencimiento is only editable if plazo is enabled
      if (isPlazoEnabled) {
        this.fechaVencimientoControl.enable();
      } else {
        this.fechaVencimientoControl.disable();
      }
      
      // These fields are never editable
      this.numeroCuotaControl.disable();
      this.estadoControl.disable();
      
      // Set cuotaFormEnabled to true since we're editing
      this.cuotaFormEnabled = true;
    } else if (this.cuotaFormEnabled || hasRemainingTotal) {
      // For new cuotas:
      
      // Total final is always editable for new cuotas
      this.totalFinalControl.enable();
      
      // Fecha vencimiento is only editable if plazo is enabled
      if (isPlazoEnabled) {
        this.fechaVencimientoControl.enable();
      } else {
        this.fechaVencimientoControl.disable();
      }
      
      // These fields are never editable
      this.numeroCuotaControl.disable();
      this.estadoControl.disable();
      
      // Ensure form is enabled if we have remaining total
      if (hasRemainingTotal) {
        this.cuotaFormEnabled = true;
      }
    } else {
      // Disable all controls when form is disabled and not editing
      this.numeroCuotaControl.disable();
      this.fechaVencimientoControl.disable();
      this.estadoControl.disable();
      this.totalFinalControl.disable();
    }
  }
  
  /**
   * Validate the cuota form to determine if the save button should be enabled
   */
  updateCuotaFormValidState(): void {
    // Get form control values
    const numeroCuota = this.numeroCuotaControl.value;
    const fechaVencimiento = this.fechaVencimientoControl.value;
    const estado = this.estadoControl.value;
    const totalFinal = this.totalFinalControl.value;
    
    // Check if required fields are filled - we always have numero cuota and estado values
    const hasRequiredFields = 
      numeroCuota != null && 
      fechaVencimiento != null && 
      estado != null && 
      totalFinal != null;
    
    // Check if total is valid (must be > 0)
    const isTotalValid = totalFinal > 0;
    
    // Check if there's sufficient remaining total for a new cuota
    const isAddingNewCuota = this.editingCuotaId === null;
    
    let hasSufficientTotal = false;

    if (isAddingNewCuota) {
      // For new cuotas, just check if there's any remaining total
      hasSufficientTotal = this.remainingTotal > 0;
    } else {
      // For editing, allow if totalFinal is valid (either reduced or within allowed limits)
      const originalTotal = this.getEditingCuotaTotal();
      hasSufficientTotal = 
        // Always allow reducing the amount
        totalFinal <= originalTotal || 
        // Or allow increasing within limits
        (totalFinal > originalTotal && totalFinal <= (this.remainingTotal + originalTotal));
    }
    
    // Check if the form should be enabled according to business rules
    const shouldBeEnabled = this.cuotaFormEnabled && isTotalValid && hasRequiredFields && hasSufficientTotal;
    
    // Debug data
    console.log('Form validation data:', {
      numeroCuota,
      fechaVencimiento,
      estado,
      totalFinal,
      hasRequiredFields,
      isTotalValid,
      hasSufficientTotal,
      shouldBeEnabled,
      remainingTotal: this.remainingTotal,
      isAddingNewCuota
    });
    
    // Update valid state
    this.cuotaFormValid = shouldBeEnabled;
    
    // Force enable when adding new cuota with sufficient total
    if (isAddingNewCuota && this.remainingTotal > 0 && isTotalValid) {
      this.cuotaFormValid = true;
    }
    
    console.log('Cuota form valid:', this.cuotaFormValid);
  }
  
  // Helper to get the original total of the cuota being edited
  getEditingCuotaTotal(): number {
    if (this.editingCuotaId === null) return 0;
    const editingCuota = this.pagoDetalleCuotas.find(c => c.id === this.editingCuotaId);
    return editingCuota ? editingCuota.totalFinal : 0;
  }

  /**
   * Validate that the totalFinal value doesn't exceed the remaining total
   */
  validateTotalFinal(value: number): void {
    // If we're editing a cuota, we need to add its current total to the remaining total
    const adjustedRemainingTotal = this.editingCuotaId !== null 
      ? this.remainingTotal + this.getEditingCuotaTotal()
      : this.remainingTotal;
      
    if (value > adjustedRemainingTotal) {
      this.totalFinalControl.setErrors({ 'exceedsTotal': true });
    } else if (this.totalFinalControl.hasError('exceedsTotal')) {
      // Remove the exceedsTotal error if the value is now valid
      const errors = { ...this.totalFinalControl.errors };
      delete errors['exceedsTotal'];
      
      // If there are no more errors, set to null
      this.totalFinalControl.setErrors(Object.keys(errors).length ? errors : null);
    }
    
    // After validation, update if the form is valid for save button
    this.updateCuotaFormValidState();
  }

  createForm(): void {
    this.form = this.fb.group({
      monedaId: [null, Validators.required],
      formaPagoId: [null, Validators.required],
      total: [null, [Validators.required, Validators.min(0)]],
      sucursalId: [null],
      cajaId: [null],
      fechaProgramado: [null],
      activo: [true],
      plazo: [false],
      cuotas: [{value: 1, disabled: true}, [Validators.required, Validators.min(1)]] // Notice the disabled state here
    });
    
    // Listen for sucursal changes to load cajas
    this.form.get('sucursalId').valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(sucursalId => {
        if (sucursalId) {
          this.loadCajas(sucursalId);
        } else {
          this.cajas = [];
          this.form.get('cajaId').setValue(null);
        }
      });
      
    // Listen for plazo changes to update cuotas field state
    this.form.get('plazo').valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(plazo => {
        if (!plazo) {
          this.form.get('cuotas').setValue(1);
          this.form.get('cuotas').disable();
        } else {
          this.form.get('cuotas').enable();
        }
      });
  }

  /**
   * Popula el formulario con valores preseleccionados si están disponibles
   */
  populateFormWithPreselectedValues(): void {
    const formValues: any = {
      activo: true
    };
    
    // Aplica los valores preseleccionados si existen
    if (this.data.preselectedMonedaId) {
      formValues.monedaId = this.data.preselectedMonedaId;
    }
    
    if (this.data.preselectedFormaPagoId) {
      formValues.formaPagoId = this.data.preselectedFormaPagoId;
    }
    
    if (this.data.preselectedTotal !== undefined && this.data.preselectedTotal !== null) {
      formValues.total = this.data.preselectedTotal;
    }
    
    this.form.patchValue(formValues);
    
    // Store initial values after populating form
    this.storeInitialValues();
  }

  populateForm(): void {
    const detalle = this.data.pagoDetalle;
    
    if (!detalle) return;
    
    // First update form values
    const formValues = {
      monedaId: detalle.moneda?.id,
      formaPagoId: detalle.formaPago?.id,
      total: detalle.total,
      sucursalId: detalle.sucursal?.id,
      cajaId: detalle.caja?.id,
      fechaProgramado: detalle.fechaProgramado ? new Date(detalle.fechaProgramado) : null,
      activo: detalle.activo ?? true,
      plazo: detalle.plazo ?? false,
      cuotas: detalle.cuotas || 1
    };
    
    // Update form with values
    this.form.patchValue(formValues);
    
    // Store initial values after populating form for future reset
    this.storeInitialValues();
    
    // Initialize the remainingTotal with the total from the form
    this.remainingTotal = detalle.total || 0;
    
    // If it's a plazo payment, enable the cuotas field
    if (detalle.plazo) {
      this.form.get('cuotas').enable();
    } else {
      this.form.get('cuotas').disable();
    }
    
    // Update currency formatting based on selected moneda
    if (detalle.moneda?.id) {
      this.updateSelectedCurrencySymbol(detalle.moneda.id);
    }
    
    // Apply form state based on edit mode
    this.updatePagoDetalleFormState();
  }

  /**
   * Carga las cuotas asociadas al detalle de pago en edición
   */
  loadCuotas(): void {
    if (!this.data.pagoDetalle?.id) return;
    
    this.isLoading = true;
    this.pagoDetalleCuotaService.onGetPagoDetalleCuotasPorPagoDetalleId(this.data.pagoDetalle.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        cuotas => {
          this.pagoDetalleCuotas = cuotas;
          this.isLoading = false;
          
          // Calculate total sum of cuotas and update remaining total
          this.updateTotalCuotasSum();
          
          // If there are cuotas, prepare the cuota form with next number
          if (cuotas.length > 0) {
            const maxCuotaNumber = Math.max(...cuotas.map(c => c.numeroCuota));
            this.numeroCuotaControl.setValue(maxCuotaNumber + 1);
            
            // Update total for new cuota based on existing form values and remaining total
            this.updateCuotaTotal();
          }
        },
        error => {
          console.error('Error al cargar cuotas', error);
          this.isLoading = false;
          this.snackBar.open('Error al cargar las cuotas', 'Cerrar', { duration: 3000 });
        }
      );
  }

  /**
   * Limpia el formulario de cuota y prepara para una nueva cuota
   */
  clearCuotaForm(): void {
    // If we're currently editing a cuota, clearing should cancel the edit
    const wasEditing = this.editingCuotaId !== null;
    
    // Calculate next cuota number
    const nextCuotaNumber = this.pagoDetalleCuotas.length > 0 
      ? Math.max(...this.pagoDetalleCuotas.map(c => c.numeroCuota)) + 1 
      : 1;
    
    // Set numero cuota (auto-generated)
    this.numeroCuotaControl.setValue(nextCuotaNumber);
    
    // Set fecha vencimiento based on plazo option
    if (this.form.get('plazo').value) {
      // If plazo is enabled, set date 30 days in future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      this.fechaVencimientoControl.setValue(futureDate);
      this.fechaVencimientoControl.enable();
    } else {
      // If plazo is disabled, set to current date and disable
      this.fechaVencimientoControl.setValue(new Date());
      this.fechaVencimientoControl.disable();
    }
    
    // Estado is always PENDIENTE for new cuotas and not editable
    this.estadoControl.setValue(PagoDetalleCuotaEstado.PENDIENTE);
    
    // Always set the remaining total as the default value for new cuota
    // If there's no remaining total, we'll set it to zero
    this.totalFinalControl.setValue(Math.max(0, this.remainingTotal));
    
    // Reset editing state
    this.editingCuotaId = null;
    
    // Force update the cuota form state
    this.updateCuotaFormControlStates();
    this.updateCuotaFormValidState();
    
    // Force enable form if there's remaining total
    if (this.remainingTotal > 0) {
      this.cuotaFormEnabled = true;
      this.updateCuotaFormControlStates();
    }
    
    if (wasEditing) {
      this.snackBar.open('Edición de cuota cancelada', 'Cerrar', { duration: 3000 });
    } else {
      this.snackBar.open('Formulario preparado para nueva cuota', 'Cerrar', { duration: 3000 });
    }
  }

  /**
   * Agrega o actualiza una cuota desde el formulario de cuota
   */
  addCuotaFromForm(): void {
    if (this.numeroCuotaControl.invalid || this.fechaVencimientoControl.invalid || 
        this.estadoControl.invalid || this.totalFinalControl.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos correctamente', 'Cerrar', { duration: 3000 });
      return;
    }
    
    if (!this.data.pagoDetalle?.id) {
      this.snackBar.open('Debe guardar el detalle de pago antes de agregar cuotas', 'Cerrar', { duration: 3000 });
      return;
    }
    
    // Validate that the totalFinal doesn't exceed the remaining total
    // For editing, we need to make an exception since we're replacing the value
    const isEditing = this.editingCuotaId !== null;
    const maxAllowableTotal = isEditing 
      ? this.remainingTotal + (this.pagoDetalleCuotas.find(c => c.id === this.editingCuotaId)?.totalFinal || 0) 
      : this.remainingTotal;
    
    if (this.totalFinalControl.value > maxAllowableTotal) {
      this.snackBar.open(`El valor ingresado excede el monto restante (${maxAllowableTotal})`, 'Cerrar', { duration: 3000 });
      return;
    }
    
    // Create the input object for save/update
    const cuotaInput = {
      id: this.editingCuotaId, // Will be null for new cuotas
      pagoDetalleId: this.data.pagoDetalle.id,
      numeroCuota: this.numeroCuotaControl.value,
      fechaVencimiento: dateToString(this.fechaVencimientoControl.value),
      estado: this.estadoControl.value,
      totalFinal: this.totalFinalControl.value,
      totalPagado: isEditing ? (this.pagoDetalleCuotas.find(c => c.id === this.editingCuotaId)?.totalPagado || 0) : 0
    };
    
    this.isLoading = true;
    this.pagoDetalleCuotaService.onSavePagoDetalleCuota(cuotaInput)
      .pipe(untilDestroyed(this))
      .subscribe(
        result => {
          // Show success message
          this.snackBar.open(
            isEditing ? 'Cuota actualizada con éxito' : 'Cuota agregada con éxito', 
            'Cerrar', 
            { duration: 3000 }
          );
          
          // Reset editing state
          this.editingCuotaId = null;
          
          // Reload cuotas then clear form
          this.loadCuotas();
          
          // After the cuotas are loaded, we need to prepare the form for a new cuota if possible
          setTimeout(() => {
            // Calculate if we have remaining amount
            this.calculateRemainingTotal();
            
            // Prepare form for the next cuota if we have remaining total
            if (this.remainingTotal > 0) {
              this.clearCuotaForm();
            } else {
              // No more funds available, just disable the form
              this.totalFinalControl.setValue(null);
              this.updateCuotaFormEnabledState();
              this.updateCuotaFormValidState();
            }
            
            this.isLoading = false;
          }, 300); // Wait for loadCuotas to complete
        },
        error => {
          console.error('Error al ' + (isEditing ? 'actualizar' : 'agregar') + ' cuota', error);
          this.isLoading = false;
          this.snackBar.open(
            'Error al ' + (isEditing ? 'actualizar' : 'agregar') + ' la cuota', 
            'Cerrar', 
            { duration: 3000 }
          );
        }
      );
  }

  /**
   * Loads monedas and returns an Observable
   */
  loadMonedas(): Observable<Moneda[]> {
    return this.monedaService.onGetAll()
      .pipe(
        untilDestroyed(this),
        tap(monedas => {
          this.monedas = monedas;
          
          // If there's a selected moneda, update currency symbol
          const monedaId = this.isEdit ? 
            this.data.pagoDetalle?.moneda?.id : 
            this.data.preselectedMonedaId;
            
          if (monedaId) {
            this.updateSelectedCurrencySymbol(monedaId);
          }
        }),
        catchError(error => {
          console.error('Error al cargar monedas', error);
          return of([]);
        })
      );
  }

  /**
   * Loads formas de pago and returns an Observable
   */
  loadFormasPago(): Observable<FormaPago[]> {
    return this.formaPagoService.onGetAllFormaPago()
      .pipe(
        untilDestroyed(this),
        tap(formasPago => this.formasPago = formasPago),
        catchError(error => {
          console.error('Error al cargar formas de pago', error);
          return of([]);
        })
      );
  }

  /**
   * Loads sucursales and returns an Observable
   */
  loadSucursales(): Observable<Sucursal[]> {
    return this.sucursalService.onGetAllSucursales()
      .pipe(
        untilDestroyed(this),
        tap(sucursales => this.sucursales = sucursales),
        catchError(error => {
          console.error('Error al cargar sucursales', error);
          return of([]);
        })
      );
  }

  /**
   * Loads cajas for a specific sucursal and returns an Observable
   * @param sucursalId ID of the sucursal to load cajas for
   */
  loadCajas(sucursalId: number): Observable<PdvCaja[]> {
    if (!sucursalId) return of([]);
    
    // For now, this method doesn't make an actual API call
    // When implemented, it should follow the same pattern as the other load methods
    return of([]).pipe(
      tap(cajas => this.cajas = cajas),
      catchError(error => {
        console.error('Error al cargar cajas', error);
        return of([]);
      })
    );
    
    // Uncomment and use when the API method is available
    // return this.cajaService.findBySucursalId(sucursalId)
    //   .pipe(
    //     untilDestroyed(this),
    //     tap(cajas => this.cajas = cajas),
    //     catchError(error => {
    //       console.error('Error al cargar cajas', error);
    //       return of([]);
    //     })
    //   );
  }

  /**
   * No longer used - replaced by saveDetailsOnly and onCancel
   */
  onSubmit(): void {
    // Just a stub - we're using saveDetailsOnly for saving
    console.log('Form submission handled by saveDetailsOnly');
  }

  /**
   * Guarda o actualiza solo el detalle de pago sin cerrar el diálogo
   */
  saveDetailsOnly(): void {
    if (this.form.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos correctamente', 'Cerrar', { duration: 3000 });
      return;
    }
    
    this.isLoading = true;
    const formValues = this.form.getRawValue(); // Get raw values including disabled controls
    
    // Create input object
    const pagoDetalleInput = {
      id: this.data.pagoDetalle?.id,
      pagoId: this.data.pagoId,
      monedaId: formValues.monedaId,
      formaPagoId: formValues.formaPagoId,
      total: formValues.total,
      sucursalId: formValues.sucursalId,
      cajaId: formValues.cajaId,
      fechaProgramado: formValues.fechaProgramado,
      activo: formValues.activo,
      plazo: formValues.plazo,
      cuotas: formValues.plazo ? (formValues.cuotas || 1) : 1 // Default to 1 if not plazo
    };
    
    // Save or update
    const observable = this.isEdit
      ? this.pagoDetalleService.update(pagoDetalleInput)
      : this.pagoDetalleService.save(pagoDetalleInput);
    
    observable
      .pipe(untilDestroyed(this))
      .subscribe(
        result => {
          // Store the result in data for later use
          this.data.pagoDetalle = result;
          
          // Now we're in edit mode - update control states
          this.isEdit = true;
          this.updateFormControlStates();
          
          // Disable form after saving
          this.isPagoDetalleFormEditable = false;
          this.updatePagoDetalleFormState();
          
          // Store new initial values
          this.storeInitialValues();
          
          // If this was a plazo update and the plazo value changed:
          const wasPlazo = this.data.pagoDetalle?.plazo;
          const isPlazoNow = formValues.plazo;
          
          // If plazo status changed from false to true, we might need to create cuotas
          if (!wasPlazo && isPlazoNow) {
            // Handle the transition to plazo mode
            this.snackBar.open('El detalle de pago ahora está en modo plazo. Por favor, agregue las cuotas necesarias.', 'Cerrar', { duration: 5000 });
          } 
          // If plazo status changed from true to false, handle existing cuotas
          else if (wasPlazo && !isPlazoNow && this.pagoDetalleCuotas.length > 1) {
            this.snackBar.open('Atención: Este pago tenía múltiples cuotas. Al deshabilitar el modo plazo, deberá revisar las cuotas existentes.', 'Cerrar', { duration: 5000 });
          }
          
          // If not edit mode (new record) and pago plazo is false, create a default cuota
          if (!formValues.plazo && !this.pagoDetalleCuotas.length) {
            // Create a single cuota with current date as vencimiento
            const newCuota = {
              pagoDetalleId: result.id,
              numeroCuota: 1,
              fechaVencimiento: dateToString(new Date()), // Current day
              estado: PagoDetalleCuotaEstado.PENDIENTE,
              totalFinal: formValues.total,
              totalPagado: 0
            };
            
            this.pagoDetalleCuotaService.onSavePagoDetalleCuota(newCuota)
              .pipe(untilDestroyed(this))
              .subscribe(
                cuotaResult => {
                  this.loadCuotas(); // Reload cuotas
                  this.isLoading = false;
                  this.snackBar.open('Detalle de pago y cuota guardados correctamente', 'Cerrar', { duration: 3000 });
                },
                error => {
                  console.error('Error al crear cuota automática', error);
                  this.isLoading = false;
                  this.snackBar.open('Error al crear cuota automática', 'Cerrar', { duration: 3000 });
                }
              );
          } else {
            // Always reload cuotas to ensure they're up to date
            this.loadCuotas();
            this.isLoading = false;
            this.snackBar.open('Detalle de pago guardado correctamente', 'Cerrar', { duration: 3000 });
          }
        },
        error => {
          console.error('Error al guardar detalle de pago', error);
          this.isLoading = false;
          this.snackBar.open('Error al guardar detalle de pago', 'Cerrar', { duration: 3000 });
        }
      );
  }

  /**
   * Cierra el diálogo, devolviendo los datos del detalle de pago si está en modo edición
   */
  onCancel(): void {
    if (this.isEdit) {
      this.dialogRef.close(this.data.pagoDetalle);
    } else {
      this.dialogRef.close();
    }
  }

  /**
   * Edita una cuota existente
   * @param cuota Cuota a editar
   */
  editCuota(cuota: PagoDetalleCuota): void {
    if (!cuota) {
      this.snackBar.open('No se puede editar la cuota seleccionada.', 'Cerrar', { duration: 5000 });
      return;
    }

    // Save the editing cuota ID for UI highlighting before anything else
    this.editingCuotaId = cuota.id;
    
    // Force enabling the cuota form
    this.cuotaFormEnabled = true;

    // Use setTimeout to ensure controls are ready before setting values
    setTimeout(() => {
      // Set values in form controls
      this.numeroCuotaControl.setValue(cuota.numeroCuota);
      this.estadoControl.setValue(cuota.estado);
      this.totalFinalControl.setValue(cuota.totalFinal);
      
      // Handle date conversion for the date control
      this.fechaVencimientoControl.setValue(typeof cuota.fechaVencimiento === 'string' 
        ? new Date(cuota.fechaVencimiento) 
        : cuota.fechaVencimiento);
      
      // Apply constraints based on business rules
      const isPlazoEnabled = this.form.get('plazo').value;
      
      // Always disable numero cuota and estado
      this.numeroCuotaControl.disable();
      this.estadoControl.disable();
      
      // Enable total for editing
      this.totalFinalControl.enable();
      
      // Fecha vencimiento is only editable if plazo is enabled
      if (isPlazoEnabled) {
        this.fechaVencimientoControl.enable();
      } else {
        this.fechaVencimientoControl.disable();
      }

      // Force validation update for form controls
      this.numeroCuotaControl.updateValueAndValidity();
      this.fechaVencimientoControl.updateValueAndValidity();
      this.estadoControl.updateValueAndValidity();
      this.totalFinalControl.updateValueAndValidity();

      // Call update methods to refresh the UI state
      this.updateCuotaFormValidState();
      
      // Log debug info
      console.log('Editing cuota:', {
        editingCuotaId: this.editingCuotaId,
        formEnabled: this.cuotaFormEnabled,
        formValid: this.cuotaFormValid,
        isPlazoEnabled,
        remainingTotal: this.remainingTotal
      });
      
      // Scroll to the form after a brief delay to ensure DOM update
      setTimeout(() => {
        const formElement = document.querySelector('.pago-detalle-cuota-form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }, 50);

    if (cuota.estado === PagoDetalleCuotaEstado.PENDIENTE) {
      this.snackBar.open('Editando cuota #' + cuota.numeroCuota, 'Cerrar', { duration: 3000 });
    } else {
      this.snackBar.open('Visualizando cuota #' + cuota.numeroCuota + ' (solo lectura)', 'Cerrar', { duration: 3000 });
    }
  }

  /**
   * Elimina una cuota o la marca como CANCELADO si no está en estado PENDIENTE
   * @param cuota Cuota a eliminar o cancelar
   */
  deleteCuota(cuota: PagoDetalleCuota): void {
    // For non-PENDIENTE cuotas, we only allow setting estado to CANCELADO
    if (cuota.estado !== PagoDetalleCuotaEstado.PENDIENTE) {
      this.snackBar.open(
        'No se puede eliminar una cuota que no está en estado PENDIENTE. Para anularla, puede marcarla como CANCELADO.',
        'Entendido',
        { duration: 5000 }
      );
      
      // Optional: Offer to cancel the cuota instead
      const confirmCancel = confirm('¿Desea marcar esta cuota como CANCELADO?');
      if (confirmCancel) {
        this.isLoading = true;
        
        // Create update input with estado set to CANCELADO
        const cancelInput = {
          id: cuota.id,
          pagoDetalleId: cuota.pagoDetalle?.id,
          numeroCuota: cuota.numeroCuota,
          fechaVencimiento: typeof cuota.fechaVencimiento === 'string' 
            ? cuota.fechaVencimiento 
            : dateToString(new Date(cuota.fechaVencimiento)),
          estado: PagoDetalleCuotaEstado.CANCELADO,
          totalFinal: cuota.totalFinal,
          totalPagado: cuota.totalPagado
        };
        
        this.pagoDetalleCuotaService.onSavePagoDetalleCuota(cancelInput)
          .pipe(untilDestroyed(this))
          .subscribe(
            result => {
              this.loadCuotas(); // Recargar las cuotas y actualizar sumatorias
              this.snackBar.open('Cuota marcada como CANCELADO con éxito', 'Cerrar', { duration: 3000 });
            },
            error => {
              console.error('Error al cancelar cuota', error);
              this.isLoading = false;
              this.snackBar.open('Error al cancelar la cuota', 'Cerrar', { duration: 3000 });
            }
          );
      }
      return;
    }
    
    // For PENDIENTE cuotas, proceed with normal deletion
    if (confirm('¿Está seguro de eliminar esta cuota?')) {
      this.isLoading = true;
      this.pagoDetalleCuotaService.onDeletePagoDetalleCuota(cuota.id)
        .pipe(untilDestroyed(this))
        .subscribe(
          result => {
            if (result) {
              this.loadCuotas(); // Recargar las cuotas y actualizar sumatorias
              this.snackBar.open('Cuota eliminada con éxito', 'Cerrar', { duration: 3000 });
            } else {
              this.isLoading = false;
              this.snackBar.open('No se pudo eliminar la cuota', 'Cerrar', { duration: 3000 });
            }
          },
          error => {
            console.error('Error al eliminar cuota', error);
            this.isLoading = false;
            this.snackBar.open('Error al eliminar la cuota', 'Cerrar', { duration: 3000 });
          }
        );
    }
  }

  // Add a new method to validate total against maxAmount
  validateTotalAgainstMaxAmount(total: number): void {
    // First validate against maxAmount (upper limit)
    if (this.data.maxAmount !== undefined && total > this.data.maxAmount) {
      this.form.get('total').setErrors({ exceedsMaxAmount: true });
    } else if (this.form.get('total').hasError('exceedsMaxAmount')) {
      // Remove the error if the value is now valid
      const errors = { ...this.form.get('total').errors };
      delete errors['exceedsMaxAmount'];
      this.form.get('total').setErrors(Object.keys(errors).length ? errors : null);
    }
    
    // Then validate against cuotas sum (lower limit)
    this.validateTotalAgainstCuotasSum(total);
    
    // Update the cuota form enabled state after validation
    this.updateCuotaFormEnabledState();
  }

  // Add this after populateForm method
  storeInitialValues(): void {
    this.initialFormValues = this.form.getRawValue();
  }
  
  resetToInitialValues(): void {
    // Only reset if we have initial values stored
    if (Object.keys(this.initialFormValues).length === 0) {
      return;
    }
    
    // Reset form to initial values
    this.form.patchValue(this.initialFormValues);
    
    // When resetting in edit mode, we need to re-validate the form
    this.validateTotalAgainstMaxAmount(this.initialFormValues.total);
    this.updateCuotaTotal();
    this.updateRemainingTotal();
    
    // Exit edit mode after resetting
    this.isPagoDetalleFormEditable = false;
    this.updatePagoDetalleFormState();
    
    this.snackBar.open('Formulario restablecido a valores iniciales y modo edición desactivado', 'Cerrar', { duration: 3000 });
  }
  
  togglePagoDetalleFormEditMode(): void {
    // This now only handles entering edit mode
    this.isPagoDetalleFormEditable = true;
    this.updatePagoDetalleFormState();
    
    // Store initial values when entering edit mode
    this.storeInitialValues();
    this.snackBar.open('Modo edición activado', 'Cerrar', { duration: 2000 });
  }
  
  /**
   * Saves the pago detalle and exits edit mode
   */
  saveAndExitEditMode(): void {
    if (this.form.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos correctamente', 'Cerrar', { duration: 3000 });
      return;
    }
    
    // Save changes first
    this.saveDetailsOnly();
    
    // Then exit edit mode
    this.isPagoDetalleFormEditable = false;
    this.updatePagoDetalleFormState();
    this.snackBar.open('Cambios guardados y modo edición desactivado', 'Cerrar', { duration: 3000 });
  }
  
  updatePagoDetalleFormState(): void {
    // Enable or disable pago detalle form controls based on edit mode
    const formControls = ['monedaId', 'formaPagoId', 'total', 'sucursalId', 'cajaId', 'plazo', 'cuotas'];
    
    formControls.forEach(controlName => {
      const control = this.form.get(controlName);
      if (this.isPagoDetalleFormEditable) {
        control.enable();
        
        // Special case for cuotas - disable if plazo is false
        if (controlName === 'cuotas' && !this.form.get('plazo').value) {
          control.disable();
        }
      } else {
        control.disable();
      }
    });
  }

  /**
   * Prepare the edit mode when editing an existing record
   */
  prepareEditMode(): void {
    // For existing records, form is not editable by default
    this.isPagoDetalleFormEditable = false;
    
    // Populate form with existing data
    this.populateForm();
    
    // Load cajas if there is a sucursal selected
    if (this.data.pagoDetalle.sucursal?.id) {
      this.loadCajas(this.data.pagoDetalle.sucursal.id);
    }
    
    // Load cuotas for existing detalle
    this.loadCuotas();
    
    // Update the form state based on editability
    this.updatePagoDetalleFormState();
  }

  /**
   * Add a validator to check if total exceeds maxAmount
   */
  addMaxAmountValidator(): void {
    // We don't need to add custom validators here since validateTotalAgainstMaxAmount
    // will handle the validation and set errors directly on the form control
    
    // Just do an initial validation of the current value if any
    const currentTotal = this.form.get('total').value;
    if (currentTotal !== null && currentTotal !== undefined) {
      this.validateTotalAgainstMaxAmount(currentTotal);
    }
  }

  /**
   * Load all required data for the form
   */
  loadData(): void {
    // Show loading state while data is being fetched
    this.isLoading = true;
    
    // Load all necessary data for selects
    const monedaPromise = this.loadMonedas();
    const formasPagoPromise = this.loadFormasPago();
    const sucursalesPromise = this.loadSucursales();
    
    // Wait for all data to be loaded
    forkJoin([monedaPromise, formasPagoPromise, sucursalesPromise])
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          // If creating new, use preselected values if available
          if (!this.isEdit) {
            this.populateFormWithPreselectedValues();
          }
          
          this.isLoading = false;
        },
        error => {
          console.error('Error loading initial data', error);
          this.isLoading = false;
          this.snackBar.open('Error al cargar datos iniciales', 'Cerrar', { duration: 3000 });
        }
      );
      
    // Listen for currency changes to update formatting
    this.form.get('monedaId').valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(monedaId => {
        this.updateSelectedCurrencySymbol(monedaId);
      });
  }

  /**
   * Calculate the remaining total based on the form's total and sum of cuotas
   */
  calculateRemainingTotal(): void {
    // Just an alias to updateRemainingTotal to maintain backward compatibility
    this.updateRemainingTotal();
  }
} 