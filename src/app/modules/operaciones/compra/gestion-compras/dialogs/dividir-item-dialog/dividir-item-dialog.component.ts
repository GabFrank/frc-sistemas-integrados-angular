import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime } from 'rxjs/operators';

import { PedidoItem } from '../../pedido-item.model';
import { NotaRecepcion } from '../../nota-recepcion.model';
import { NotaRecepcionItem } from '../../nota-recepcion-item.model';
import { DividirPedidoItemInput } from '../../models/dividir-pedido-item.model';
import { Presentacion } from '../../../../../productos/presentacion/presentacion.model';
import { PedidoService } from '../../../pedido.service';
import { PresentacionService } from '../../../../../productos/presentacion/presentacion.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../../shared/components/dialogos/dialogos.service';
import {
  AVISO_SIN_PRESENTACIONES,
  OpcionSelect,
  aUnidadesBase,
  cierreSiNoHuboRespuesta,
  enPresentacion,
  opcionesDeNotas,
} from '../../utils/recepcion-documental.utils';

export interface DividirItemDialogData {
  pedidoItem: PedidoItem;
  notaRecepcion?: NotaRecepcion;
  notasDisponibles: NotaRecepcion[];
  pedidoId: number;
}

export interface DividirItemDialogResult {
  success: boolean;
  notaRecepcionItems?: NotaRecepcionItem[];
  message?: string;
  /** Alguna parte se guardó (o pudo guardarse) y reintentar duplicaría: quien abrió el diálogo recarga (#488). */
  recargar?: boolean;
}

type ParteForm = FormGroup<{
  cantidad: FormControl<number>;
  notaRecepcionId: FormControl<number | null>;
}>;

/**
 * División de un ítem del pedido en varias notas. El diálogo junta las partes; el central
 * (`dividirPedidoItemEnNotas`) las guarda todas en una transacción. Antes se guardaban una por una y un corte dejaba
 * la división a medias (#488).
 */
@UntilDestroy()
@Component({
  selector: 'app-dividir-item-dialog',
  templateUrl: './dividir-item-dialog.component.html',
  styleUrls: ['./dividir-item-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividirItemDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<DividirItemDialogComponent, DividirItemDialogResult>>(MatDialogRef);
  data = inject<DividirItemDialogData>(MAT_DIALOG_DATA);
  private pedidoService = inject(PedidoService);
  private presentacionService = inject(PresentacionService);
  private notificacionService = inject(NotificacionSnackbarService);
  private dialogosService = inject(DialogosService);
  private cdr = inject(ChangeDetectorRef);

  partes = this.fb.array<ParteForm>([]);
  form = this.fb.group({
    presentacionId: this.fb.control<number | null>(null, Validators.required),
    items: this.partes,
  });

  isLoading = false;
  presentaciones: Presentacion[] = [];
  presentacionSeleccionada: Presentacion | null = null;
  cantidadTotal = 0;
  cantidadAsignada = 0;
  cantidadPendiente = 0;

  // Valores precalculados para el template
  titulo = '';
  productoDisplay = '';
  notasDisponiblesDisplay: OpcionSelect<number>[] = [];
  cantidadTotalDisplay = 0;
  cantidadAsignadaDisplay = 0;
  cantidadPendienteDisplay = 0;
  excedeCantidad = false;
  pendienteCompleta = false;
  puedeAgregarParte = false;
  puedeEliminarParte = false;
  puedeGuardar = false;

  ngOnInit(): void {
    this.cantidadTotal = this.data.pedidoItem.cantidadSolicitada || 0;
    // Dos partes iniciales
    this.agregarParte();
    this.agregarParte();
    this.inicializarOpciones();
    this.recalcular();
    this.cargarPresentaciones();
    this.escucharFormulario();
  }

  private inicializarOpciones(): void {
    this.productoDisplay = this.data.pedidoItem.producto?.descripcion || 'Producto no disponible';
    this.titulo = `Dividir Ítem: ${this.productoDisplay}`;
    this.notasDisponiblesDisplay = [
      ...opcionesDeNotas(this.data.notasDisponibles),
      { value: 0, viewValue: '➕ Crear Nueva Nota' },
    ];
  }

  private escucharFormulario(): void {
    this.form.controls.presentacionId.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((presentacionId) => {
        this.presentacionSeleccionada = this.presentaciones.find((p) => p.id === presentacionId) || null;
        this.recalcular();
        this.cdr.markForCheck();
      });

    this.partes.valueChanges
      .pipe(debounceTime(200), untilDestroyed(this))
      .subscribe(() => {
        this.recalcular();
        this.cdr.markForCheck();
      });
  }

  private cargarPresentaciones(): void {
    const productoId = this.data.pedidoItem.producto?.id;
    if (!productoId) return;
    this.presentacionService.onGetPresentacionesPorProductoIdParaDialogo(productoId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (presentaciones) => {
          // null = error GraphQL (el servicio ya avisó): sin presentación las partes no son válidas
          this.presentaciones = presentaciones ?? [];
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error cargando presentaciones:', error);
          this.notificacionService.openWarn(AVISO_SIN_PRESENTACIONES, 6);
        },
      });
  }

  /** Totales de la pantalla, en la presentación elegida (la comparación con lo pedido es en unidades base). */
  private recalcular(): void {
    const presentacion = this.presentacionSeleccionada;
    this.cantidadAsignada = this.partes.controls.reduce((total, parte) => total + (parte.controls.cantidad.value || 0), 0);
    const asignadaEnUnidadBase = aUnidadesBase(this.cantidadAsignada, presentacion);
    this.cantidadPendiente = this.cantidadTotal - asignadaEnUnidadBase;

    this.cantidadTotalDisplay = enPresentacion(this.cantidadTotal, presentacion);
    this.cantidadAsignadaDisplay = this.cantidadAsignada;
    this.cantidadPendienteDisplay = enPresentacion(this.cantidadPendiente, presentacion);
    this.excedeCantidad = asignadaEnUnidadBase > this.cantidadTotal;
    this.pendienteCompleta = this.cantidadPendiente === 0;
    this.puedeAgregarParte = this.cantidadPendiente > 0;
    this.puedeEliminarParte = this.partes.length > 1;
    this.puedeGuardar = this.form.valid && this.cantidadAsignada > 0 && !this.isLoading;
  }

  agregarParte(): void {
    this.partes.push(this.fb.group({
      cantidad: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
      notaRecepcionId: this.fb.control<number | null>(null, Validators.required),
    }));
    this.recalcular();
  }

  eliminarParte(index: number): void {
    if (this.partes.length > 1) {
      this.partes.removeAt(index);
      this.recalcular();
    }
  }

  onGuardar(): void {
    this.recalcular();
    if (!this.puedeGuardar) {
      this.notificacionService.openAlgoSalioMal('Por favor complete todos los campos requeridos');
      return;
    }
    if (this.excedeCantidad) {
      this.confirmarExcesoCantidad();
      return;
    }
    this.guardarPartes();
  }

  private confirmarExcesoCantidad(): void {
    const asignadaEnUnidadBase = aUnidadesBase(this.cantidadAsignada, this.presentacionSeleccionada);
    const mensaje = `La cantidad total asignada (${this.cantidadAsignada} ${this.presentacionSeleccionada?.descripcion} = ${asignadaEnUnidadBase} unidades) excede la cantidad solicitada (${this.cantidadTotal} unidades). ¿Desea continuar?`;
    this.dialogosService.confirm('Confirmar Exceso de Cantidad', mensaje)
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (confirmado) {
          this.guardarPartes();
        }
      });
  }

  private guardarPartes(): void {
    this.actualizarCarga(true);
    const input: DividirPedidoItemInput = {
      pedidoItemId: this.data.pedidoItem.id,
      presentacionId: this.presentacionSeleccionada?.id,
      partes: this.partes.getRawValue().map((parte) => ({
        notaRecepcionId: parte.notaRecepcionId,
        cantidad: parte.cantidad,
      })),
    };
    this.pedidoService.onDividirPedidoItemEnNotas(input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (items) => {
          this.actualizarCarga(false);
          if (items == null) return; // el genérico ya avisó
          // El aviso de éxito lo da quien abrió el diálogo (un solo verde)
          this.dialogRef.close({ success: true, notaRecepcionItems: items, message: 'Ítem dividido exitosamente' });
        },
        error: (error) => {
          console.error('Error al dividir el ítem:', error);
          this.actualizarCarga(false);
          const cierre = cierreSiNoHuboRespuesta(error, 'se guardaron todas las partes');
          if (cierre) this.dialogRef.close(cierre);
        },
      });
  }

  private actualizarCarga(cargando: boolean): void {
    this.isLoading = cargando;
    this.recalcular();
    this.cdr.markForCheck();
  }

  onCancelar(): void {
    this.dialogRef.close({ success: false });
  }
}
