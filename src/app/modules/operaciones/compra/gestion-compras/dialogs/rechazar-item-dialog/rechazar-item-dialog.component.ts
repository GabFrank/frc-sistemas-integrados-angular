import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime } from 'rxjs/operators';

import { PedidoItem } from '../../pedido-item.model';
import { NotaRecepcion } from '../../nota-recepcion.model';
import { NotaRecepcionItem } from '../../nota-recepcion-item.model';
import { NotaRecepcionItemDistribucion } from '../../models/nota-recepcion-item-distribucion.model';
import {
  DestinoRechazoNotaRecepcion,
  RechazarNotaRecepcionItemInput,
  RechazoNotaRecepcionItemResultado,
} from '../../models/rechazar-nota-recepcion-item.model';
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

export interface RechazarItemDialogData {
  pedidoItem: PedidoItem;
  notasDisponibles: NotaRecepcion[];
  pedidoId: number;
  notaPreseleccionada?: number; // ID de la nota preseleccionada (opcional)
  cantidadMaxima?: number; // Cantidad máxima que se puede rechazar (opcional)
  itemToReject?: NotaRecepcionItem; // Ítem específico a rechazar (para rechazo desde nota de recepción)
}

export interface RechazarItemDialogResult {
  success: boolean;
  notaRecepcionItem?: NotaRecepcionItem;
  message?: string;
  /** El ítem se rechazó, pero no todas sus distribuciones: `message` lo explica en vez del éxito (#488). */
  parcial?: boolean;
  /** Algo pudo haberse aplicado y reintentar duplicaría: quien abrió el diálogo recarga (#488). */
  recargar?: boolean;
}

export enum MotivoRechazo {
  VENCIDO = 'VENCIDO',
  AVERIADO = 'AVERIADO',
  FALTANTE = 'FALTANTE',
  OTRO = 'OTRO'
}

/** Valores especiales del select de nota (los demás son ids de nota). */
const NOTA_NUEVA = 0;
const NOTA_RECHAZO = -1;

const MOTIVOS_RECHAZO: OpcionSelect<MotivoRechazo>[] = [
  { value: MotivoRechazo.VENCIDO, viewValue: 'Vencido' },
  { value: MotivoRechazo.AVERIADO, viewValue: 'Averiado' },
  { value: MotivoRechazo.FALTANTE, viewValue: 'Faltante' },
  { value: MotivoRechazo.OTRO, viewValue: 'Otro' },
];

/**
 * Rechazo de un ítem desde la recepción documental. El diálogo solo junta los datos: el central
 * (`rechazarNotaRecepcionItem`) crea la nota si hace falta, parte el ítem en un rechazo parcial y guarda, todo en una
 * transacción. Antes eran varias mutaciones sueltas y un corte a mitad de camino dejaba la nota vacía o el ítem
 * reducido sin su rechazo (#488, #501).
 */
@UntilDestroy()
@Component({
  selector: 'app-rechazar-item-dialog',
  templateUrl: './rechazar-item-dialog.component.html',
  styleUrls: ['./rechazar-item-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RechazarItemDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject<MatDialogRef<RechazarItemDialogComponent, RechazarItemDialogResult>>(MatDialogRef);
  data = inject<RechazarItemDialogData>(MAT_DIALOG_DATA);
  private pedidoService = inject(PedidoService);
  private presentacionService = inject(PresentacionService);
  private notificacionService = inject(NotificacionSnackbarService);
  private dialogosService = inject(DialogosService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('selectPresentacion') selectPresentacion?: MatSelect;
  @ViewChild('selectMotivo') selectMotivo?: MatSelect;
  @ViewChild('inputCantidad') inputCantidad?: ElementRef<HTMLInputElement>;
  @ViewChild('textareaObservaciones') textareaObservaciones?: ElementRef<HTMLTextAreaElement>;

  form!: FormGroup;
  isLoading = false;
  cantidadPendiente = 0;

  presentacionesDisponibles: Presentacion[] = [];
  presentacionSeleccionada: Presentacion | null = null;

  notaPreseleccionada = false;
  cantidadMaxima = 0;
  /** Tope que muestra el campo de cantidad (en unidades base, como siempre). */
  cantidadLimite = 0;

  itemToReject: NotaRecepcionItem | null = null;
  distribucionesDelItem: NotaRecepcionItemDistribucion[] = [];
  tieneDistribuciones = false;
  /**
   * Sin saber si el ítem tiene distribuciones no se rechaza: se saltearía la confirmación (#390).
   */
  distribucionesCargando = false;
  distribucionesFallo = false;

  // Valores precalculados para el template
  titulo = '';
  productoDisplay = '';
  notasDisponiblesDisplay: OpcionSelect<number>[] = [];
  motivosRechazoDisplay = MOTIVOS_RECHAZO;
  cantidadEnUnidadesBaseComputed = 0;
  cantidadPendienteEnPresentacion = 0;
  esNotaRechazoElegida = false;
  puedeGuardar = false;

  ngOnInit(): void {
    this.cantidadPendiente = this.data.pedidoItem.cantidadPendiente || 0;
    this.notaPreseleccionada = !!this.data.notaPreseleccionada;
    this.cantidadMaxima = this.data.cantidadMaxima || 0;
    this.cantidadLimite = this.notaPreseleccionada ? this.cantidadMaxima : this.cantidadPendiente;
    this.itemToReject = this.data.itemToReject || null;
    this.inicializarFormulario();
    this.inicializarOpciones();
    this.recalcular();

    this.cargarPresentaciones();
    this.escucharFormulario();
    if (this.itemToReject) {
      this.cargarDistribucionesDelItem();
    }
  }

  private inicializarFormulario(): void {
    // Cantidad total a rechazar en unidades base: la del ítem, el tope de la nota o lo pendiente del pedido
    if (this.itemToReject) {
      this.cantidadEnUnidadesBaseComputed = this.itemToReject.cantidadEnNota || 0;
    } else if (this.notaPreseleccionada) {
      this.cantidadEnUnidadesBaseComputed = this.cantidadMaxima;
    } else {
      this.cantidadEnUnidadesBaseComputed = this.cantidadPendiente;
    }

    this.form = this.fb.group({
      notaRecepcionId: [this.data.notaPreseleccionada || null, Validators.required],
      presentacionId: [null, Validators.required],
      cantidadRechazada: [null, [Validators.required, Validators.min(0.01)]],
      motivoRechazo: [null, Validators.required],
      observaciones: [''],
    });
    if (this.notaPreseleccionada) {
      // Solo se muestra: la nota viene fijada (se lee con getRawValue)
      this.form.controls['notaRecepcionId'].disable();
    }
  }

  private inicializarOpciones(): void {
    this.productoDisplay = this.data.pedidoItem.producto?.descripcion || 'Producto no disponible';
    this.titulo = `Rechazar Ítem: ${this.productoDisplay}`;
    this.notasDisponiblesDisplay = opcionesDeNotas(this.data.notasDisponibles);
    if (!this.notaPreseleccionada) {
      this.notasDisponiblesDisplay = [
        ...this.notasDisponiblesDisplay,
        { value: NOTA_NUEVA, viewValue: '➕ Crear Nueva Nota' },
        { value: NOTA_RECHAZO, viewValue: '🚫 Crear Nota de Rechazo (Producto no entregado)' },
      ];
    }
  }

  private cargarPresentaciones(): void {
    const productoId = this.data.pedidoItem.producto?.id;
    if (!productoId) return;
    this.presentacionService.onGetPresentacionesPorProductoIdParaDialogo(productoId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (presentaciones) => {
          if (presentaciones == null) {
            return; // Error GraphQL: el servicio ya avisó; sin presentación el formulario no es válido
          }
          this.presentacionesDisponibles = presentaciones;
          const creacionId = this.data.pedidoItem.presentacionCreacion?.id;
          this.presentacionSeleccionada = (creacionId != null
            ? presentaciones.find((p) => p.id === creacionId)
            : null) || presentaciones[0];

          const cantidadPorPresentacion = enPresentacion(this.cantidadEnUnidadesBaseComputed, this.presentacionSeleccionada);
          this.form.patchValue({
            presentacionId: this.presentacionSeleccionada?.id,
            cantidadRechazada: cantidadPorPresentacion,
          });
          this.fijarTopeDeCantidad(cantidadPorPresentacion);
          this.recalcular();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error cargando presentaciones:', error);
          this.notificacionService.openWarn(AVISO_SIN_PRESENTACIONES, 6);
        },
      });
  }

  private escucharFormulario(): void {
    this.form.valueChanges
      .pipe(untilDestroyed(this), debounceTime(100))
      .subscribe(() => {
        this.recalcular();
        this.cdr.markForCheck();
      });

    // Rechazando un ítem concreto, cambiar la presentación recalcula la cantidad (lo que tiene el ítem)
    this.form.controls['presentacionId'].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((presentacionId) => {
        if (!presentacionId || !this.itemToReject) return;
        const presentacion = this.presentacionesDisponibles.find((p) => p.id === presentacionId);
        if (presentacion?.cantidad > 0) {
          const cantidadPorPresentacion = enPresentacion(this.cantidadEnUnidadesBaseComputed, presentacion);
          this.form.patchValue({ cantidadRechazada: cantidadPorPresentacion }, { emitEvent: false });
          this.fijarTopeDeCantidad(cantidadPorPresentacion);
        }
      });
  }

  private fijarTopeDeCantidad(maximo: number): void {
    const control = this.form.controls['cantidadRechazada'];
    control.setValidators([Validators.required, Validators.min(0.01), Validators.max(maximo)]);
    control.updateValueAndValidity();
  }

  /** Valores que muestra el template: se recalculan cuando cambia el formulario o llega un dato. */
  private recalcular(): void {
    const valor = this.form.getRawValue();
    if (valor.presentacionId) {
      this.presentacionSeleccionada = this.presentacionesDisponibles.find((p) => p.id === valor.presentacionId) || null;
    }
    // Antes de cargar las presentaciones se conserva la cantidad inicial (la que se reparte al llegar)
    if (this.presentacionesDisponibles.length > 0) {
      this.cantidadEnUnidadesBaseComputed = aUnidadesBase(valor.cantidadRechazada || 0, this.presentacionSeleccionada);
    }
    this.cantidadPendienteEnPresentacion = enPresentacion(this.cantidadPendiente, this.presentacionSeleccionada);
    this.esNotaRechazoElegida = valor.notaRecepcionId === NOTA_RECHAZO;
    this.puedeGuardar = this.form.valid && !this.isLoading && !this.distribucionesCargando && !this.distribucionesFallo;
  }

  onGuardar(): void {
    this.recalcular();
    if (!this.puedeGuardar) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }
    if (!this.tieneDistribuciones) {
      this.rechazar();
      return;
    }
    this.dialogosService.confirm(
      'Rechazar Ítem con Distribuciones',
      `Este ítem tiene ${this.distribucionesDelItem.length} distribución(es) activa(s).
         Al rechazar el ítem, todas las distribuciones serán automáticamente rechazadas.
         ¿Desea continuar?`
    ).pipe(untilDestroyed(this)).subscribe((confirmado) => {
      if (confirmado) {
        this.rechazar();
      }
    });
  }

  private rechazar(): void {
    this.actualizarCarga(true);
    this.pedidoService.onRechazarNotaRecepcionItem(this.armarInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (resultado) => this.finalizarRechazo(resultado),
        error: (error) => {
          console.error('Error al rechazar el ítem:', error);
          this.actualizarCarga(false);
          const cierre = cierreSiNoHuboRespuesta(error, 'se rechazó el ítem');
          if (cierre) this.dialogRef.close(cierre);
        },
      });
  }

  private armarInput(): RechazarNotaRecepcionItemInput {
    const valor = this.form.getRawValue();
    return {
      pedidoItemId: this.itemToReject ? undefined : this.data.pedidoItem.id,
      notaRecepcionItemId: this.itemToReject?.id,
      destino: this.destinoElegido(valor.notaRecepcionId),
      notaRecepcionId: valor.notaRecepcionId > 0 ? valor.notaRecepcionId : undefined,
      presentacionId: this.presentacionSeleccionada?.id,
      cantidad: valor.cantidadRechazada,
      motivoRechazo: valor.motivoRechazo,
      observacion: valor.observaciones,
    };
  }

  private destinoElegido(notaRecepcionId: number): DestinoRechazoNotaRecepcion {
    if (this.notaPreseleccionada) return DestinoRechazoNotaRecepcion.NOTA_EXISTENTE;
    if (notaRecepcionId === NOTA_NUEVA) return DestinoRechazoNotaRecepcion.NOTA_NUEVA;
    if (notaRecepcionId === NOTA_RECHAZO) return DestinoRechazoNotaRecepcion.NOTA_RECHAZO;
    return DestinoRechazoNotaRecepcion.NOTA_EXISTENTE;
  }

  private finalizarRechazo(resultado: RechazoNotaRecepcionItemResultado | null): void {
    this.actualizarCarga(false);
    if (resultado == null) return; // el genérico ya avisó
    const cantidadBase = resultado.cantidadEnUnidadesBase ?? this.cantidadEnUnidadesBaseComputed;
    const message = this.tieneDistribuciones
      ? `Ítem rechazado exitosamente. ${this.distribucionesDelItem.length} distribución(es) rechazada(s) automáticamente.`
      : `Ítem rechazado exitosamente. Cantidad rechazada: ${cantidadBase} unidades base`;
    this.dialogRef.close({ success: true, notaRecepcionItem: resultado.notaRecepcionItem ?? undefined, message });
  }

  private actualizarCarga(cargando: boolean): void {
    this.isLoading = cargando;
    this.recalcular();
    this.cdr.markForCheck();
  }

  onCancelar(): void {
    this.dialogRef.close({ success: false });
  }

  // Navegación por teclado: Enter pasa al campo siguiente
  onNotaRecepcionKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    this.abrirSelect(this.selectPresentacion);
  }

  onPresentacionKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    this.inputCantidad?.nativeElement.focus();
  }

  onCantidadKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    this.abrirSelect(this.selectMotivo);
  }

  onMotivoKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    this.textareaObservaciones?.nativeElement.focus();
  }

  onObservacionesKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    this.onGuardar();
  }

  onMotivoSelectionChange(): void {
    // Elegido el motivo, se pasa a las observaciones (después de que cierre el panel)
    setTimeout(() => this.textareaObservaciones?.nativeElement.focus(), 100);
  }

  private abrirSelect(select?: MatSelect): void {
    if (!select) return;
    select.focus();
    select.open();
  }

  reintentarDistribuciones(): void {
    this.cargarDistribucionesDelItem();
  }

  private cargarDistribucionesDelItem(): void {
    const itemId = this.itemToReject?.id;
    if (!itemId) return;
    this.distribucionesCargando = true;
    this.distribucionesFallo = false;
    this.recalcular();
    this.pedidoService.onGetNotaRecepcionItemDistribucionesByNotaRecepcionItemId(itemId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (distribuciones) => {
          this.distribucionesCargando = false;
          if (distribuciones == null) {
            // Error GraphQL: el servicio ya avisó
            this.distribucionesFallo = true;
          } else {
            this.distribucionesDelItem = distribuciones;
            this.tieneDistribuciones = distribuciones.length > 0;
            if (this.tieneDistribuciones) {
              this.mostrarInfoDistribuciones();
            }
          }
          this.recalcular();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error al cargar distribuciones del ítem:', error);
          // No es «sin distribuciones»: se bloquea el rechazo hasta poder verlas
          this.distribucionesCargando = false;
          this.distribucionesFallo = true;
          this.recalcular();
          this.cdr.markForCheck();
          this.notificacionService.openWarn('No se pudieron cargar las distribuciones del ítem: usá «Reintentar» antes de rechazar.', 6);
        },
      });
  }

  private mostrarInfoDistribuciones(): void {
    const detalle = this.distribucionesDelItem
      .map((d) => `${d.sucursalEntrega?.nombre || 'Sucursal'}: ${d.cantidad || 0} unidades`)
      .join('\n');
    this.notificacionService.openWarn(
      `Este ítem tiene ${this.distribucionesDelItem.length} distribución(es) activa(s):\n${detalle}\n\nTodas serán rechazadas automáticamente al rechazar el ítem.`
    );
  }
}
