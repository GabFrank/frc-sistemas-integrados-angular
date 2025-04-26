import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { PedidoItem } from "../../edit-pedido/pedido-item.model";
import { Sucursal } from "../../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../../empresarial/sucursal/sucursal.service";
import { MovimientoStockService } from "../../../movimiento-stock/movimiento-stock.service";
import { dateToString } from "../../../../../commons/core/utils/dateUtils";
import { TipoMovimiento } from "../../../movimiento-stock/movimiento-stock.enums";
import { PedidoItemSucursalService } from "../pedido-item-sucursal.service";
import { MainService } from "../../../../../main.service";
import { PedidoItemSucursal, PedidoItemSucursalInput } from "../pedido-item-sucursal.model";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../../notificacion-snackbar.service";
import { Observable, forkJoin } from "rxjs";
import { A11yModule } from '@angular/cdk/a11y';
import { log } from "console";

@Component({
  selector: "pedido-item-sucursal-dialog",
  templateUrl: "./pedido-item-sucursal-dialog.component.html",
  styleUrls: ["./pedido-item-sucursal-dialog.component.scss"],
})
export class PedidoItemSucursalDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('addButton') addButton: ElementRef;

  sucursalInfluenciaList: Sucursal[] = [];
  selectedPedidoItem: PedidoItem;
  sucursales: Sucursal[];
  sucEntregaPorDefecto: Sucursal;
  cantAgregada = 0;

  // Change the type of the control maps to use array index instead of sucursal id
  cantidadControls: FormControl[] = [];
  sucursalEntregaControls: FormControl[] = [];
  sucursalInfluenciaControl = new FormControl(null, Validators.required);
  existingPedidoItemSucursales: PedidoItemSucursal[] = [];

  isAddNewSucursal = false;
  sucursalEntregaLoaded: boolean = false;

  pedidoItemSucursalList: PedidoItemSucursal[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      pedidoItem?: PedidoItem;
      sucursalInfluenciaList?: Sucursal[];
      sucursalEntregaList?: Sucursal[];
      autoSet?: boolean; // Si es true, se setea la cantidad y la sucursal de entrega por defecto
    },
    private dialogRef: MatDialogRef<PedidoItemSucursalDialogComponent>,
    private sucursalService: SucursalService,
    private movStockService: MovimientoStockService,
    private pedidoItemSucursalService: PedidoItemSucursalService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService
  ) {
    sucursalService.onGetAllSucursales().subscribe((sucRes) => {
      this.sucursales = sucRes;
      if (data.pedidoItem && data.sucursalInfluenciaList) {
        this.selectedPedidoItem = data.pedidoItem;
        this.sucursalInfluenciaList = data.sucursalInfluenciaList;
        this.loadPedidoItemSucursalAndInitControls();
      }
    });
  }
  ngOnInit(): void {
    if (this.data.autoSet) {
      let pedidoItemSucursal = new PedidoItemSucursal();
      pedidoItemSucursal.sucursal = this.data.sucursalInfluenciaList[0];
      pedidoItemSucursal.sucursalEntrega = this.data.sucursalEntregaList[0];
      pedidoItemSucursal.pedidoItem = this.data.pedidoItem;
      pedidoItemSucursal.cantidadPorUnidad = this.data.pedidoItem.cantidadCreacion * this.data.pedidoItem.presentacionCreacion?.cantidad;
      pedidoItemSucursal.usuario = this.mainService.usuarioActual;
      this.pedidoItemSucursalService.onSavePedidoItemSucursal(pedidoItemSucursal.toInput()).subscribe(res => {
        console.log(res);
        this.dialogRef.close(true);
      });
    } else {

    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.addButton?.nativeElement?.focus();
    }, 100);
  }

  loadPedidoItemSucursalAndInitControls(): void {
    this.pedidoItemSucursalService
      .onGetPedidoItensSucursalByPedidoItem(this.selectedPedidoItem.id)
      .subscribe(pedidoItemSucursales => {
        this.existingPedidoItemSucursales = pedidoItemSucursales || [];
        
        // Create the combined list
        this.pedidoItemSucursalList = [...this.existingPedidoItemSucursales];
        
        // Add missing sucursales from sucursalInfluenciaList
        this.sucursalInfluenciaList.forEach(sucursal => {
          if (!this.pedidoItemSucursalList.some(pis => pis.sucursal.id === sucursal.id)) {
            const newPedidoItemSucursal = new PedidoItemSucursal();
            newPedidoItemSucursal.sucursal = sucursal;
            newPedidoItemSucursal.pedidoItem = this.selectedPedidoItem;
            newPedidoItemSucursal.cantidadPorUnidad = 0;
            newPedidoItemSucursal.usuario = this.mainService.usuarioActual;
            
            // Set default sucursal entrega if available
            if (this.data.sucursalEntregaList?.length === 1) {
              newPedidoItemSucursal.sucursalEntrega = this.data.sucursalEntregaList[0];
            }
            
            this.pedidoItemSucursalList.push(newPedidoItemSucursal);
          }
        });

        this.initializeFormControls();
      });
  }

  initializeFormControls(): void {
    // Clear existing controls
    this.cantidadControls = [];
    this.sucursalEntregaControls = [];

    // Create controls for all items in pedidoItemSucursalList
    this.pedidoItemSucursalList.forEach(item => {
      console.log(item);
      
      // Create cantidad control
      const cantidadControl = new FormControl(
        item.cantidadPorUnidad / this.selectedPedidoItem.presentacionCreacion?.cantidad,
        [Validators.required, Validators.min(0)]
      );
      cantidadControl.valueChanges.subscribe(() => this.calcularCantAdicionada());
      this.cantidadControls.push(cantidadControl);

      // Create sucursal entrega control
      const sucursalEntregaControl = new FormControl(
        item.sucursalEntrega ? this.sucursales.find(s => s.id === item.sucursalEntrega.id) : null,
        Validators.required
      );
      this.sucursalEntregaControls.push(sucursalEntregaControl);
    });

    this.sucursalEntregaLoaded = true;
    this.calcularCantAdicionada();
  }

  cantidadesPorIgual() {
    // Get the number of sucursales (using 0 as fallback if undefined)
    const cantSucursales = this.sucursalInfluenciaList?.length || 0;
    // Total quantity to be divided among the sucursales
    const cantTotal = this.selectedPedidoItem.cantidadCreacion;

    if (cantSucursales > 0) {
      // Calculate the base amount for each sucursal using integer division
      const base = Math.floor(cantTotal / cantSucursales);
      // Calculate the remainder (extra quantity to assign to the first sucursal)
      const remainder = cantTotal % cantSucursales;

      // Iterate over the sucursales and assign the quantity to each control
      this.sucursalInfluenciaList.forEach((sucursal, index) => {
        // The first sucursal gets the base plus the remainder; others get the base value.
        const cantidadAsignada = index === 0 ? base + remainder : base;
        this.cantidadControls[index].setValue(cantidadAsignada);
        this.calcularCantAdicionada();
      });
    }
  }

  calcularCantAdicionada() {
    this.cantAgregada = this.cantidadControls.reduce((total, control) => 
      total + (control.value || 0), 0);
  }

  onAddSucursal() {
    this.isAddNewSucursal = true;
  }

  onCreateControls(sucursal: Sucursal) {
    // Create form controls
    const control = new FormControl(0, [
      Validators.required,
      Validators.min(0),
    ]);
    control.valueChanges.subscribe(() => {
      this.calcularCantAdicionada();
    });
    
    this.cantidadControls.push(control);
    this.sucursalEntregaControls.push(new FormControl(
      this.sucEntregaPorDefecto,
      Validators.required
    ));

    // Create and add new PedidoItemSucursal to the list
    const newPedidoItemSucursal = new PedidoItemSucursal();
    newPedidoItemSucursal.sucursal = sucursal;
    newPedidoItemSucursal.pedidoItem = this.selectedPedidoItem;
    newPedidoItemSucursal.cantidadPorUnidad = 0;
    newPedidoItemSucursal.usuario = this.mainService.usuarioActual;
    newPedidoItemSucursal.sucursalEntrega = this.sucEntregaPorDefecto;
    
    this.pedidoItemSucursalList.push(newPedidoItemSucursal);
    
    // Update other lists and controls
    this.sucursalInfluenciaList.push(sucursal);
    this.sucursalInfluenciaControl.setValue(null);
    this.isAddNewSucursal = false;
  }

  cantidadesSegunMovimiento() {
    let fechaInicio = new Date();
    let fechaFin = new Date();
    fechaInicio.setDate(fechaFin.getDate() - 100);

    this.movStockService.onGetMovimientoStockPorFiltros(
      dateToString(fechaInicio),
      dateToString(fechaFin),
      this.sucursalInfluenciaList.map(fi => fi.id),
      this.selectedPedidoItem.producto.id,
      new Array(TipoMovimiento.VENTA),
      null,
      0,
      this.sucursalInfluenciaList?.length
    ).subscribe(res => {
      // Agrupar ventas por sucursal
      const ventasPorSucursal: { [key: number]: number } = {};
      let totalVentas = 0;

      // Inicializar ventas en 0 para todas las sucursales
      this.sucursalInfluenciaList.forEach(suc => {
        ventasPorSucursal[suc.id] = 0;
      });

      // Sumar las cantidades de venta por sucursal (en positivo)
      res.getContent.forEach(mov => {
        ventasPorSucursal[mov.sucursalId] += Math.abs(mov.cantidad);
        totalVentas += Math.abs(mov.cantidad);
      });

      // Si no hay ventas, distribuir equitativamente
      if (totalVentas === 0) {
        this.cantidadesPorIgual();
        return;
      }

      // Calcular y asignar cantidades según porcentaje de ventas
      const cantidadTotal = this.selectedPedidoItem.cantidadCreacion;
      let cantidadAsignada = 0;

      this.sucursalInfluenciaList.forEach((sucursal, index) => {
        const porcentaje = ventasPorSucursal[sucursal.id] / totalVentas;
        let cantidad = Math.floor(cantidadTotal * porcentaje);

        // Si es la última sucursal, asignar el resto para evitar pérdidas por redondeo
        if (index === this.sucursalInfluenciaList.length - 1) {
          cantidad = cantidadTotal - cantidadAsignada;
        }

        this.cantidadControls[index].setValue(cantidad);
        cantidadAsignada += cantidad;
      });

      this.calcularCantAdicionada();
    });
  }

  onCancelar() {
    this.dialogRef.close(true);
  }
  onGuardar() {
    const saveOperations: Observable<any>[] = [];
    const combinationMap = new Map<string, boolean>();

    // Function to check for duplicates
    const isDuplicate = (sucursal: Sucursal, sucursalEntrega: Sucursal): boolean => {
      const key = `${sucursal.id}-${sucursalEntrega.id}`;
      if (combinationMap.has(key)) {
        return true;
      }
      combinationMap.set(key, true);
      return false;
    };

    // If we have existing items, update or create new ones
    if (this.existingPedidoItemSucursales.length > 0) {
      for (let i = 0; i < this.pedidoItemSucursalList.length; i++) {
        const cantidad = this.cantidadControls[i].value;
        const sucursalEntrega = this.sucursalEntregaControls[i].value;
        const item = this.pedidoItemSucursalList[i];

        if (cantidad > 0) {
          // Check for duplicates
          if (isDuplicate(item.sucursal, sucursalEntrega)) {
            this.notificacionService.openWarn(
              `Ya existe una combinación para la sucursal ${item.sucursal.nombre} con la sucursal de entrega ${sucursalEntrega.nombre}`
            );
            return;
          }

          const pedidoItemSucursal = new PedidoItemSucursal();
          Object.assign(pedidoItemSucursal, item);
          pedidoItemSucursal.cantidadPorUnidad = cantidad * this.selectedPedidoItem.presentacionCreacion?.cantidad;
          pedidoItemSucursal.sucursalEntrega = sucursalEntrega;
          
          saveOperations.push(
            this.pedidoItemSucursalService.onSavePedidoItemSucursal(pedidoItemSucursal.toInput())
          );
        }
      }
    } else {
      // If no existing items, create new ones from sucursalInfluenciaList
      for (let i = 0; i < this.sucursalInfluenciaList.length; i++) {
        const cantidad = this.cantidadControls[i].value;
        const sucursalEntrega = this.sucursalEntregaControls[i].value;
        const sucursal = this.sucursalInfluenciaList[i];

        if (cantidad > 0) {
          // Check for duplicates
          if (isDuplicate(sucursal, sucursalEntrega)) {
            this.notificacionService.openWarn(
              `Ya existe una combinación para la sucursal ${sucursal.nombre} con la sucursal de entrega ${sucursalEntrega.nombre}`
            );
            return;
          }

          const pedidoItemSucursal = new PedidoItemSucursal();
          pedidoItemSucursal.cantidadPorUnidad = cantidad * this.selectedPedidoItem.presentacionCreacion?.cantidad;
          pedidoItemSucursal.sucursalEntrega = sucursalEntrega;
          pedidoItemSucursal.pedidoItem = this.selectedPedidoItem;
          pedidoItemSucursal.sucursal = sucursal;
          pedidoItemSucursal.usuario = this.mainService.usuarioActual;
          
          saveOperations.push(
            this.pedidoItemSucursalService.onSavePedidoItemSucursal(pedidoItemSucursal.toInput())
          );
        }
      }
    }

    if (saveOperations.length > 0) {
      forkJoin(saveOperations).subscribe({
        next: (results) => {
          this.notificacionService.openSucess("Elementos guardados correctamente");
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.notificacionService.openWarn("Error al guardar algunos elementos");
        }
      });
    }
  }

  seleccionarSucursal() {
    this.sucursalService.openSearchDialog().subscribe(sucursal => {
      console.log(sucursal);
      
      if (sucursal) {
        // Iterate through all sucursalEntregaControls and set the selected sucursal
        this.sucursalEntregaControls.forEach((control, index) => {
          control.setValue(sucursal);
        });
      }
    });
  }

  onDelete(index: number) {
    const itemToDelete = this.pedidoItemSucursalList[index];
    
    if (itemToDelete.id) {
      // Item exists in database, call delete service
      this.pedidoItemSucursalService.onDeletePedidoItemSucursal(itemToDelete.id).subscribe({
        next: () => {
          this.pedidoItemSucursalList.splice(index, 1);
          this.cantidadControls.splice(index, 1);
          this.sucursalEntregaControls.splice(index, 1);
          this.calcularCantAdicionada();
          this.notificacionService.openSucess('Elemento eliminado correctamente');
        },
        error: (error) => {
          this.notificacionService.openWarn('Error al eliminar el elemento');
        }
      });
    } else {
      // Item only exists in memory, just remove from arrays
      this.pedidoItemSucursalList.splice(index, 1);
      this.cantidadControls.splice(index, 1);
      this.sucursalEntregaControls.splice(index, 1);
      this.calcularCantAdicionada();
    }
  }
}
