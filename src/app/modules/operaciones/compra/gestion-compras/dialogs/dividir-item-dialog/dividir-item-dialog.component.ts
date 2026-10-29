import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime } from 'rxjs/operators';

import { PedidoItem } from '../../pedido-item.model';
import { NotaRecepcion } from '../../nota-recepcion.model';
import { Pedido } from '../../pedido.model';
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
import {
  AddEditNotaRecepcionDialogComponent,
  AddEditNotaRecepcionDialogData,
  AddEditNotaRecepcionDialogResult,
} from '../add-edit-nota-recepcion-dialog/add-edit-nota-recepcion-dialog.component';

export interface DividirItemDialogData {
  pedidoItem: PedidoItem;
  notaRecepcion?: NotaRecepcion;
  notasDisponibles: NotaRecepcion[];
  pedidoId: number;
  /** Pedido completo (moneda, proveedor, cotización): lo necesita el alta de una nota nueva. */
  pedido?: Pedido;
}

export interface DividirItemDialogResult {
  success: boolean;
  notaRecepcionItems?: NotaRecepcionItem[];
  message?: string;
  /** Alguna parte se guardó (o pudo guardarse) y reintentar duplicaría: quien abrió el diálogo recarga (#488). */
  recargar?: boolean;
  /** Se crearon notas desde el diálogo: quien lo abrió recarga las notas aunque no se haya dividido. */
  notasCreadas?: boolean;
}

/** Opción del select que abre el alta de nota; nunca queda como valor de una parte. */
const NOTA_NUEVA = 0;

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
  private dialog = inject(MatDialog);

  /** Notas del pedido elegibles, más las creadas desde este diálogo. */
  private notas: NotaRecepcion[] = [...(this.data.notasDisponibles ?? [])];
  private notasCreadas = false;
  /** Nota de cada parte antes de elegir «Crear Nueva Nota», para devolverla si se cancela el alta. */
  private notaAnterior = new Map<number, number | null>();

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
    this.actualizarOpcionesDeNotas();
  }

  private actualizarOpcionesDeNotas(): void {
    this.notasDisponiblesDisplay = [
      ...opcionesDeNotas(this.notas),
      { value: NOTA_NUEVA, viewValue: '➕ Crear Nueva Nota' },
    ];
  }

  /**
   * «Crear Nueva Nota» abre el alta de nota para cargar número, timbrado, etc. La parte queda con la nota creada; si se
   * cancela, vuelve a la nota que tenía. Antes la opción mandaba 0 y la parte se perdía sin aviso.
   */
  onNotaElegida(index: number, notaRecepcionId: number | null): void {
    if (notaRecepcionId !== NOTA_NUEVA) return;
    const control = this.partes.at(index).controls.notaRecepcionId;
    const anterior = this.notaAnterior.get(index) ?? null;
    control.setValue(anterior);
    const pedido = this.data.pedido ?? this.data.pedidoItem.pedido;
    const dialogData: AddEditNotaRecepcionDialogData = { pedido, isEdit: false, cerrarAlCrear: true };
    this.dialog.open(AddEditNotaRecepcionDialogComponent, {
      data: dialogData,
      width: '80%',
      height: '80%',
      disableClose: true,
      autoFocus: true,
    }).afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((result: AddEditNotaRecepcionDialogResult | undefined) => {
        const nota = result?.nota;
        if (result?.changesMade) this.marcarNotasCreadas();
        if (nota?.id == null) return;
        if (!this.notas.some((n) => n.id === nota.id)) {
          this.notas = [...this.notas, nota];
          this.actualizarOpcionesDeNotas();
        }
        control.setValue(nota.id);
        this.recalcular();
        this.cdr.markForCheck();
      });
  }

  onNotaAbierta(index: number, abierto: boolean): void {
    if (abierto) this.notaAnterior.set(index, this.partes.at(index).controls.notaRecepcionId.value);
  }

  /** Con una nota creada, cerrar con clic afuera la dejaría sin mostrar en el pedido: solo se cierra con los botones. */
  private marcarNotasCreadas(): void {
    this.notasCreadas = true;
    this.dialogRef.disableClose = true;
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
    const todasConNota = this.partes.controls.every((parte) => (parte.controls.notaRecepcionId.value ?? 0) > 0);
    this.puedeGuardar = this.form.valid && todasConNota && this.cantidadAsignada > 0 && !this.isLoading;
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
          if (items.length < input.partes.length) {
            // Nunca un verde si no se guardó todo: antes las partes a «Crear Nueva Nota» se perdían en silencio
            this.dialogRef.close({
              success: false,
              recargar: true,
              notasCreadas: this.notasCreadas,
              message: `Se guardaron ${items.length} de ${input.partes.length} partes. Revisá las notas antes de reintentar.`,
            });
            return;
          }
          // El aviso de éxito lo da quien abrió el diálogo (un solo verde)
          this.dialogRef.close({
            success: true,
            notaRecepcionItems: items,
            message: 'Ítem dividido exitosamente',
            notasCreadas: this.notasCreadas,
          });
        },
        error: (error) => {
          console.error('Error al dividir el ítem:', error);
          this.actualizarCarga(false);
          const cierre = cierreSiNoHuboRespuesta(error, 'se guardaron todas las partes');
          if (cierre) this.dialogRef.close({ ...cierre, notasCreadas: this.notasCreadas });
        },
      });
  }

  private actualizarCarga(cargando: boolean): void {
    this.isLoading = cargando;
    this.recalcular();
    this.cdr.markForCheck();
  }

  onCancelar(): void {
    this.dialogRef.close({ success: false, notasCreadas: this.notasCreadas });
  }
}
