import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FacturaLegalItem } from '../factura-legal.model';
import { Moneda } from '../../moneda/moneda.model';
import { CurrencyMask } from '../../../../commons/core/utils/numbersUtils';

export interface AdicionarFacturaLegalItemData {
  facturaItem: FacturaLegalItem;
  moneda?: Moneda;
  tipoCambio?: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-edit-factura-legal-item',
  templateUrl: './edit-factura-legal-item.component.html',
  styleUrls: ['./edit-factura-legal-item.component.scss']
})
export class EditFacturaLegalItemComponent implements OnInit {

  selectedFacturaLegalItem = new FacturaLegalItem;
  descripcionControl = new FormControl(null, Validators.required)
  cantidadControl = new FormControl(1, Validators.required)
  precioUnitario = new FormControl(null, Validators.required)
  precioUnitarioExtranjero = new FormControl(null)
  ivaControl = new FormControl(10, Validators.required)
  unidadMedidaControl = new FormControl("Unidad", Validators.required)
  formGroup: FormGroup;
  isEditting = false;
  
  // Opciones para selects
  ivaOptions = [0, 5, 10];
  unidadMedidaOptions = ["Unidad", "Kilo", "Litro"];
  
  // Moneda extranjera
  monedaExtranjera: Moneda;
  tipoCambio: number;
  mostrarMonedaExtranjera: boolean = false;
  
  // Totales calculados
  totalEnGuarani: number = 0;
  totalEnMonedaExtranjera: number = 0;
  
  // Bandera para evitar loops infinitos
  private actualizandoPrecioGuarani: boolean = false;
  private actualizandoPrecioExtranjero: boolean = false;
  
  // Currency mask para formateo de inputs
  currencyMask = new CurrencyMask();

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AdicionarFacturaLegalItemData,
    private dialogRef: MatDialogRef<EditFacturaLegalItemComponent>,
  ) { }

  ngOnInit(): void {
    // Obtener moneda y tipo de cambio si están disponibles
    this.monedaExtranjera = this.data?.moneda;
    this.tipoCambio = this.data?.tipoCambio;
    this.mostrarMonedaExtranjera = this.monedaExtranjera != null && 
                                    this.monedaExtranjera.denominacion !== 'GUARANI' && 
                                    this.tipoCambio != null && 
                                    this.tipoCambio > 0;

    this.formGroup = new FormGroup({
      descripcion: this.descripcionControl,
      cantidad: this.cantidadControl,
      precioUnitario: this.precioUnitario,
      precioUnitarioExtranjero: this.precioUnitarioExtranjero,
      iva: this.ivaControl,
      unidadMedida: this.unidadMedidaControl,
    })

    if (this.data.facturaItem != null) {
      Object.assign(this.selectedFacturaLegalItem, this.data.facturaItem)
      this.cargarDatos()
    } else {
      this.isEditting = true;
    }
    
    // Suscribirse a cambios en precio unitario GUARANI para actualizar el extranjero
    this.precioUnitario.valueChanges.pipe(untilDestroyed(this)).subscribe((precio) => {
      // Si estamos actualizando desde el precio extranjero, no hacer nada
      if (this.actualizandoPrecioGuarani) {
        return;
      }
      
      // currencyMask devuelve números, pero verificamos que sea válido
      const precioNum = precio != null && precio !== '' ? Number(precio) : null;
      
      if (precioNum != null && !isNaN(precioNum) && precioNum >= 0 && this.mostrarMonedaExtranjera && this.tipoCambio && this.tipoCambio > 0) {
        this.actualizandoPrecioExtranjero = true;
        const precioExtranjero = precioNum / this.tipoCambio;
        this.precioUnitarioExtranjero.setValue(precioExtranjero, { emitEvent: false });
        this.actualizandoPrecioExtranjero = false;
      }
      this.calcularTotales();
    });
    
    // Suscribirse a cambios en precio unitario EXTRANJERO para actualizar el GUARANI
    this.precioUnitarioExtranjero.valueChanges.pipe(untilDestroyed(this)).subscribe((precioExt) => {
      // Si estamos actualizando desde el precio guarani, no hacer nada
      if (this.actualizandoPrecioExtranjero) {
        return;
      }
      
      // currencyMask devuelve números, pero verificamos que sea válido
      const precioExtNum = precioExt != null && precioExt !== '' ? Number(precioExt) : null;
      
      if (precioExtNum != null && !isNaN(precioExtNum) && precioExtNum >= 0 && this.mostrarMonedaExtranjera && this.tipoCambio && this.tipoCambio > 0) {
        this.actualizandoPrecioGuarani = true;
        const precioGuarani = precioExtNum * this.tipoCambio;
        this.precioUnitario.setValue(precioGuarani, { emitEvent: false });
        this.actualizandoPrecioGuarani = false;
      }
      this.calcularTotales();
    });
    
    this.cantidadControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.calcularTotales();
    });
  }
  
  calcularTotales() {
    // currencyMask devuelve números, pero nos aseguramos de convertirlos correctamente
    const cantidad = this.cantidadControl.value != null ? Number(this.cantidadControl.value) : 0;
    const precio = this.precioUnitario.value != null ? Number(this.precioUnitario.value) : 0;
    this.totalEnGuarani = cantidad * precio;
    
    if (this.mostrarMonedaExtranjera && this.tipoCambio && this.tipoCambio > 0) {
      this.totalEnMonedaExtranjera = this.totalEnGuarani / this.tipoCambio;
    } else {
      this.totalEnMonedaExtranjera = 0;
    }
  }

  cargarDatos() {
    this.descripcionControl.setValue(this.selectedFacturaLegalItem.descripcion)
    this.cantidadControl.setValue(this.selectedFacturaLegalItem.cantidad)
    
    // Cargar precio en GUARANI primero
    this.actualizandoPrecioExtranjero = true;
    this.precioUnitario.setValue(this.selectedFacturaLegalItem.precioUnitario, { emitEvent: false })
    
    // Si hay moneda extranjera, calcular el precio en moneda extranjera
    if (this.mostrarMonedaExtranjera && this.tipoCambio && this.tipoCambio > 0 && this.selectedFacturaLegalItem.precioUnitario) {
      const precioExtranjero = this.selectedFacturaLegalItem.precioUnitario / this.tipoCambio;
      this.precioUnitarioExtranjero.setValue(precioExtranjero, { emitEvent: false });
    }
    this.actualizandoPrecioExtranjero = false;
    
    this.ivaControl.setValue(this.selectedFacturaLegalItem.iva != null ? this.selectedFacturaLegalItem.iva : 10)
    this.unidadMedidaControl.setValue(this.selectedFacturaLegalItem.unidadMedida || "Unidad")
    this.calcularTotales();
    this.formGroup.disable()
  }

  onEdit() {
    this.isEditting = true;
    this.formGroup.enable()
  }

  onCancel() {
    this.dialogRef.close(null)
  }

  onSave() {
    this.selectedFacturaLegalItem.descripcion = this.descripcionControl.value
    this.selectedFacturaLegalItem.cantidad = this.cantidadControl.value
    // Siempre guardar el precio en GUARANI (moneda principal)
    this.selectedFacturaLegalItem.precioUnitario = this.precioUnitario.value;
    this.selectedFacturaLegalItem.iva = this.ivaControl.value;
    this.selectedFacturaLegalItem.unidadMedida = this.unidadMedidaControl.value;
    this.selectedFacturaLegalItem.total = this.totalEnGuarani;
    this.dialogRef.close(this.selectedFacturaLegalItem)
  }

}
