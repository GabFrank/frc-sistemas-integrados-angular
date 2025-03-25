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
import { forkJoin, Observable, of, tap, catchError, merge, EMPTY } from 'rxjs';
import { dateToString } from '../../../../../commons/core/utils/dateUtils';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { PagoDetalleEstado } from '../../pago-detalle/pago-detalle.model';

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
    private snackBar: MatSnackBar,
    private dialogosService: DialogosService
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
      
      // Prefill with preselected total if available (for new records)
      if (this.data.preselectedTotal !== undefined && this.data.preselectedTotal > 0) {
        // First set the form total
        this.form.get('total').setValue(this.data.preselectedTotal);
        
        // Then initialize the totalFinalControl with the same value
        this.totalFinalControl.setValue(this.data.preselectedTotal);
        this.remainingTotal = this.data.preselectedTotal;
      }
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
      
      // Update totalFinal in cuota form when total changes
      if (!this.editingCuotaId && this.remainingTotal > 0) {
        this.totalFinalControl.setValue(this.remainingTotal);
      }
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
      
      // If we have existing cuotas, use the remaining total instead
      if (this.pagoDetalleCuotas.length > 0) {
        // For new cuotas, use the full remaining amount if it's the only cuota left to add
        const remainingCuotas = cuotas - this.pagoDetalleCuotas.length;
        if (remainingCuotas <= 1) {
          this.totalFinalControl.setValue(this.remainingTotal);
        } else {
          // If multiple cuotas still need to be added, divide the remaining total
          this.totalFinalControl.setValue(this.remainingTotal / remainingCuotas);
        }
      } else {
        // For completely new pago detalle with no cuotas yet, use calculated value
        this.totalFinalControl.setValue(totalPerCuota);
      }
    } else if (total) {
      // If no cuotas specified but there is a total, set full amount
      this.totalFinalControl.setValue(this.remainingTotal > 0 ? this.remainingTotal : total);
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
      
      // When there are no cuotas, set totalFinalControl to the full form total
      const formTotal = this.form.get('total')?.value || 0;
      if (formTotal > 0 && !this.editingCuotaId) {
        this.totalFinalControl.setValue(formTotal);
      }
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
      cuotas: [{value: 1, disabled: true}, [Validators.required, Validators.min(1)]],
      estado: [{value: PagoDetalleEstado.ABIERTO, disabled: true}]
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
        console.log('Plazo changed to:', plazo, typeof plazo);
        if (!plazo) {
          this.form.get('cuotas').setValue(1);
          this.form.get('cuotas').disable();
        } else {
          // When plazo is enabled, set the cuotas to the current number of active cuotas
          // or to 1 if there are no active cuotas
          const activeCuotasCount = this.pagoDetalleCuotas?.filter(c => 
            c.estado !== PagoDetalleCuotaEstado.CANCELADO
          ).length || 1;
          
          this.form.get('cuotas').setValue(activeCuotasCount);
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
    
    // Initialize the cuota form's totalFinalControl with the preselected total
    if (formValues.total > 0) {
      this.remainingTotal = formValues.total;
      this.totalFinalControl.setValue(formValues.total);
    }
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
      plazo: detalle.plazo === true, // Ensure boolean conversion
      cuotas: detalle.cuotas || 1,
      estado: detalle.estado || PagoDetalleEstado.ABIERTO
    };
    
    console.log('Populating form with plazo value:', detalle.plazo, typeof detalle.plazo);
    console.log('Populating form with estado:', formValues.estado);
    
    // Temporarily enable all controls to set their values
    this.form.get('estado').enable();
    
    // Update form with values
    this.form.patchValue(formValues);
    
    // Disable estado control after setting the value
    this.form.get('estado').disable();
    
    // Store initial values after populating form for future reset
    this.storeInitialValues();
    
    // Initialize the remainingTotal with the total from the form
    this.remainingTotal = detalle.total || 0;
    
    // If it's a plazo payment, enable the cuotas field
    if (formValues.plazo) {
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
    if (!this.data.pagoDetalle?.id) {
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    console.log('Loading cuotas for pagoDetalleId:', this.data.pagoDetalle.id);
    
    this.pagoDetalleCuotaService.onGetPagoDetalleCuotasPorPagoDetalleId(this.data.pagoDetalle.id)
      .pipe(
        untilDestroyed(this),
        catchError(error => {
          console.error('Error al cargar cuotas', error);
          this.isLoading = false;
          this.snackBar.open('Error al cargar las cuotas', 'Cerrar', { duration: 3000 });
          return of([]); // Return empty array on error
        })
      )
      .subscribe(
        cuotas => {
          // Sort cuotas by numeroCuota to ensure they display in correct order
          this.pagoDetalleCuotas = cuotas.sort((a, b) => a.numeroCuota - b.numeroCuota);
          
          console.log('Loaded cuotas:', this.pagoDetalleCuotas.length);
          
          // Calculate total sum of cuotas and update remaining total
          this.updateTotalCuotasSum();
          
          // Update cuotas count in the form
          const activeCuotasCount = cuotas.filter(c => 
            c.estado !== PagoDetalleCuotaEstado.CANCELADO
          ).length;
          
          if (this.form.get('plazo').value && activeCuotasCount > 0) {
            this.form.get('cuotas').setValue(activeCuotasCount);
          }
          
          // If there are cuotas, prepare the cuota form with next number
          if (cuotas.length > 0) {
            // Get the next cuota number (after clearing the form to ensure it calculates correctly)
            this.clearCuotaForm();
          }
          
          // Update the PagoDetalle estado based on loaded cuotas
          this.updatePagoDetalleEstado();
          
          // Always ensure loading state is finished
          this.isLoading = false;
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
    // Either the next number after the highest existing number, or 1 if no cuotas exist
    let nextCuotaNumber = 1;
    
    // If there are no cuotas, always set to 1
    if (!this.pagoDetalleCuotas || this.pagoDetalleCuotas.length === 0) {
      console.log('No cuotas exist, setting cuota number to 1');
      nextCuotaNumber = 1;
    } else {
      // Log all cuota numbers for debugging
      console.log('Current cuota numbers:', this.pagoDetalleCuotas.map(c => c.numeroCuota).sort((a, b) => a - b));
      
      // Get the highest cuota number currently in use
      const highestCuotaNumber = Math.max(...this.pagoDetalleCuotas.map(c => c.numeroCuota));
      nextCuotaNumber = highestCuotaNumber + 1;
      
      // If we have gaps in the sequence, use the first available number instead
      const existingNumbers = this.pagoDetalleCuotas.map(c => c.numeroCuota).sort((a, b) => a - b);
      
      // Find first gap in sequence
      let foundGap = false;
      for (let i = 1; i <= existingNumbers.length + 1; i++) {
        if (!existingNumbers.includes(i)) {
          nextCuotaNumber = i;
          foundGap = true;
          console.log('Found gap in cuota numbers at position:', i);
          break;
        }
      }
      
      // If no gaps found, use the next number after highest
      if (!foundGap) {
        nextCuotaNumber = highestCuotaNumber + 1;
        console.log('No gaps found, using next sequential number:', nextCuotaNumber);
      }
    }
    
    console.log('Setting next cuota number to:', nextCuotaNumber);
    
    // Set numero cuota (auto-generated)
    this.numeroCuotaControl.setValue(nextCuotaNumber);
    
    // Set fecha vencimiento based on plazo option
    if (this.form.get('plazo').value) {
      // If paying in installments, enable fecha vencimiento to allow future dates
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      this.fechaVencimientoControl.setValue(futureDate);
      this.fechaVencimientoControl.enable();
    } else {
      // If not paying in installments, set to current date and disable
      this.fechaVencimientoControl.setValue(new Date());
      this.fechaVencimientoControl.disable();
    }
    
    // Estado is always PENDIENTE for new cuotas and not editable
    this.estadoControl.setValue(PagoDetalleCuotaEstado.PENDIENTE);
    
    // Always set the remaining total as the default value for new cuota
    const formTotal = this.form.get('total')?.value || 0;
    
    // If there are no cuotas, use the full form total
    if (!this.pagoDetalleCuotas || this.pagoDetalleCuotas.length === 0) {
      this.totalFinalControl.setValue(formTotal);
      this.remainingTotal = formTotal;
    } else {
      this.totalFinalControl.setValue(this.remainingTotal);
    }
    
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
   * Updates the PagoDetalle estado based on sus cuotas
   */
  updatePagoDetalleEstado(): void {
    if (!this.data.pagoDetalle) {
      console.log('Cannot update PagoDetalle estado: no pagoDetalle in data');
      return;
    }
    
    // Debug log current values
    console.log('PagoDetalleDialog: Updating PagoDetalle estado with cuotas', {
      id: this.data.pagoDetalle.id,
      currentEstado: this.form.getRawValue().estado,
      cuotasCount: this.pagoDetalleCuotas.length,
      cuotasTotal: this.pagoDetalleCuotas.reduce((sum, c) => sum + (c.totalFinal || 0), 0),
      formTotal: this.form.get('total').value,
      cuotasEstados: this.pagoDetalleCuotas.map(c => ({ id: c.id, estado: c.estado, total: c.totalFinal }))
    });
    
    // Create a temporary PagoDetalle instance to use the method
    const pagoDetalle = new PagoDetalle();
    Object.assign(pagoDetalle, this.data.pagoDetalle);
    pagoDetalle.total = this.form.get('total').value;
    pagoDetalle.estado = this.form.getRawValue().estado;
    
    try {
      // Special case: if we have no cuotas and not CANCELADO, estado should be ABIERTO
      let newEstado;
      
      if (this.pagoDetalleCuotas.length === 0) {
        // For empty cuotas array, set to ABIERTO unless already CANCELADO
        newEstado = this.form.getRawValue().estado === PagoDetalleEstado.CANCELADO ? 
          PagoDetalleEstado.CANCELADO : PagoDetalleEstado.ABIERTO;
        
        console.log('No cuotas found, setting estado to:', newEstado);
      } else if (this.pagoDetalleCuotas.length === 1 && 
                 this.pagoDetalleCuotas[0].estado === PagoDetalleCuotaEstado.PENDIENTE) {
        // Special case: Single default cuota that was just created
        // Check if total matches (within small threshold for floating point comparison)
        const cuotaTotal = this.pagoDetalleCuotas[0].totalFinal || 0;
        const formTotal = this.form.get('total').value || 0;
        const totalMatch = Math.abs(formTotal - cuotaTotal) < 0.01;
        
        if (totalMatch) {
          newEstado = PagoDetalleEstado.PENDIENTE;
          console.log('Single default cuota matches total amount, setting estado to PENDIENTE');
        } else {
          // Calculate based on cuotas
          newEstado = pagoDetalle.updateEstadoBasedOnCuotas(this.pagoDetalleCuotas);
          console.log('Single default cuota does not match total, calculated estado:', newEstado);
        }
      } else {
        // Normal case: calculate based on cuotas
        newEstado = pagoDetalle.updateEstadoBasedOnCuotas(this.pagoDetalleCuotas);
      }
      
      console.log('Estado calculation result:', newEstado);
      
      // Always update the form with the calculated estado value
      const formEstado = this.form.getRawValue().estado;
      if (newEstado !== formEstado) {
        console.log(`Estado changed from ${formEstado} to ${newEstado}`);
        
        // We need to enable the control temporarily to set its value
        this.form.get('estado').enable();
        this.form.get('estado').setValue(newEstado);
        this.form.get('estado').disable();
        
        // Save to database
        this.saveDetailsOnly();
      } else {
        console.log('Estado remained the same:', newEstado);
      }
    } catch (error) {
      console.error('Error calculating estado:', error);
      this.snackBar.open('Error al actualizar el estado: ' + (error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
    }
  }

  /**
   * Cancels a cuota by setting its estado to CANCELADO
   * @param cuota Cuota to cancel
   */
  cancelCuota(cuota: PagoDetalleCuota): void {
    if (!cuota || !cuota.id) return;
    
    this.dialogosService.confirm(
      'CANCELAR CUOTA',
      `¿ESTÁ SEGURO QUE DESEA CANCELAR LA CUOTA #${cuota.numeroCuota}?`,
      'Esta acción no se puede deshacer.'
    ).subscribe(result => {
      if (result) {
        console.log('Canceling cuota:', cuota);
        
        // Create input for cancellation
        const cancelInput = {
          id: cuota.id,
          pagoDetalleId: cuota.pagoDetalle?.id,
          numeroCuota: cuota.numeroCuota,
          fechaVencimiento: dateToString(cuota.fechaVencimiento),
          totalFinal: cuota.totalFinal,
          totalPagado: cuota.totalPagado,
          estado: PagoDetalleCuotaEstado.CANCELADO,
          creadoEn: dateToString(cuota.creadoEn)
        };
        
        this.pagoDetalleCuotaService.onSavePagoDetalleCuota(cancelInput)
          .pipe(
            untilDestroyed(this),
            catchError(error => {
              console.error('Error al cancelar cuota', error);
              this.snackBar.open('Error al cancelar cuota: ' + (error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
              return EMPTY;
            })
          )
          .subscribe(updatedCuota => {
            // Update the cuota in the array
            const index = this.pagoDetalleCuotas.findIndex(c => c.id === cuota.id);
            if (index !== -1) {
              this.pagoDetalleCuotas[index] = updatedCuota;
            }
            
            this.snackBar.open('Cuota cancelada correctamente', 'Cerrar', { duration: 3000 });
            
            // Recalculate totals
            this.updateTotalCuotasSum();
            this.calculateRemainingTotal();
            
            // Log the current state before updating estado
            console.log('Current state after canceling cuota:', {
              pagoDetalleTotal: this.form.get('total').value,
              cuotasTotal: this.pagoDetalleCuotas.reduce((sum, c) => sum + (c.totalFinal || 0), 0),
              currentEstado: this.form.get('estado').value,
              cuotasCount: this.pagoDetalleCuotas.filter(c => c.estado !== PagoDetalleCuotaEstado.CANCELADO).length,
              activeCuotasEstados: this.pagoDetalleCuotas
                .filter(c => c.estado !== PagoDetalleCuotaEstado.CANCELADO)
                .map(c => c.estado)
            });
            
            // Update the PagoDetalle estado
            this.updatePagoDetalleEstado();
          });
      }
    });
  }

  /**
   * Deletes a cuota
   * @param cuota Cuota to delete
   */
  deleteCuota(cuota: PagoDetalleCuota): void {
    // Display a confirmation dialog
    this.dialogosService.confirm(
      'ELIMINAR CUOTA',
      `¿ESTÁ SEGURO QUE DESEA ELIMINAR LA CUOTA #${cuota.numeroCuota}?`,
      'Esta acción no se puede deshacer.'
    ).subscribe(result => {
      if (result) {
        const isLastCuota = this.pagoDetalleCuotas.length === 1;
        console.log('Deleting cuota:', cuota, 'Is last cuota:', isLastCuota);
        
        this.pagoDetalleCuotaService.onDeletePagoDetalleCuota(cuota.id)
          .pipe(
            untilDestroyed(this),
            catchError(error => {
              console.error('Error al eliminar cuota', error);
              this.snackBar.open('Error al eliminar cuota: ' + (error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
              return EMPTY;
            })
          )
          .subscribe(() => {
            console.log('Cuota deleted successfully from database, removing from array. Before:', this.pagoDetalleCuotas.length);
            
            // Remove the cuota from the array
            const index = this.pagoDetalleCuotas.findIndex(c => c.id === cuota.id);
            if (index !== -1) {
              // Create a new array instead of modifying the existing one to help with change detection
              this.pagoDetalleCuotas = this.pagoDetalleCuotas.filter(c => c.id !== cuota.id);
              console.log('Cuota removed from array. After:', this.pagoDetalleCuotas.length);
            } else {
              console.warn('Cuota not found in array, id:', cuota.id);
            }
            
            this.snackBar.open('Cuota eliminada correctamente', 'Cerrar', { duration: 3000 });
            
            // If it was the last cuota, special handling
            if (isLastCuota) {
              console.log('Last cuota deleted - special handling');
              // Update the cuota form to prepare for a new cuota 1
              this.numeroCuotaControl.setValue(1);
              
              // Get the form total to set as the totalFinal for the next cuota
              const formTotal = this.form.get('total')?.value || 0;
              this.totalFinalControl.setValue(formTotal);
              this.remainingTotal = formTotal;
              
              // Explicitly update cuotas count to 0
              this.form.get('cuotas').setValue(0);
              
              // Update estado after last cuota deletion
              this.updatePagoDetalleEstado();
              
              // Update PagoDetalle in database to reflect zero cuotas
              this.updatePagoDetalleCuotasCount();
            } else {
              // Normal handling for non-last cuota
              
              // Reorder cuota numbers
              this.reorderCuotaNumbers();
              
              // Recalculate totals
              this.updateTotalCuotasSum();
              this.calculateRemainingTotal();
              
              // Log the current state before updating estado
              console.log('Current state after deleting cuota:', {
                pagoDetalleTotal: this.form.get('total').value,
                cuotasTotal: this.pagoDetalleCuotas.reduce((sum, c) => sum + (c.totalFinal || 0), 0),
                currentEstado: this.form.get('estado').value,
                cuotasCount: this.pagoDetalleCuotas.filter(c => c.estado !== PagoDetalleCuotaEstado.CANCELADO).length,
                allPendiente: this.pagoDetalleCuotas.every(c => c.estado === PagoDetalleCuotaEstado.PENDIENTE)
              });
              
              // Update PagoDetalle estado after deleting cuota
              this.updatePagoDetalleEstado();
            }
          });
      }
    });
  }

  /**
   * Cancels the entire PagoDetalle and all its cuotas
   */
  cancelPagoDetalle(): void {
    if (!this.data.pagoDetalle || !this.data.pagoDetalle.id) return;
    
    this.dialogosService.confirm(
      'CANCELAR DETALLE DE PAGO',
      '¿ESTÁ SEGURO QUE DESEA CANCELAR ESTE DETALLE DE PAGO?',
      'Esta operación cancelará todas las cuotas pendientes asociadas y no se puede deshacer.'
    ).subscribe(result => {
      if (result) {
        // First, set the estado of the PagoDetalle to CANCELADO
        const pagoDetalle = new PagoDetalle();
        Object.assign(pagoDetalle, this.data.pagoDetalle);
        pagoDetalle.cancel();
        
        // Update the form
        this.form.get('estado').setValue(PagoDetalleEstado.CANCELADO);
        
        // Save the PagoDetalle
        this.saveDetailsOnly();
        
        // Now cancel all non-canceled cuotas
        const activeCuotas = this.pagoDetalleCuotas.filter(c => 
          c.estado !== PagoDetalleCuotaEstado.CANCELADO
        );
        
        if (activeCuotas.length === 0) {
          this.snackBar.open('Detalle de pago cancelado correctamente', 'Cerrar', { duration: 3000 });
          return;
        }
        
        // Create an array of observables for each cuota to cancel
        const cancelObservables = activeCuotas.map(cuota => {
          const cancelInput = {
            id: cuota.id,
            pagoDetalleId: cuota.pagoDetalle?.id,
            numeroCuota: cuota.numeroCuota,
            fechaVencimiento: dateToString(cuota.fechaVencimiento),
            totalFinal: cuota.totalFinal,
            totalPagado: cuota.totalPagado,
            estado: PagoDetalleCuotaEstado.CANCELADO,
            creadoEn: dateToString(cuota.creadoEn)
          };
          
          return this.pagoDetalleCuotaService.onSavePagoDetalleCuota(cancelInput);
        });
        
        // Execute all cancellations in parallel
        forkJoin(cancelObservables)
          .pipe(untilDestroyed(this))
          .subscribe(
            results => {
              // Update the cuotas array with the results
              results.forEach(updatedCuota => {
                const index = this.pagoDetalleCuotas.findIndex(c => c.id === updatedCuota.id);
                if (index !== -1) {
                  this.pagoDetalleCuotas[index] = updatedCuota;
                }
              });
              
              this.snackBar.open('Detalle de pago y cuotas canceladas correctamente', 'Cerrar', { duration: 3000 });
            },
            error => {
              console.error('Error al cancelar cuotas', error);
              this.snackBar.open('Error al cancelar algunas cuotas. Por favor, revise el detalle.', 'Cerrar', { duration: 5000 });
            }
          );
      }
    });
  }

  /**
   * Reordena los números de cuotas para mantener una secuencia consecutiva
   * Esto es útil después de eliminar una cuota
   */
  reorderCuotaNumbers(): void {
    if (!this.data.pagoDetalle?.id) return;
    
    // If no cuotas left, simply prepare the form with number 1 and exit
    if (this.pagoDetalleCuotas.length === 0) {
      this.numeroCuotaControl.setValue(1);
      const formTotal = this.form.get('total')?.value || 0;
      this.totalFinalControl.setValue(formTotal);
      this.remainingTotal = formTotal;
      return;
    }
    
    this.isLoading = true;
    
    // Sort cuotas by their current number to ensure proper ordering
    const sortedCuotas = [...this.pagoDetalleCuotas].sort((a, b) => a.numeroCuota - b.numeroCuota);
    
    // Create updates for all cuotas that need renumbering
    const updates = sortedCuotas.map((cuota, index) => {
      const correctNumber = index + 1;
      
      // Only update cuotas where the number needs to change
      if (cuota.numeroCuota !== correctNumber) {
        return {
          id: cuota.id,
          pagoDetalleId: cuota.pagoDetalle?.id,
          numeroCuota: correctNumber,
          fechaVencimiento: dateToString(cuota.fechaVencimiento),
          estado: cuota.estado,
          totalFinal: cuota.totalFinal,
          totalPagado: cuota.totalPagado,
          creadoEn: dateToString(cuota.creadoEn)
        };
      }
      return null;
    }).filter(update => update !== null);
    
    // If no updates needed, just finish
    if (updates.length === 0) {
      this.isLoading = false;
      return;
    }
    
    // Process updates sequentially to avoid race conditions
    const processUpdate = (index) => {
      if (index >= updates.length) {
        // All updates done
        this.isLoading = false;
        return;
      }
      
      this.pagoDetalleCuotaService.onSavePagoDetalleCuota(updates[index])
        .pipe(untilDestroyed(this))
        .subscribe(
          result => {
            // Update the cuota in the array
            const cuotaIndex = this.pagoDetalleCuotas.findIndex(c => c.id === result.id);
            if (cuotaIndex !== -1) {
              this.pagoDetalleCuotas[cuotaIndex] = result;
            }
            
            // Process next update
            processUpdate(index + 1);
          },
          error => {
            console.error('Error al reordenar cuotas', error);
            this.isLoading = false;
            this.snackBar.open('Error al reordenar las cuotas', 'Cerrar', { duration: 3000 });
          }
        );
    };
    
    // Start processing updates
    if (updates.length > 0) {
      processUpdate(0);
    } else {
      this.isLoading = false;
    }
  }

  /**
   * Updates the number of cuotas in the PagoDetalle model based on the current cuotas
   */
  updatePagoDetalleCuotasCount(): void {
    if (!this.data.pagoDetalle?.id) return;
    
    // Count active cuotas (not CANCELADO)
    const activeCuotasCount = this.pagoDetalleCuotas.filter(
      c => c.estado !== PagoDetalleCuotaEstado.CANCELADO
    ).length;
    
    console.log('Updating cuotas count in pagoDetalle:', {
      currentFormCount: this.form.get('cuotas').value,
      actualArrayCount: this.pagoDetalleCuotas.length,
      activeCuotasCount,
      needsUpdate: activeCuotasCount !== this.form.get('cuotas').value
    });
    
    // Always update if there are no cuotas left, otherwise only if count has changed
    const shouldUpdate = activeCuotasCount === 0 || activeCuotasCount !== this.form.get('cuotas').value;
    
    if (shouldUpdate) {
      // Update the form control
      this.form.get('cuotas').setValue(activeCuotasCount);
      
      // Get the current plazo value - ensure it's a boolean
      const plazoValue = this.form.get('plazo').value === true;
      
      // Get current estado - should be ABIERTO when no cuotas
      let currentEstado = this.form.get('estado').value;
      
      // If no active cuotas, estado should be ABIERTO unless it's CANCELADO
      if (activeCuotasCount === 0 && currentEstado !== PagoDetalleEstado.CANCELADO) {
        currentEstado = PagoDetalleEstado.ABIERTO;
        
        // Update the form estado
        this.form.get('estado').enable();
        this.form.get('estado').setValue(currentEstado);
        this.form.get('estado').disable();
      }
      
      console.log('Updating PagoDetalle in database with new count:', {
        id: this.data.pagoDetalle.id,
        cuotas: activeCuotasCount,
        plazo: plazoValue,
        estado: currentEstado
      });
      
      // Update the PagoDetalle in the database
      const pagoDetalleInput = {
        id: this.data.pagoDetalle.id,
        pagoId: this.data.pagoId,
        cuotas: activeCuotasCount,
        // Include other required fields from the form
        monedaId: this.form.get('monedaId').value,
        formaPagoId: this.form.get('formaPagoId').value,
        total: this.form.get('total').value,
        sucursalId: this.form.get('sucursalId').value,
        cajaId: this.form.get('cajaId').value,
        fechaProgramado: this.form.get('fechaProgramado').value 
          ? dateToString(this.form.get('fechaProgramado').value) 
          : null,
        activo: this.form.get('activo').value,
        plazo: plazoValue,
        estado: currentEstado
      };
      
      this.pagoDetalleService.update(pagoDetalleInput)
        .pipe(
          untilDestroyed(this),
          catchError(error => {
            console.error('Error al actualizar número de cuotas:', error);
            this.snackBar.open('Error al actualizar número de cuotas: ' + (error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
            return EMPTY;
          })
        )
        .subscribe(
          updatedDetalle => {
            // Update data model
            this.data.pagoDetalle = updatedDetalle;
            console.log('PagoDetalle updated with new cuotas count:', activeCuotasCount, 'estado:', updatedDetalle.estado);
            
            // Update UI components based on new estado
            if (activeCuotasCount === 0) {
              // Reset remaining total and totalFinalControl to full form total
              const formTotal = this.form.get('total')?.value || 0;
              this.remainingTotal = formTotal;
              this.totalFinalControl.setValue(formTotal);
              
              // Update the cuota form enabled state
              this.updateCuotaFormEnabledState();
            }
          }
        );
    }
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
    
    console.log('Saving PagoDetalle with values:', formValues);
    
    // Ensure plazo is a boolean
    const plazoValue = formValues.plazo === true;
    
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
      plazo: plazoValue,
      cuotas: plazoValue ? (formValues.cuotas || 1) : 1, // Default to 1 if not plazo
      estado: formValues.estado
    };
    
    console.log('Sending PagoDetalle to server with estado:', pagoDetalleInput.estado);
    
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
          const isPlazoNow = plazoValue;
          
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
          if (!plazoValue && !this.pagoDetalleCuotas.length) {
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
                  // Add the cuota to the array immediately before loading
                  this.pagoDetalleCuotas.push(cuotaResult);
                  console.log('Added automatic cuota:', cuotaResult);
                  
                  // Reload cuotas
                  this.loadCuotas();
                  
                  // Update the estado based on the cuota
                  this.updatePagoDetalleEstado();
                  
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
            
            // For new records, initialize the cuota form with total
            setTimeout(() => {
              this.calculateRemainingTotal();
              
              // Ensure totalFinalControl has the correct value, even if no cuotas yet
              const totalValue = this.form.get('total').value;
              if (totalValue > 0 && (!this.totalFinalControl.value || this.totalFinalControl.value === 0)) {
                this.totalFinalControl.setValue(totalValue);
              }
              
              // Initialize the cuota form with the remaining amount
              if (!this.editingCuotaId && this.form.get('total').value > 0) {
                this.clearCuotaForm();
              }
            }, 100);
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

  /**
   * Validate total against maxAmount
   * @param total The total value to validate
   */
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

  /**
   * Adds a new cuota from the form
   */
  addCuotaFromForm(): void {
    if (!this.data.pagoDetalle?.id) {
      this.snackBar.open('Primero debe guardar el detalle de pago', 'Cerrar', { duration: 3000 });
      return;
    }
    
    // Is this an edit or a new cuota?
    const isEditing = this.editingCuotaId !== null;
    
    // Validate form
    if (!this.cuotaFormValid) {
      return;
    }
    
    // Confirm total doesn't exceed available amount
    const totalFinal = this.totalFinalControl.value;
    const availableAmount = isEditing 
      ? this.remainingTotal + (this.pagoDetalleCuotas.find(c => c.id === this.editingCuotaId)?.totalFinal || 0)
      : this.remainingTotal;
    
    if (totalFinal > availableAmount) {
      this.snackBar.open(`El total excede el monto disponible (${availableAmount})`, 'Cerrar', { duration: 3000 });
      return;
    }
    
    // Create cuota input object
    const cuotaInput: any = {
      numeroCuota: this.numeroCuotaControl.value,
      fechaVencimiento: dateToString(this.fechaVencimientoControl.value),
      estado: PagoDetalleCuotaEstado.PENDIENTE,
      totalFinal: this.totalFinalControl.value,
      pagoDetalleId: this.data.pagoDetalle.id,
      totalPagado: isEditing ? (this.pagoDetalleCuotas.find(c => c.id === this.editingCuotaId)?.totalPagado || 0) : 0
    };
    
    // If editing, include the ID
    if (isEditing) {
      cuotaInput.id = this.editingCuotaId;
    }
    
    // Log the cuota being added
    console.log(`${isEditing ? 'Editing' : 'Adding new'} cuota:`, cuotaInput);
    
    // Save the cuota
    this.pagoDetalleCuotaService.onSavePagoDetalleCuota(cuotaInput)
      .pipe(
        untilDestroyed(this),
        catchError(error => {
          console.error('Error al guardar cuota', error);
          this.snackBar.open('Error al guardar cuota: ' + (error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
          return EMPTY;
        })
      )
      .subscribe(result => {
        // Log the result
        console.log(`Cuota ${isEditing ? 'updated' : 'added'} successfully:`, result);
        
        if (isEditing) {
          // Replace the edited cuota
          const index = this.pagoDetalleCuotas.findIndex(c => c.id === this.editingCuotaId);
          if (index !== -1) {
            this.pagoDetalleCuotas[index] = result;
          }
          this.snackBar.open('Cuota actualizada correctamente', 'Cerrar', { duration: 3000 });
        } else {
          // Add the new cuota to the array
          this.pagoDetalleCuotas.push(result);
          this.snackBar.open('Cuota agregada correctamente', 'Cerrar', { duration: 3000 });
        }
        
        // Reset the form
        this.editingCuotaId = null;
        this.clearCuotaForm();
        
        // Recalculate totals
        this.updateTotalCuotasSum();
        this.calculateRemainingTotal();
        
        // Log the current state before updating estado
        console.log('Current state before updating estado:', {
          pagoDetalleTotal: this.form.get('total').value,
          cuotasTotal: this.pagoDetalleCuotas.reduce((sum, c) => sum + (c.totalFinal || 0), 0),
          currentEstado: this.form.get('estado').value,
          cuotasCount: this.pagoDetalleCuotas.filter(c => c.estado !== PagoDetalleCuotaEstado.CANCELADO).length,
          allPendiente: this.pagoDetalleCuotas.every(c => c.estado === PagoDetalleCuotaEstado.PENDIENTE)
        });
        
        // Immediately update the PagoDetalle estado based on the updated cuotas
        this.updatePagoDetalleEstado();
      });
  }
} 