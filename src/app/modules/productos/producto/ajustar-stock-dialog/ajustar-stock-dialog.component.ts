import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { MainService } from '../../../../main.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { esSucursalCompras } from '../../../empresarial/sucursal/sucursal-compras.util';
import { ROLES } from '../../../personas/roles/roles.enum';
import { Producto } from '../producto.model';
import { MovimientoStockService } from '../../../operaciones/movimiento-stock/movimiento-stock.service';
import { MovimientoStock, MovimientoStockInput } from '../../../operaciones/movimiento-stock/movimiento-stock.model';
import { TipoMovimiento } from '../../../operaciones/movimiento-stock/movimiento-stock.enums';

export interface AjustarStockDialogData {
  producto: Producto;
  sucursalPreseleccionada?: Sucursal;
  permitirCambiarSucursal?: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-ajustar-stock-dialog',
  templateUrl: './ajustar-stock-dialog.component.html',
  styleUrls: ['./ajustar-stock-dialog.component.scss']
})
export class AjustarStockDialogComponent implements OnInit {

  @ViewChild('cantidadInput', { static: false }) cantidadInput: ElementRef;

  formGroup: FormGroup;
  sucursalControl = new FormControl(null, Validators.required);
  cantidadControl = new FormControl(null, Validators.required);
  observacionControl = new FormControl();

  sucursales: Sucursal[] = [];
  selectedSucursal: Sucursal;
  stockActual: number = 0;
  isLoadingStock = false;
  permitirCambiarSucursal: boolean = true;
  diferencia: number = 0;
  /** Sin este rol COMPRAS no se puede ajustar: ajustar exige ver su stock, que está oculto. */
  puedeVerStockCompras = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AjustarStockDialogData,
    private dialogRef: MatDialogRef<AjustarStockDialogComponent>,
    private sucursalService: SucursalService,
    private movimientoStockService: MovimientoStockService,
    private notificacionService: NotificacionSnackbarService,
    private cargandoService: CargandoDialogService,
    private mainService: MainService
  ) {}

  ngOnInit(): void {
    this.puedeVerStockCompras = this.mainService.tieneAlgunRol([ROLES.VER_STOCK_COMPRAS]);
    // Antes de cargarSucursales(): con una sucursal preseleccionada, esa es la que pide el stock.
    if (!this.puedeVerStockCompras && esSucursalCompras(this.data.sucursalPreseleccionada)) {
      // El template se renderiza igual hasta que termina de cerrar y liga [formGroup].
      this.createForm();
      this.notificacionService.openWarn('Sin permiso para ajustar el stock de COMPRAS');
      this.dialogRef.close(false);
      return;
    }
    this.configurarSucursalPreseleccionada();
    this.createForm();
    this.cargarSucursales();
  }

  configurarSucursalPreseleccionada(): void {
    this.permitirCambiarSucursal = this.data.permitirCambiarSucursal !== false;
    
    if (this.data.sucursalPreseleccionada) {
      this.selectedSucursal = this.data.sucursalPreseleccionada;
      this.sucursalControl.setValue(this.data.sucursalPreseleccionada.id);
      
      if (!this.permitirCambiarSucursal) {
        this.sucursalControl.disable();
      }
    }
  }

  createForm(): void {
    this.formGroup = new FormGroup({
      sucursal: this.sucursalControl,
      cantidad: this.cantidadControl,
      observacion: this.observacionControl
    });

    this.sucursalControl.valueChanges.pipe(untilDestroyed(this)).subscribe(sucursalId => {
      if (sucursalId) {
        this.selectedSucursal = this.sucursales.find(s => s.id === sucursalId);
        this.cargarStockActual();
      }
    });

    this.cantidadControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.calcularDiferencia();
    });
  }

  cargarSucursales() {
    this.sucursalService.onGetAllSucursales(true).subscribe(res => {
      this.sucursales = res?.filter(sucursal =>
        sucursal.nombre != "SERVIDOR" &&
        (this.puedeVerStockCompras || !esSucursalCompras(sucursal)));
      
      if (this.data.sucursalPreseleccionada && this.selectedSucursal) {
        this.cargarStockActual();
      }
    })
  }

  cargarStockActual(): void {
    if (!this.data.producto?.id || !this.selectedSucursal?.id) return;

    this.isLoadingStock = true;
    this.movimientoStockService.onGetStockPorProducto(this.data.producto.id, this.selectedSucursal.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (stock) => {
          this.stockActual = stock || 0;
          this.cantidadControl.setValue(this.stockActual);
          this.calcularDiferencia();
          this.isLoadingStock = false;
          setTimeout(() => {
            if (this.cantidadInput) {
              this.cantidadInput.nativeElement.focus();
              this.cantidadInput.nativeElement.select();
            }
          }, 100);
        },
        error: (error) => {
          this.stockActual = 0;
          this.cantidadControl.setValue(0);
          this.isLoadingStock = false;
          this.notificacionService.openWarn('Error al cargar stock actual');
        }
      });
  }

  calcularDiferencia(): void {
    const nuevaCantidad = this.cantidadControl.value || 0;
    this.diferencia = nuevaCantidad - this.stockActual;
  }

  onGuardar(): void {
    if (this.formGroup.invalid) {
      this.notificacionService.openWarn('Por favor complete todos los campos requeridos');
      return;
    }

    const nuevaCantidad = this.cantidadControl.value;
    const diferencia = nuevaCantidad - this.stockActual;

    if (diferencia === 0) {
      this.notificacionService.openWarn('No hay diferencia en el stock para ajustar');
      return;
    }

    const { requestId } = this.cargandoService.openDialog();

    const movimientoStockInput: MovimientoStockInput = {
      id: 0,
      sucursalId: this.selectedSucursal.id,
      productoId: this.data.producto.id,
      tipoMovimiento: TipoMovimiento.AJUSTE,
      referencia: this.data.producto.id,
      cantidad: diferencia,
      estado: true,
      usuarioId: this.mainService.usuarioActual.id
    };

    this.movimientoStockService.onSaveMovimientoStock(movimientoStockInput)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (movimientoGuardado) => {
          this.cargandoService.closeDialog(requestId);
          
          if (movimientoGuardado.data) {
            try {
              const data = JSON.parse(movimientoGuardado.data);
              console.log('Información del ajuste:', data);
            } catch (e) {
              console.warn('Error al procesar data del movimiento:', e);
            }
          }
          
          this.notificacionService.openGuardadoConExito();
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.cargandoService.closeDialog(requestId);
          this.notificacionService.openAlgoSalioMal('No se pudo guardar el ajuste de stock.');
        }
      });
  }

  onCancelar(): void {
    this.dialogRef.close(false);
  }




} 