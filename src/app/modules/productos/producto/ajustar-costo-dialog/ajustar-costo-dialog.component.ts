import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { MainService } from '../../../../main.service';
import { Producto } from '../producto.model';
import { CostoPorProductoService, CostoPorProductoInput } from '../../../operaciones/costo-por-producto/costo-por-producto.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';

export interface AjustarCostoDialogData {
  producto: Producto;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-ajustar-costo-dialog',
  templateUrl: './ajustar-costo-dialog.component.html',
  styleUrls: ['./ajustar-costo-dialog.component.scss']
})
export class AjustarCostoDialogComponent implements OnInit {

  @ViewChild('costoInput', { static: false }) costoInput: ElementRef;

  formGroup: FormGroup;
  costoControl = new FormControl(null, [Validators.required, Validators.min(0)]);
  observacionControl = new FormControl();

  costoActual: number = 0;
  ultimoPrecioCompra: number = 0;
  isLoadingCosto = false;
  diferenciaCosto: number = 0;
  variacionPorcentual: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AjustarCostoDialogData,
    private dialogRef: MatDialogRef<AjustarCostoDialogComponent>,
    private costoPorProductoService: CostoPorProductoService,
    private notificacionService: NotificacionSnackbarService,
    private cargandoService: CargandoDialogService,
    private dialogosService: DialogosService,
    private mainService: MainService
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.cargarCostoActual();
  }

  createForm(): void {
    this.formGroup = new FormGroup({
      costo: this.costoControl,
      observacion: this.observacionControl
    });

    this.costoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.calcularDiferenciaCosto();
      this.calcularVariacionPorcentualTemplate();
    });
  }

  cargarCostoActual(): void {
    if (!this.data.producto?.id) return;

    this.isLoadingCosto = true;
    
    this.costoActual = this.data.producto.costo?.costoMedio || 0;
    this.ultimoPrecioCompra = this.data.producto.costo?.ultimoPrecioCompra || 0;
    
    this.costoControl.setValue(this.costoActual);
    this.isLoadingCosto = false;
    
    this.calcularDiferenciaCosto();
    this.calcularVariacionPorcentualTemplate();
    
    setTimeout(() => {
      if (this.costoInput) {
        this.costoInput.nativeElement.focus();
        this.costoInput.nativeElement.select();
      }
    }, 100);
  }

  onGuardar(): void {
    if (this.formGroup.invalid) {
      this.notificacionService.openWarn('Por favor complete todos los campos requeridos');
      return;
    }

    const nuevoCosto = this.costoControl.value;

    if (nuevoCosto === this.costoActual) {
      this.notificacionService.openWarn('No hay diferencia en el costo para ajustar');
      return;
    }

    this.validarVariacionCosto(nuevoCosto).then(continuar => {
      if (continuar) {
        this.ejecutarGuardado(nuevoCosto);
      }
    });
  }

  validarVariacionCosto(costoIngresado: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (!costoIngresado || (!this.costoActual && !this.ultimoPrecioCompra)) {
        resolve(true);
        return;
      }
      
      const variacionVsMedio = this.calcularVariacionPorcentual(costoIngresado, this.costoActual);
      const variacionVsUltimo = this.calcularVariacionPorcentual(costoIngresado, this.ultimoPrecioCompra);
      const variacionMaxima = Math.max(Math.abs(variacionVsMedio), Math.abs(variacionVsUltimo));
      
      if (variacionMaxima > 75) {
        const referencias = this.construirMensajeReferencias(this.costoActual, this.ultimoPrecioCompra, variacionVsMedio, variacionVsUltimo);
        
        this.dialogosService.confirm(
          "Atención!!",
          `Costo ingresado: ${costoIngresado.toLocaleString()} Gs.`,
          "¿Está seguro de que desea guardar este costo?",
          [referencias],
          true,
          "Guardar de todas formas", 
          "Revisar costo"
        ).subscribe(resolve);
        return;
      }
      
      resolve(true);
    });
  }

  calcularVariacionPorcentual(costoActual: number, costoReferencia: number): number {
    if (!costoReferencia || costoReferencia === 0) return 0;
    return ((costoActual - costoReferencia) / costoReferencia) * 100;
  }

  construirMensajeReferencias(costoMedio: number, ultimoPrecioCompra: number, varMedio: number, varUltimo: number): string {
    const referencias = [];
    
    if (costoMedio) {
      referencias.push(`Costo actual: ${costoMedio.toLocaleString()} Gs. (${varMedio > 0 ? '+' : ''}${varMedio.toFixed(0)}%)`);
    }
    
    if (ultimoPrecioCompra && ultimoPrecioCompra !== costoMedio) {
      referencias.push(`Última compra: ${ultimoPrecioCompra.toLocaleString()} Gs. (${varUltimo > 0 ? '+' : ''}${varUltimo.toFixed(0)}%)`);
    }
    
    return referencias.join(' | ');
  }

  ejecutarGuardado(nuevoCosto: number): void {
    if (!this.data.producto?.id) {
      this.notificacionService.openWarn('Error: No se encontró el producto');
      return;
    }

    if (!this.mainService.usuarioActual?.id) {
      this.notificacionService.openWarn('Error: No se encontró el usuario actual');
      return;
    }

    this.cargandoService.openDialog();

    const costoPorProductoInput: CostoPorProductoInput = {
      productoId: this.data.producto.id,
      sucursalId: null,
      costoMedio: nuevoCosto,
      ultimoPrecioCompra: nuevoCosto,
      usuarioId: this.mainService.usuarioActual.id,
      monedaId: 1,
      cotizacion: 1
    };

    this.costoPorProductoService.onSaveCostoPorProducto(costoPorProductoInput)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (costoGuardado) => {
          this.cargandoService.closeDialog();
          this.notificacionService.openGuardadoConExito();
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.cargandoService.closeDialog();
          this.notificacionService.openAlgoSalioMal('No se pudo guardar el ajuste de costo.');
        }
      });
  }

  onCancelar(): void {
    this.dialogRef.close(false);
  }

  calcularDiferenciaCosto(): void {
    const nuevoCosto = this.costoControl.value || 0;
    this.diferenciaCosto = nuevoCosto - this.costoActual;
  }

  calcularVariacionPorcentualTemplate(): void {
    if (!this.costoActual || this.costoActual === 0) {
      this.variacionPorcentual = 0;
      return;
    }
    this.variacionPorcentual = ((this.costoControl.value || 0) - this.costoActual) / this.costoActual * 100;
  }
} 