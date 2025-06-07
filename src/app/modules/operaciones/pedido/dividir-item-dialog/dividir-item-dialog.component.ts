import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CurrencyMask } from "../../../../commons/core/utils/numbersUtils";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { Producto } from "../../../productos/producto/producto.model";
import { PedidoItem } from "../edit-pedido/pedido-item.model";
import { Pedido } from "../edit-pedido/pedido.model";
import { ProductoService } from "../../../productos/producto/producto.service";
import { PedidoService } from "../pedido.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { forkJoin, map } from "rxjs";
import { BotonComponent } from "../../../../shared/components/boton/boton.component";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatSelect } from "@angular/material/select";

export interface DividirItemDialogData {
  pedidoItem: PedidoItem;
  pedido: Pedido;
  producto: Producto;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "dividir-item-dialog",
  templateUrl: "./dividir-item-dialog.component.html",
  styleUrls: ["./dividir-item-dialog.component.scss"],
})
export class DividirItemDialogComponent implements OnInit, AfterViewInit {
  @ViewChild("scrollContainer") private scrollContainer: ElementRef;
  @ViewChild("saveBtn", { read: MatButton }) saveBtn: MatButton;
  @ViewChildren("addBtn") addBtn: QueryList<MatIconButton>;
  @ViewChildren("presentacionSelect") presentacionSelect: QueryList<MatSelect>;
  @ViewChildren("cantidadPresentacionInput", { read: ElementRef }) cantidadPresentacionInput: QueryList<ElementRef>;

  // Focus management properties
  private currentFocusIndex = 0;
  private isSelectOpen = false;
  private focusInitialized = false;

  cantidadParcial = 0;
  cantidadPorUnidad = 0;
  precioTotal = 0;
  cantObservables = 0;

  codigoControl: FormControl[] = [
    new FormControl(null, Validators.required),
    new FormControl(null, Validators.required),
  ];
  descripcionControl: FormControl[] = [
    new FormControl(null),
    new FormControl(null),
  ];
  presentacionControl: FormControl[] = [
    new FormControl(null),
    new FormControl(null),
  ];
  cantidadUnidadControl: FormControl[] = [
    new FormControl(0),
    new FormControl(0),
  ];
  cantidadPresentacionControl: FormControl[] = [
    new FormControl(0),
    new FormControl(0),
  ];
  formaPagoControl: FormControl[] = [
    new FormControl(null),
    new FormControl(null),
  ];
  precioPorPresentacionControl: FormControl[] = [
    new FormControl(0),
    new FormControl(0),
  ];
  precioUnitarioControl: FormControl[] = [
    new FormControl(0),
    new FormControl(0),
  ];
  valorTotalControl: FormControl[] = [new FormControl(0), new FormControl(0)];
  descuentoPresentacionControl: FormControl[] = [
    new FormControl(0),
    new FormControl(0),
  ];

  //mascara para formatear los numeros a monedas
  currencyMask = new CurrencyMask();

  selectedPedidoItem: PedidoItem;
  presentacionList: Presentacion[];

  selectedPedido: Pedido;
  selectedProducto: Producto;

  cantItens = 2;

  // Computed properties for template (to avoid function calls in HTML)
  monedaSymbolComputed = 'Gs.';
  dialogTitleComputed = 'Dividir Item';
  productDescriptionComputed = '';
  originalCantidadComputed = 0;
  originalTotalComputed = 0;
  cantidadTotalValidaComputed = false;
  canSaveComputed = false;
  canAddMoreItemsComputed = true;
  totalItemsCountComputed = 2;
  totalUnitsComputed = 0;
  grandTotalComputed = 0;
  validationMessageComputed = '';
  isFormValidComputed = false;
  isLoadingComputed = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: DividirItemDialogData,
    private productoService: ProductoService,
    private pedidoService: PedidoService,
    private dialogRef: MatDialogRef<DividirItemDialogComponent>
  ) {}

  ngOnInit(): void {
    this.onCargarDatos();
  }

  ngAfterViewInit(): void {
    // Set initial focus after view is initialized and data is loaded
    setTimeout(() => {
      this.setInitialFocus();
    }, 500); // Small delay to ensure everything is loaded
  }

  private setInitialFocus(): void {
    if (!this.focusInitialized && this.presentacionSelect.length > 0) {
      const firstSelect = this.presentacionSelect.first;
      if (firstSelect) {
        firstSelect.focus();
        this.currentFocusIndex = 0;
        this.focusInitialized = true;
      }
    }
  }

  // Global keyboard event handler
  @HostListener('document:keydown', ['$event'])
  onGlobalKeyDown(event: KeyboardEvent): void {
    // ESC to cancel
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancelar();
      return;
    }

    // Ctrl+Enter to save (if valid)
    if (event.ctrlKey && event.key === 'Enter' && this.canSave) {
      event.preventDefault();
      this.onGuardar();
      return;
    }

    // Ctrl+A to add new item (if possible)
    if (event.ctrlKey && event.key === 'a' && this.canAddMoreItems) {
      event.preventDefault();
      this.onAddItem();
      return;
    }
  }

  // Enhanced keyboard navigation for presentacion fields
  onPresentacionKeyDown(event: KeyboardEvent, index: number): void {
    const select = this.presentacionSelect.toArray()[index];
    
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (!this.isSelectOpen) {
          // Open the select
          select.open();
          this.isSelectOpen = true;
        } else {
          // Select is already open, close it and move to cantidad
          select.close();
          this.isSelectOpen = false;
          this.focusCantidadPresentacion(index);
        }
        break;
        
      case 'Tab':
        if (!event.shiftKey) {
          // Tab forward - move to cantidad input
          event.preventDefault();
          this.focusCantidadPresentacion(index);
        }
        // Let shift+tab work normally for backward navigation
        break;
        
      case 'ArrowDown':
        if (!this.isSelectOpen && event.ctrlKey && this.canAddMoreItems) {
          // Ctrl+Arrow Down - add new item
          event.preventDefault();
          this.onAddItem();
        }
        break;
        
      case 'Delete':
        if (event.ctrlKey && index > 1) {
          // Ctrl+Delete - remove item (except first two)
          event.preventDefault();
          this.onDeleteItem(index);
        }
        break;
    }
  }

  // Enhanced keyboard navigation for cantidad fields
  onCantidadPresentacionKeyDown(event: KeyboardEvent, index: number): void {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.navigateToNextField(index);
        break;
        
      case 'Tab':
        if (!event.shiftKey) {
          // Tab forward - navigate to next field
          event.preventDefault();
          this.navigateToNextField(index);
        }
        // Let shift+tab work normally for backward navigation
        break;
        
      case 'ArrowDown':
        if (event.ctrlKey && this.canAddMoreItems) {
          // Ctrl+Arrow Down - add new item
          event.preventDefault();
          this.onAddItem();
        }
        break;
        
      case 'Delete':
        if (event.ctrlKey && index > 1) {
          // Ctrl+Delete - remove item (except first two)
          event.preventDefault();
          this.onDeleteItem(index);
        }
        break;
    }
  }

  onPresentacionOpened(index: number): void {
    this.isSelectOpen = true;
  }

  onPresentacionClosed(index: number): void {
    this.isSelectOpen = false;
    // When selection is made and closed, move to cantidad
    setTimeout(() => {
      this.focusCantidadPresentacion(index);
    }, 100);
  }

  onCantidadPresentacionEnter(index: number) {
    this.navigateToNextField(index);
  }

  onCargarDatos() {
    this.isLoadingComputed = true;
    
    if (this.data?.pedido != null) {
      this.selectedPedido = this.data.pedido;
    }
    if (this.data?.pedidoItem != null) {
      this.selectedPedidoItem = this.data.pedidoItem;
    }

    this.productoService
      .getProducto(this.selectedPedidoItem.producto.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedProducto = res;
          this.onCargarItem();
        }
      });

    this.pedidoService
      .onGetPedidoInfoCompleta(this.selectedPedidoItem.pedido.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedPedido = res;
          this.updateComputedProperties();
        }
      });
  }

  onCargarItem() {
    this.presentacionList = this.selectedProducto.presentaciones;
    this.codigoControl[0].setValue(
      this.selectedPedidoItem?.producto?.codigoPrincipal
    );
    this.descripcionControl[0].setValue(this.selectedProducto.descripcion);
    this.presentacionControl[0].setValue(
      this.presentacionList?.find(
        (p) => p.id === this.selectedPedidoItem.presentacionCreacion.id
      )
    );
    this.presentacionControl[1].setValue(this.presentacionControl[0].value);
    this.cantidadPresentacionControl[0].setValue(
      this.selectedPedidoItem.cantidadCreacion
    );
    this.cantidadUnidadControl[0].setValue(
      this.selectedPedidoItem.cantidadCreacion *
        this.selectedPedidoItem.presentacionCreacion.cantidad
    );
    this.cantidadPorUnidad = this.cantidadUnidadControl[0].value;

    this.precioPorPresentacionControl[0].setValue(
      this.selectedPedidoItem.precioUnitarioCreacion *
        this.selectedPedidoItem.presentacionCreacion.cantidad
    );
    this.precioPorPresentacionControl[1].setValue(
      this.precioPorPresentacionControl[0].value
    );
    this.precioPorPresentacionControl[0].disable();
    this.precioPorPresentacionControl[1].disable();

    this.precioUnitarioControl[0].setValue(
      this.selectedPedidoItem.precioUnitarioCreacion
    );
    this.precioUnitarioControl[1].setValue(this.precioUnitarioControl[0].value);
    this.precioUnitarioControl[0].disable();
    this.precioUnitarioControl[1].disable();

    this.descuentoPresentacionControl[0].setValue(
      this.selectedPedidoItem.presentacionCreacion.cantidad *
        this.selectedPedidoItem?.descuentoUnitarioCreacion
    );
    this.descuentoPresentacionControl[1].setValue(
      this.descuentoPresentacionControl[0].value
    );
    this.descuentoPresentacionControl[0].disable();
    this.descuentoPresentacionControl[1].disable();

    this.valorTotalControl[0].setValue(
      this.selectedPedidoItem.cantidadCreacion *
        this.selectedPedidoItem.presentacionCreacion.cantidad *
        (this.selectedPedidoItem.precioUnitarioCreacion -
          this.selectedPedidoItem.descuentoUnitarioCreacion)
    );

    this.precioTotal = this.valorTotalControl[0].value;
    this.valorTotalControl[0].disable();
    this.valorTotalControl[1].disable();

    this.agregarObservables(0);
    this.agregarObservables(1);

    this.verificarCantidades();
    this.updateComputedProperties();
    this.isLoadingComputed = false;
  }

  private updateComputedProperties(): void {
    // Update moneda symbol
    this.monedaSymbolComputed = this.selectedPedido?.moneda?.simbolo || 'Gs.';
    
    // Update product description
    this.productDescriptionComputed = this.selectedProducto?.descripcion || '';
    
    // Update original values
    this.originalCantidadComputed = this.cantidadPorUnidad;
    this.originalTotalComputed = this.precioTotal;
    
    // Update totals
    this.totalItemsCountComputed = this.presentacionControl.length;
    this.totalUnitsComputed = this.cantidadParcial;
    
    // Calculate grand total
    this.grandTotalComputed = this.cantidadParcial *
      (this.selectedPedidoItem?.precioUnitarioCreacion -
        this.selectedPedidoItem?.descuentoUnitarioCreacion);
    
    // Update validation
    this.cantidadTotalValidaComputed = this.cantidadParcial === this.cantidadPorUnidad;
    this.canSaveComputed = this.cantidadTotalValidaComputed && this.totalItemsCountComputed > 1;
    this.canAddMoreItemsComputed = this.totalItemsCountComputed < 10; // Max 10 items
    this.isFormValidComputed = this.canSaveComputed;
    
    // Update validation message
    if (this.cantidadParcial > this.cantidadPorUnidad) {
      this.validationMessageComputed = `Excede en ${(this.cantidadParcial - this.cantidadPorUnidad)} unidades`;
    } else if (this.cantidadParcial < this.cantidadPorUnidad) {
      this.validationMessageComputed = `Faltan ${(this.cantidadPorUnidad - this.cantidadParcial)} unidades`;
    } else {
      this.validationMessageComputed = this.cantidadTotalValidaComputed ? 'Cantidades correctas' : '';
    }
  }

  verificarCantidades() {
    this.cantidadParcial = 0;
    this.cantidadUnidadControl.forEach((c) => {
      this.cantidadParcial = this.cantidadParcial + c.value;
    });

    if (this.cantidadParcial != this.cantidadPorUnidad) {
      this.cantidadPresentacionControl.forEach((c) => {
        c.markAsTouched();
        c.markAsDirty();
        c.setErrors({ error: true });
      });
    } else {
      this.cantidadPresentacionControl.forEach((c) => c.setErrors(null));
    }
    
    // Update computed properties after verification
    this.updateComputedProperties();
  }

  agregarObservables(index: number) {
    this.presentacionControl[index].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.cantidadUnidadControl[index].setValue(
            this.presentacionControl[index].value?.cantidad *
              this.cantidadPresentacionControl[index].value,
            { emitEvent: false }
          );
          this.valorTotalControl[index].setValue(
            (this.selectedPedidoItem.precioUnitarioCreacion -
              this.selectedPedidoItem.descuentoUnitarioCreacion) *
              this.cantidadUnidadControl[index].value
          );
          this.verificarCantidades();
        }
      });

    this.cantidadPresentacionControl[index].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.cantidadUnidadControl[index].setValue(
            this.presentacionControl[index].value?.cantidad *
              this.cantidadPresentacionControl[index].value,
            { emitEvent: false }
          );
          this.valorTotalControl[index].setValue(
            (this.selectedPedidoItem.precioUnitarioCreacion -
              this.selectedPedidoItem.descuentoUnitarioCreacion) *
              this.cantidadUnidadControl[index].value
          );
          this.verificarCantidades();
        }

        let nombre: string;
        nombre = null;
      });
  }

  onAddItem() {
    if (!this.canAddMoreItemsComputed) return;
    
    this.presentacionControl.push(
      new FormControl(this.presentacionControl[0].value)
    );
    this.cantidadPresentacionControl.push(new FormControl(0));
    this.cantidadUnidadControl.push(new FormControl(0));
    this.precioPorPresentacionControl.push(
      new FormControl(this.precioPorPresentacionControl[0].value)
    );
    this.precioPorPresentacionControl[
      this.presentacionControl.length - 1
    ].disable();
    this.precioUnitarioControl.push(
      new FormControl(this.precioUnitarioControl[0].value)
    );
    this.precioUnitarioControl[this.presentacionControl.length - 1].disable();
    this.descuentoPresentacionControl.push(
      new FormControl(this.descripcionControl[0].value)
    );
    this.descuentoPresentacionControl[
      this.presentacionControl.length - 1
    ].disable();
    this.valorTotalControl.push(new FormControl(0));
    this.valorTotalControl[this.presentacionControl.length - 1].disable();
    this.agregarObservables(this.presentacionControl.length - 1);
    this.scrollToBottom();
    this.updateComputedProperties();
    
    // Focus on the newly added presentacion select after view updates
    setTimeout(() => {
      const newIndex = this.presentacionControl.length - 1;
      const newSelect = this.presentacionSelect.toArray()[newIndex];
      if (newSelect) {
        newSelect.focus();
        this.currentFocusIndex = newIndex;
      }
    }, 200);
  }

  onDeleteItem(index) {
    if (this.presentacionControl.length <= 2) return; // Minimum 2 items
    
    this.presentacionControl.splice(index, 1);
    this.cantidadPresentacionControl.splice(index, 1);
    this.cantidadUnidadControl.splice(index, 1);
    this.precioPorPresentacionControl.splice(index, 1);
    this.precioUnitarioControl.splice(index, 1);
    this.descuentoPresentacionControl.splice(index, 1);
    this.valorTotalControl.splice(index, 1);
    this.verificarCantidades();
    
    // Focus management after deletion
    setTimeout(() => {
      const totalItems = this.presentacionControl.length;
      let focusIndex = index;
      
      // If we deleted the last item, focus on the new last item
      if (index >= totalItems) {
        focusIndex = totalItems - 1;
      }
      
      const selectToFocus = this.presentacionSelect.toArray()[focusIndex];
      if (selectToFocus) {
        selectToFocus.focus();
        this.currentFocusIndex = focusIndex;
      }
    }, 200);
  }

  scrollToTop(): void {
    this.scrollContainer.nativeElement.scrollTop = 0;
  }

  scrollToBottom(): void {
    const element = this.scrollContainer.nativeElement;
    element.scrollTop = element.scrollHeight;
  }

  onGuardar() {
    if (!this.canSaveComputed) return;
    
    let pedidoItemList: PedidoItem[] = [];
    let newPedidoItem = new PedidoItem();
    Object.assign(newPedidoItem, this.selectedPedidoItem);
    newPedidoItem.presentacionCreacion = this.presentacionControl[0].value;
    newPedidoItem.cantidadCreacion = this.cantidadPresentacionControl[0].value;
    newPedidoItem.valorTotal = this.valorTotalControl[0].value;
    pedidoItemList.push(newPedidoItem);
    this.cantidadPresentacionControl.forEach((value, index) => {
      if (this.cantidadPresentacionControl[index].value > 0 && index > 0) {
        let auxPedidoItem = new PedidoItem();
        Object.assign(auxPedidoItem, this.selectedPedidoItem);
        auxPedidoItem.id = null;
        auxPedidoItem.creadoEn = null;
        auxPedidoItem.usuarioCreacion = null;
        auxPedidoItem.notaRecepcion = null;
        auxPedidoItem.presentacionCreacion = this.presentacionControl[index].value;
        auxPedidoItem.cantidadCreacion = this.cantidadPresentacionControl[index].value;
        auxPedidoItem.valorTotal = this.valorTotalControl[index].value;
        pedidoItemList.push(auxPedidoItem);
      }
    });

    console.log(pedidoItemList);
    

    if (pedidoItemList?.length > 1) {
      this.isLoadingComputed = true;
      
      const saveItemObservables = pedidoItemList.map((pi, index) =>
        this.pedidoService.onSaveItem(pi.toInput()).pipe(
          // Map each response back to its index
          map((response) => ({ index, response }))
        )
      );
    
      forkJoin(saveItemObservables).subscribe({
        next: (responses) => {
          // Update pedidoItemList with the responses at the correct index
          responses.forEach(({ index, response }) => {
            pedidoItemList[index] = response;
          });
          this.isLoadingComputed = false;
          this.dialogRef.close(pedidoItemList);
        },
        error: (err) => {
          console.error("Error saving items", err);
          this.isLoadingComputed = false;
          // Handle errors if necessary
        }
      });
    }
  }

  onCancelar() {
    this.dialogRef.close();
  }

  onPresentacionChange(index) {
    // this.presentacionSelect.get(index).close();
    // this.cantidadPresentacionInput.get(index).focus();
  }

  // Getters for template
  get monedaSymbol(): string {
    return this.monedaSymbolComputed;
  }

  get dialogTitle(): string {
    return this.dialogTitleComputed;
  }

  get productDescription(): string {
    return this.productDescriptionComputed;
  }

  get cantidadTotalValida(): boolean {
    return this.cantidadTotalValidaComputed;
  }

  get canSave(): boolean {
    return this.canSaveComputed;
  }

  get canAddMoreItems(): boolean {
    return this.canAddMoreItemsComputed;
  }

  get totalItemsCount(): number {
    return this.totalItemsCountComputed;
  }

  get totalUnits(): number {
    return this.totalUnitsComputed;
  }

  get grandTotal(): number {
    return this.grandTotalComputed;
  }

  get validationMessage(): string {
    return this.validationMessageComputed;
  }

  get isFormValid(): boolean {
    return this.isFormValidComputed;
  }

  get isLoading(): boolean {
    return this.isLoadingComputed;
  }

  private focusCantidadPresentacion(index: number): void {
    setTimeout(() => {
      const cantidadInput = this.cantidadPresentacionInput.toArray()[index];
      if (cantidadInput && cantidadInput.nativeElement) {
        cantidadInput.nativeElement.focus();
        // also select all text
        cantidadInput.nativeElement.select();
      }
    }, 100);
  }

  private navigateToNextField(currentIndex: number): void {
    const totalItems = this.presentacionControl.length;
    const nextIndex = currentIndex + 1;

    if (nextIndex < totalItems) {
      // Move to next presentacion select
      setTimeout(() => {
        const nextSelect = this.presentacionSelect.toArray()[nextIndex];
        if (nextSelect) {
          nextSelect.focus();
          this.currentFocusIndex = nextIndex;
        }
      }, 100);
    } else {
      // Last item, move to save button
      this.focusSaveButton();
    }
  }

  private focusSaveButton(): void {
    console.log('focusSaveButton', this.saveBtn);
    setTimeout(() => {
      if (this.saveBtn) {
        this.saveBtn.focus();
      }
    }, 100);
  }
}
