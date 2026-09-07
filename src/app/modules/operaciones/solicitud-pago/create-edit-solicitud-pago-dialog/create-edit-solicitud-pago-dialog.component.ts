import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { SolicitudPagoService } from '../../compra/gestion-compras/solicitud-pago.service';
import { SolicitudPago, SolicitudPagoInput, SolicitudPagoEstado, SolicitudPagoDetalle, SolicitudPagoDetalleInput } from '../../compra/gestion-compras/solicitud-pago.model';
import { NotaRecepcion } from '../../compra/gestion-compras/nota-recepcion.model';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { FormaPago } from '../../../financiero/forma-pago/forma-pago.model';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { FormaPagoService } from '../../../financiero/forma-pago/forma-pago.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ProveedorService } from '../../../personas/proveedor/proveedor.service';
import { MainService } from '../../../../main.service';
import { AdicionarNotaDialogComponent } from '../adicionar-nota-dialog/adicionar-nota-dialog.component';
import { AdicionarFormaPagoDialogComponent } from '../adicionar-forma-pago-dialog/adicionar-forma-pago-dialog.component';

/** Nota de recepción con los campos de display que consume la tabla del diálogo. */
export type NotaRecepcionConDisplay = NotaRecepcion & {
  proveedorNombreDisplay?: string;
  pedidoMonedaDisplay?: string;
  pedidoFormaPagoDisplay?: string;
  pedidoPlazoDisplay?: string;
  pedidoObservacionDisplay?: string;
};

export interface CreateEditSolicitudPagoDialogData {
  /** Proveedor completo (preferido): se usa su nombre real en el campo Proveedor. */
  proveedor?: Proveedor;
  /** Alternativa cuando solo se conoce el id del proveedor. */
  proveedorId?: number;
  /** Notas de recepción que ya vienen elegidas al abrir (ej.: desde el tab del pedido). */
  notasPrecargadas?: NotaRecepcion[];
  /** Solicitud existente para ver/editar. */
  solicitudPago?: SolicitudPago;
}

@Component({
  selector: 'app-create-edit-solicitud-pago-dialog',
  templateUrl: './create-edit-solicitud-pago-dialog.component.html',
  styleUrls: ['./create-edit-solicitud-pago-dialog.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class CreateEditSolicitudPagoDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('proveedorInput') proveedorInput: ElementRef<HTMLInputElement>;

  form: FormGroup;
  selectedProveedor: Proveedor;
  monedaList: Moneda[] = [];
  formaPagoList: FormaPago[] = [];
  /** Notas con display de proveedor y datos de pedido para la tabla (sin usar funciones en template). */
  notasAgregadas: NotaRecepcionConDisplay[] = [];
  /**
   * DataSource de la tabla de notas. Es obligatorio: un array pelado como [dataSource]
   * se renderiza una sola vez y el CDK no ve los push/splice sobre la misma referencia,
   * así que al quitar o agregar una nota la tabla quedaba desactualizada.
   */
  notasTableDataSource = new MatTableDataSource<NotaRecepcionConDisplay>([]);

  /** Detalles (formas de pago) con display para la tabla. */
  detallesAgregados: (SolicitudPagoDetalleInput & { monedaDenominacion?: string; formaPagoDescripcion?: string })[] = [];
  /** DataSource de la tabla de formas de pago para que mat-table detecte cambios al agregar/editar. */
  detallesTableDataSource = new MatTableDataSource<SolicitudPagoDetalleInput & { monedaDenominacion?: string; formaPagoDescripcion?: string }>([]);

  proveedorNombreDisplay = '';
  montoTotalComputed = 0;
  totalFormasPagoComputed = 0;
  saving = false;

  /** Modo edición: true cuando se abre con solicitudPago existente. */
  isEditMode = false;
  /** Solo PENDIENTE permite editar. CANCELADO, CONCLUIDO, PARCIAL = solo lectura. */
  isEditable = false;
  /** Estado de la solicitud (cuando está en modo edición) para habilitar Editar forma de pago solo en PENDIENTE o PARCIAL. */
  solicitudPagoEstado: SolicitudPagoEstado | null = null;
  tituloDialogo = 'Nueva solicitud de pago';
  solicitudPagoId: number;

  /** Resumen por moneda (solo monedas presentes en detallesAgregados) para el card. */
  resumenPorMonedaComputed: { monedaDenominacion: string; total: number }[] = [];
  /** Total convertido a Guaraníes usando cotización por detalle o moneda.cambio. */
  totalEnGuaraniesComputed = 0;

  /** Resumen por moneda de las notas agregadas (multi-currency). */
  resumenPorMonedaNotasComputed: {
    monedaDenominacion: string;
    simbolo: string;
    total: number;
    totalEnGs: number;
    format: string;
  }[] = [];
  /** Total de notas convertido a Gs usando `nota.cotizacion` (fallback `moneda.cambio`). */
  totalNotasGsEquivalenteComputed = 0;
  /** True si las notas agregadas mezclan más de una moneda. */
  tieneMonedasMixtasNotas = false;

  /** Diferencia entre lo a pagar (notas Gs equiv) y lo cubierto (formas Gs equiv). */
  diferenciaGsComputed = 0;
  /** "cubre" | "exceso" | "falta" — para color/icono del panel de balance. */
  diferenciaEstadoComputed: 'cubre' | 'exceso' | 'falta' = 'falta';
  /** true si se puede editar una forma de pago (solicitud nueva, PENDIENTE o PARCIAL). */
  puedeEditarFormaPagoComputed = false;
  /** true si se puede cambiar el proveedor; solo cuando no hay notas ni formas de pago agregadas. */
  puedeEditarProveedorComputed = false;
  /** true si se puede "Solicitar" (PENDIENTE → SOLICITADO): en edición, borrador y con al menos una nota. */
  puedeSolicitar = false;
  /** true si la solicitud está SOLICITADA (validada, read-only, con opción Reabrir). */
  esSolicitado = false;

  displayedColumnsNotas: string[] = ['numero', 'fecha', 'monedaNota', 'valorTotal', 'moneda', 'formaPago', 'plazo', 'quitar'];
  displayedColumnsDetalles: string[] = ['moneda', 'formaPago', 'valor', 'fechaPago', 'acciones'];

  /** Fila de nota expandida para mostrar observación del pedido. */
  expandedNota: NotaRecepcion | null = null;
  /** Mapa id nota -> true si tiene observación de forma de pago (para clase CSS sin funciones en template). */
  notaTieneObservacionMap: Record<number, boolean> = {};

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateEditSolicitudPagoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateEditSolicitudPagoDialogData,
    private solicitudPagoService: SolicitudPagoService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private monedaService: MonedaService,
    private formaPagoService: FormaPagoService,
    private dialog: MatDialog,
    private proveedorService: ProveedorService,
    private mainService: MainService
  ) {
    this.form = this.fb.group({
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    if (this.data?.solicitudPago) {
      this.isEditMode = true;
      this.solicitudPagoId = this.data.solicitudPago.id;
      this.solicitudPagoEstado = this.data.solicitudPago.estado ?? null;
      this.isEditable = this.data.solicitudPago.estado === SolicitudPagoEstado.PENDIENTE;
      this.tituloDialogo = this.isEditable ? 'Editar solicitud de pago' : 'Ver solicitud de pago';
      this.updatePuedeEditarFormaPago();
      this.loadSolicitudParaEdicion();
    } else {
      this.isEditable = true;
      this.puedeEditarFormaPagoComputed = true;
      if (this.data?.proveedor?.id) {
        this.selectedProveedor = this.data.proveedor;
        this.proveedorNombreDisplay = (this.data.proveedor?.persona?.nombre || '').toString().toUpperCase();
      } else if (this.data?.proveedorId) {
        this.selectedProveedor = { id: this.data.proveedorId, persona: { nombre: '' } } as Proveedor;
        this.proveedorNombreDisplay = 'Proveedor preseleccionado';
      }
      this.precargarNotas(this.data?.notasPrecargadas);
      this.updatePuedeEditarProveedor();
    }
    this.loadMonedas();
    this.loadFormasPago();
  }

  private loadSolicitudParaEdicion(): void {
    this.solicitudPagoService.onGetById(this.solicitudPagoId).subscribe({
      next: (sp: SolicitudPago) => {
        this.selectedProveedor = sp.proveedor;
        this.solicitudPagoEstado = sp.estado ?? null;
        this.proveedorNombreDisplay = (sp?.proveedor?.persona?.nombre || '').toString().toUpperCase();
        this.form.patchValue({
          observaciones: sp.observaciones || ''
        });
        if (sp.notasRecepcion?.length) {
          this.notasAgregadas = sp.notasRecepcion.map((nr) => this.withProveedorDisplay(nr.notaRecepcion));
          this.updateNotasDisplay();
          this.updateMontoTotal();
        }
        if (sp.detalles?.length) {
          this.detallesAgregados = sp.detalles.map((d) => ({
            id: d.id,
            monedaId: d.moneda?.id,
            formaPagoId: d.formaPago?.id,
            valor: d.valor,
            fechaPago: d.fechaPago,
            observacion: d.observacion,
            cotizacion: d.cotizacion,
            orden: d.orden,
            fechaEmisionCheque: d.fechaEmisionCheque,
            portador: d.portador,
            nominal: d.nominal,
            diferido: d.diferido,
            monedaDenominacion: (d.moneda?.denominacion || '').toString().toUpperCase(),
            formaPagoDescripcion: (d.formaPago?.descripcion || '').toString().toUpperCase()
          }));
          this.detallesTableDataSource.data = this.detallesAgregados;
          this.updateTotalFormasPago();
          this.updateResumenFormasPago();
        }
        if (!this.isEditable) {
          this.form.disable();
        }
        this.updatePuedeEditarFormaPago();
        this.updatePuedeEditarProveedor();
      },
      error: () => {
        this.notificacionService.openAlgoSalioMal('Error al cargar la solicitud');
        this.dialogRef.close(false);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.data?.proveedorId) {
      setTimeout(() => this.proveedorInput?.nativeElement?.focus(), 0);
    }
  }

  private loadMonedas(): void {
    this.monedaService.onGetAll().subscribe((list) => {
      this.monedaList = list || [];
      if (this.detallesAgregados?.length) {
        this.updateResumenFormasPago();
      }
    });
  }

  private loadFormasPago(): void {
    this.formaPagoService.onGetAllFormaPago(true).subscribe((list) => {
      this.formaPagoList = list || [];
    });
  }

  onProveedorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' || event.key === 'Escape') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const char = this.getPrintableKey(event);
    this.onBuscarProveedor(char);
  }

  private getPrintableKey(event: KeyboardEvent): string {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return '';
    }
    if (event.key?.length === 1) {
      return event.key;
    }
    return '';
  }

  onBuscarProveedor(initialTexto?: string): void {
    const texto = initialTexto != null ? initialTexto : (this.proveedorNombreDisplay || '');
    this.proveedorService
      .onSearchProveedorPorTexto(texto)
      .subscribe((proveedor: Proveedor) => {
        if (proveedor) {
          this.selectedProveedor = proveedor;
          this.proveedorNombreDisplay = (proveedor?.persona?.nombre || '').toString().toUpperCase();
        }
      });
  }

  onAgregarNota(): void {
    if (!this.selectedProveedor?.id) {
      this.notificacionService.openWarn('Seleccione un proveedor');
      return;
    }
    const idsAntes = new Set(this.notasAgregadas.map((n) => n.id));
    const ref = this.dialog.open(AdicionarNotaDialogComponent, {
      width: '50vw',
      data: {
        proveedorId: this.selectedProveedor.id,
        notasYaAgregadasIds: this.notasAgregadas.map((n) => n.id)
      }
    });
    ref.afterClosed().subscribe((notas: NotaRecepcion[] | null) => {
      if (!notas?.length) return;
      const newNotas: NotaRecepcionConDisplay[] = [];
      notas.forEach((nota) => {
        if (!idsAntes.has(nota.id)) {
          const notaWithDisplay = this.withProveedorDisplay(nota);
          this.notasAgregadas.push(notaWithDisplay);
          newNotas.push(notaWithDisplay);
        }
      });
      if (newNotas.length === 0) return;
      this.updateNotasDisplay();
      this.updateMontoTotal();
      this.updatePuedeEditarProveedor();
      if (this.solicitudPagoId != null) {
        this.saving = true;
        const queue = newNotas.map((nota) =>
          this.solicitudPagoService.onAgregarNotaASolicitudPago(
            this.solicitudPagoId,
            nota.id,
            nota.valorTotal ?? 0
          )
        );
        let done = 0;
        const total = queue.length;
        queue.forEach((obs) => {
          obs.subscribe({
            next: () => {
              done++;
              if (done === total) this.saving = false;
            },
            error: () => {
              this.notificacionService.openAlgoSalioMal('Error al vincular nota');
              this.saving = false;
            }
          });
        });
      } else {
        this.crearSolicitudYActivarEdicion();
      }
    });
  }

  onQuitarNota(index: number): void {
    const nota = this.notasAgregadas[index];
    if (!nota) return;
    const textoNota = nota.numero != null ? `la nota Nº ${nota.numero}` : 'esta nota de recepción';
    this.dialogosService
      .confirm('Eliminar nota de recepción', `¿Está seguro de que desea quitar ${textoNota} de la solicitud?`)
      .subscribe((confirmed) => {
        if (!confirmed) return;
        if (this.solicitudPagoId != null) {
          this.saving = true;
          this.solicitudPagoService.onRemoverNotaDeSolicitudPago(this.solicitudPagoId, nota.id).subscribe({
            next: () => {
              this.notasAgregadas.splice(index, 1);
              this.refrescarTablaNotas();
              this.updateMontoTotal();
              this.updatePuedeEditarProveedor();
              this.saving = false;
            },
            error: () => {
              this.notificacionService.openAlgoSalioMal('No se pudo desvincular la nota');
              this.saving = false;
            }
          });
        } else {
          this.notasAgregadas.splice(index, 1);
          this.refrescarTablaNotas();
          this.updateMontoTotal();
          this.updatePuedeEditarProveedor();
        }
      });
  }

  onAgregarFormaPago(): void {
    if (!this.selectedProveedor?.id) {
      this.notificacionService.openWarn('Seleccione un proveedor');
      return;
    }
    if (!this.solicitudPagoId && this.notasAgregadas.length < 1) {
      this.notificacionService.openWarn('Agregue al menos una nota de recepción antes de agregar forma de pago');
      return;
    }
    const ref = this.dialog.open(AdicionarFormaPagoDialogComponent, {
      width: '50vw',
      data: {
        monedaList: this.monedaList,
        formaPagoList: this.formaPagoList,
        proveedorNombre: this.proveedorNombreDisplay,
        proveedor: this.selectedProveedor ?? undefined,
        montoSugerido: Math.max(0, this.montoTotalComputed - this.totalEnGuaraniesComputed),
        solicitudPagoId: this.isEditMode ? this.solicitudPagoId : undefined
      }
    });
    ref.afterClosed().subscribe((detalles: (SolicitudPagoDetalleInput & { monedaDenominacion?: string; formaPagoDescripcion?: string })[] | null) => {
      // El diálogo devuelve un array: 1 forma, o N (una por cheque si se eligieron cuotas).
      if (!detalles?.length) return;
      detalles.forEach((detalle) => {
        this.detallesAgregados.push({
          ...detalle,
          monedaDenominacion: detalle.monedaDenominacion ?? (this.monedaList.find((m) => m.id === detalle.monedaId)?.denominacion || '').toString().toUpperCase(),
          formaPagoDescripcion: detalle.formaPagoDescripcion ?? (this.formaPagoList.find((f) => f.id === detalle.formaPagoId)?.descripcion || '').toString().toUpperCase()
        });
      });
      this.detallesTableDataSource.data = this.detallesAgregados;
      this.updateTotalFormasPago();
      this.updateResumenFormasPago();
      this.updatePuedeEditarProveedor();
      // En modo edición el diálogo ya guardó en backend; no volver a llamar a la API para evitar duplicado.
      if (this.solicitudPagoId != null) return;
      this.crearSolicitudYActivarEdicion();
    });
  }

  onEditarDetalle(detalle: (SolicitudPagoDetalleInput & { monedaDenominacion?: string; formaPagoDescripcion?: string }), index: number): void {
    if (!this.puedeEditarFormaPagoComputed) return;
    const ref = this.dialog.open(AdicionarFormaPagoDialogComponent, {
      width: '50vw',
      data: {
        monedaList: this.monedaList,
        formaPagoList: this.formaPagoList,
        proveedorNombre: this.proveedorNombreDisplay,
        proveedor: this.selectedProveedor ?? undefined,
        montoSugerido: Math.max(0, this.montoTotalComputed - this.totalEnGuaraniesComputed) + this.getValorDetalleEnGuaranies(detalle),
        solicitudPagoId: this.isEditMode && this.solicitudPagoId != null ? this.solicitudPagoId : undefined,
        detalleExistente: detalle
      }
    });
    ref.afterClosed().subscribe((resultado: (SolicitudPagoDetalleInput & { monedaDenominacion?: string; formaPagoDescripcion?: string })[] | (SolicitudPagoDetalleInput & { monedaDenominacion?: string; formaPagoDescripcion?: string }) | null) => {
      // El diálogo de edición devuelve un array de 1 (la forma editada).
      const actualizado = Array.isArray(resultado) ? resultado[0] : resultado;
      if (!actualizado) return;
      const row = {
        ...actualizado,
        monedaDenominacion: actualizado.monedaDenominacion ?? (this.monedaList.find((m) => m.id === actualizado.monedaId)?.denominacion || '').toString().toUpperCase(),
        formaPagoDescripcion: actualizado.formaPagoDescripcion ?? (this.formaPagoList.find((f) => f.id === actualizado.formaPagoId)?.descripcion || '').toString().toUpperCase()
      };
      if (detalle.id != null && this.solicitudPagoId != null) {
        this.saving = true;
        this.solicitudPagoService.onEliminarSolicitudPagoDetalle(detalle.id).subscribe({
          next: () => {
            const detalleInput: SolicitudPagoDetalleInput = {
              monedaId: actualizado.monedaId,
              formaPagoId: actualizado.formaPagoId,
              valor: actualizado.valor,
              fechaPago: actualizado.fechaPago,
              observacion: actualizado.observacion,
              cotizacion: actualizado.cotizacion,
              orden: actualizado.orden,
              fechaEmisionCheque: actualizado.fechaEmisionCheque,
              portador: actualizado.portador,
              nominal: actualizado.nominal,
              diferido: actualizado.diferido
            };
            this.solicitudPagoService.onAgregarSolicitudPagoDetalle(this.solicitudPagoId, detalleInput).subscribe({
              next: (res: any) => {
                if (res?.id != null) {
                  row.id = res.id;
                }
                this.detallesAgregados[index] = row;
                this.detallesTableDataSource.data = this.detallesAgregados;
                this.updateTotalFormasPago();
                this.updateResumenFormasPago();
                this.saving = false;
              },
              error: () => {
                this.notificacionService.openAlgoSalioMal('Error al actualizar la forma de pago');
                this.saving = false;
              }
            });
          },
          error: () => {
            this.notificacionService.openAlgoSalioMal('No se pudo eliminar la forma de pago anterior');
            this.saving = false;
          }
        });
      } else {
        this.detallesAgregados[index] = row;
        this.detallesTableDataSource.data = this.detallesAgregados;
        this.updateTotalFormasPago();
        this.updateResumenFormasPago();
      }
    });
  }

  onQuitarDetalle(index: number): void {
    const detalle = this.detallesAgregados[index];
    if (!detalle) return;
    const descripcion = detalle.formaPagoDescripcion
      ? `${detalle.formaPagoDescripcion} - ${detalle.valor != null ? detalle.valor : ''}`
      : 'esta forma de pago';
    this.dialogosService
      .confirm(
        'Eliminar forma de pago',
        `¿Está seguro de que desea eliminar ${descripcion}?`
      )
      .subscribe((confirmed) => {
        if (!confirmed) return;
        const tieneId = detalle.id != null && this.isEditMode;
        if (tieneId) {
          this.solicitudPagoService.onEliminarSolicitudPagoDetalle(detalle.id).subscribe({
            next: () => {
              this.detallesAgregados = this.detallesAgregados.filter((_, i) => i !== index);
              this.detallesTableDataSource.data = this.detallesAgregados;
              this.updateTotalFormasPago();
              this.updateResumenFormasPago();
              this.updatePuedeEditarProveedor();
            },
            error: () => {
              this.notificacionService.openAlgoSalioMal('No se pudo eliminar la forma de pago');
            }
          });
        } else {
          this.detallesAgregados = this.detallesAgregados.filter((_, i) => i !== index);
          this.detallesTableDataSource.data = this.detallesAgregados;
          this.updateTotalFormasPago();
          this.updateResumenFormasPago();
          this.updatePuedeEditarProveedor();
        }
      });
  }

  private updatePuedeEditarFormaPago(): void {
    if (!this.isEditMode || this.solicitudPagoEstado == null) {
      this.puedeEditarFormaPagoComputed = true;
      return;
    }
    this.puedeEditarFormaPagoComputed =
      this.solicitudPagoEstado === SolicitudPagoEstado.PENDIENTE ||
      this.solicitudPagoEstado === SolicitudPagoEstado.PARCIAL;
  }

  /** Solo permite editar proveedor cuando no hay notas ni formas de pago (las notas dependen del proveedor). */
  private updatePuedeEditarProveedor(): void {
    this.puedeEditarProveedorComputed =
      this.isEditable &&
      this.notasAgregadas.length === 0 &&
      this.detallesAgregados.length === 0;
    this.updateEstadoAcciones();
  }

  /** Recalcula la visibilidad de las acciones Solicitar / Reabrir según estado + notas. */
  private updateEstadoAcciones(): void {
    this.esSolicitado = this.solicitudPagoEstado === SolicitudPagoEstado.SOLICITADO;
    this.puedeSolicitar =
      this.isEditMode &&
      this.solicitudPagoEstado === SolicitudPagoEstado.PENDIENTE &&
      this.notasAgregadas.length >= 1;
  }

  /** Solicitar: valida la solicitud (borrador → SOLICITADO, lista para pagar). */
  onSolicitar(): void {
    if (!this.puedeSolicitar || this.solicitudPagoId == null) return;
    this.dialogosService
      .confirm('Solicitar pago', 'La solicitud quedará lista para pagar (Solicitado). ¿Continuar?')
      .subscribe((ok) => {
        if (!ok) return;
        this.saving = true;
        this.solicitudPagoService.onActualizarEstado(this.solicitudPagoId, SolicitudPagoEstado.SOLICITADO).subscribe({
          next: () => {
            this.notificacionService.openSucess('Solicitud lista para pagar (Solicitado)');
            this.dialogRef.close(true);
          },
          error: () => {
            this.saving = false;
            this.notificacionService.openAlgoSalioMal('No se pudo solicitar');
          }
        });
      });
  }

  /** Reabrir: SOLICITADO → PENDIENTE (borrador editable), in-place. */
  onReabrir(): void {
    if (!this.esSolicitado || this.solicitudPagoId == null) return;
    this.dialogosService
      .confirm('Reabrir solicitud', 'Volverá a borrador (Pendiente) y podrá editarse. ¿Continuar?')
      .subscribe((ok) => {
        if (!ok) return;
        this.saving = true;
        this.solicitudPagoService.onActualizarEstado(this.solicitudPagoId, SolicitudPagoEstado.PENDIENTE).subscribe({
          next: () => {
            this.saving = false;
            this.solicitudPagoEstado = SolicitudPagoEstado.PENDIENTE;
            this.isEditable = true;
            this.tituloDialogo = 'Editar solicitud de pago';
            this.form.enable();
            this.updatePuedeEditarFormaPago();
            this.updatePuedeEditarProveedor();
            this.notificacionService.openSucess('Solicitud reabierta (Pendiente)');
          },
          error: () => {
            this.saving = false;
            this.notificacionService.openAlgoSalioMal('No se pudo reabrir');
          }
        });
      });
  }

  private updateResumenFormasPago(): void {
    const mapByMoneda: Record<string, number> = {};
    let totalGs = 0;
    const detalles = this.detallesAgregados || [];
    for (const d of detalles) {
      const denom = (d.monedaDenominacion || '').toString().toUpperCase().trim();
      const key = denom || 'SIN_MONEDA';
      mapByMoneda[key] = (mapByMoneda[key] || 0) + (d.valor ?? 0);
      const esGuarani = denom === 'GUARANI' || denom === 'GS' || (denom.length > 0 && denom.includes('GUARANI'));
      const moneda = this.monedaList.find((m) => m.id === d.monedaId);
      const cotizacion = d.cotizacion != null ? Number(d.cotizacion) : moneda?.cambio;
      if (esGuarani) {
        totalGs += d.valor ?? 0;
      } else {
        const rate = cotizacion != null && !isNaN(cotizacion) ? cotizacion : 0;
        totalGs += (d.valor ?? 0) * rate;
      }
    }
    this.resumenPorMonedaComputed = Object.keys(mapByMoneda).map((k) => ({
      monedaDenominacion: k === 'SIN_MONEDA' ? '-' : k,
      total: mapByMoneda[k]
    }));
    this.totalEnGuaraniesComputed = Math.round(totalGs);
    this.updateDiferencia();
  }

  /** Valor de un detalle convertido a Guaraníes (para calcular monto sugerido en edición). */
  private getValorDetalleEnGuaranies(d: SolicitudPagoDetalleInput & { monedaDenominacion?: string }): number {
    const denom = (d.monedaDenominacion || '').toString().toUpperCase().trim();
    const esGuarani = denom === 'GUARANI' || denom === 'GS' || (denom.length > 0 && denom.includes('GUARANI'));
    if (esGuarani) return d.valor ?? 0;
    const moneda = this.monedaList.find((m) => m.id === d.monedaId);
    const cotizacion = d.cotizacion != null ? Number(d.cotizacion) : moneda?.cambio;
    const tasa = cotizacion != null && !isNaN(cotizacion) ? cotizacion : 0;
    return (d.valor ?? 0) * tasa;
  }

  private updateTotalFormasPago(): void {
    this.totalFormasPagoComputed = this.detallesAgregados.reduce((sum, d) => sum + (d.valor ?? 0), 0);
  }

  /** Vuelca notasAgregadas en la tabla. Llamar tras cada alta o baja de notas. */
  private refrescarTablaNotas(): void {
    this.notasTableDataSource.data = this.notasAgregadas;
  }

  /** Marca la nota con el nombre del proveedor que muestra la tabla. El resto de los display los completa updateNotasDisplay(). */
  private withProveedorDisplay(nota: NotaRecepcion): NotaRecepcionConDisplay {
    const notaConDisplay = nota as NotaRecepcionConDisplay;
    notaConDisplay.proveedorNombreDisplay = (nota?.pedido?.proveedor?.persona?.nombre ?? '').toString().toUpperCase();
    return notaConDisplay;
  }

  /**
   * Carga notas ya elegidas al abrir el diálogo (ej.: las del pedido desde el tab Solicitud de Pago).
   * No persiste nada: la solicitud recién se crea al agregar una forma de pago o al Guardar.
   */
  private precargarNotas(notas: NotaRecepcion[] | undefined): void {
    if (!notas?.length) return;
    const yaAgregadas = new Set(this.notasAgregadas.map((n) => n.id));
    notas.forEach((nota) => {
      if (nota?.id == null || yaAgregadas.has(nota.id)) return;
      yaAgregadas.add(nota.id);
      this.notasAgregadas.push(this.withProveedorDisplay(nota));
    });
    this.updateNotasDisplay();
    this.updateMontoTotal();
  }

  private updateMontoTotal(): void {
    const mapByMoneda: Record<string, { simbolo: string; total: number; totalEnGs: number; format: string }> = {};
    let totalGs = 0;
    for (const n of this.notasAgregadas) {
      const valor = n.valorTotal ?? (n as any).valor ?? 0;
      const moneda: any = (n as any).moneda;
      const denom = (moneda?.denominacion || 'GUARANI').toString().toUpperCase().trim();
      const esGs = denom === 'GUARANI' || denom === 'GS' || denom.includes('GUARANI');
      const cot = (n as any).cotizacion ?? moneda?.cambio ?? 1;
      const valorEnGs = esGs ? valor : valor * (cot || 0);
      if (!mapByMoneda[denom]) {
        mapByMoneda[denom] = {
          simbolo: moneda?.simbolo || (esGs ? 'Gs.' : ''),
          total: 0,
          totalEnGs: 0,
          format: esGs ? '1.0-0' : '1.2-2'
        };
      }
      mapByMoneda[denom].total += valor;
      mapByMoneda[denom].totalEnGs += valorEnGs;
      totalGs += valorEnGs;
    }
    this.resumenPorMonedaNotasComputed = Object.entries(mapByMoneda).map(([den, info]) => ({
      monedaDenominacion: den,
      simbolo: info.simbolo,
      total: info.total,
      totalEnGs: Math.round(info.totalEnGs),
      format: info.format
    }));
    this.totalNotasGsEquivalenteComputed = Math.round(totalGs);
    // montoTotalComputed se mantiene en Gs equivalente para que el cálculo del monto sugerido
    // de forma de pago (totalEnGuaraniesComputed ya viene en Gs) sea coherente.
    this.montoTotalComputed = this.totalNotasGsEquivalenteComputed;
    this.tieneMonedasMixtasNotas = this.resumenPorMonedaNotasComputed.length > 1;
    this.updateDiferencia();
  }

  /** Compara totales Gs equivalente — recalcula color/estado del panel de balance. */
  private updateDiferencia(): void {
    const aPagar = this.totalNotasGsEquivalenteComputed || 0;
    const cubierto = this.totalEnGuaraniesComputed || 0;
    this.diferenciaGsComputed = cubierto - aPagar;
    // Tolerancia 1 Gs por redondeos cross-currency.
    if (Math.abs(this.diferenciaGsComputed) <= 1) {
      this.diferenciaEstadoComputed = 'cubre';
    } else if (this.diferenciaGsComputed > 0) {
      this.diferenciaEstadoComputed = 'exceso';
    } else {
      this.diferenciaEstadoComputed = 'falta';
    }
  }

  /** Rellena propiedades de display de pedido (moneda, formaPago, plazo, observación) para la tabla de notas. */
  private updateNotasDisplay(): void {
    const map: Record<number, boolean> = {};
    this.notasAgregadas.forEach((nota) => {
      const ped = nota?.pedido;
      const n = nota as NotaRecepcion & {
        pedidoMonedaDisplay?: string;
        pedidoFormaPagoDisplay?: string;
        pedidoPlazoDisplay?: string;
        pedidoObservacionDisplay?: string;
        notaMonedaDisplay?: string;
        notaSimboloDisplay?: string;
        notaDecimalFormatDisplay?: string;
      };
      n.pedidoMonedaDisplay = (ped?.moneda?.denominacion ?? ped?.moneda?.simbolo ?? '-').toString().toUpperCase();
      n.pedidoFormaPagoDisplay = (ped?.formaPago?.descripcion ?? '-').toString().toUpperCase();
      n.pedidoPlazoDisplay = ped?.plazoCredito != null ? String(ped.plazoCredito) : '-';
      n.pedidoObservacionDisplay = (ped?.observacionFormaPago ?? '').toString().trim();
      // Display de la moneda propia de la nota (no del pedido) para tabla.
      const notaMonedaDenom = (nota as any)?.moneda?.denominacion;
      const notaMonedaSim = (nota as any)?.moneda?.simbolo;
      const denomUpper = (notaMonedaDenom || '').toString().toUpperCase().trim();
      const esGs = denomUpper === 'GUARANI' || denomUpper === 'GS' || denomUpper.includes('GUARANI');
      n.notaMonedaDisplay = (notaMonedaDenom ?? '-').toString().toUpperCase();
      n.notaSimboloDisplay = notaMonedaSim || (esGs ? 'Gs.' : '');
      n.notaDecimalFormatDisplay = esGs ? '1.0-0' : '1.0-2';
      map[nota.id] = !!(n.pedidoObservacionDisplay && n.pedidoObservacionDisplay.length > 0);
    });
    this.notaTieneObservacionMap = map;
    this.refrescarTablaNotas();
  }

  onNotaRowClick(nota: NotaRecepcion): void {
    this.expandedNota = this.expandedNota === nota ? null : nota;
  }

  /**
   * Resuelve la moneda + monto de cabecera al guardar:
   * - Notas todas misma moneda → esa moneda + suma directa en esa moneda.
   * - Mezcla (o sin moneda válida) → fallback Guaraní + total Gs equivalente.
   */
  private resolveCabeceraMonedaYTotal(): { monedaId: number | undefined; montoTotal: number } {
    const monedasUnicas = Array.from(
      new Set(
        this.notasAgregadas
          .map((n) => (n as any)?.moneda?.id)
          .filter((id) => id != null)
      )
    );
    if (monedasUnicas.length === 1) {
      const monedaId = monedasUnicas[0] as number;
      const sumaEnEsaMoneda = this.notasAgregadas.reduce(
        (s, n) => s + (n.valorTotal ?? 0),
        0
      );
      return { monedaId, montoTotal: Math.round(sumaEnEsaMoneda * 100) / 100 };
    }
    const guarani = this.monedaList.find((m) =>
      (m.denominacion || '').toString().toUpperCase().includes('GUARANI')
    );
    return { monedaId: guarani?.id, montoTotal: this.totalNotasGsEquivalenteComputed };
  }

  private buildInputForSave(): SolicitudPagoInput {
    const detallesInput: SolicitudPagoDetalleInput[] = (this.detallesAgregados || []).map((d) => ({
      monedaId: d.monedaId,
      formaPagoId: d.formaPagoId,
      valor: d.valor,
      fechaPago: d.fechaPago,
      observacion: d.observacion,
      cotizacion: d.cotizacion,
      orden: d.orden,
      fechaEmisionCheque: d.fechaEmisionCheque,
      portador: d.portador,
      nominal: d.nominal,
      diferido: d.diferido
    }));
    const { monedaId, montoTotal } = this.resolveCabeceraMonedaYTotal();
    return {
      proveedorId: this.selectedProveedor.id,
      monedaId,
      montoTotal,
      estado: SolicitudPagoEstado.PENDIENTE,
      notaRecepcionIds: this.notasAgregadas.map((n) => n.id),
      observaciones: (this.form.get('observaciones').value || '').toString().trim().toUpperCase() || undefined,
      usuarioId: this.mainService?.usuarioActual?.id,
      detalles: detallesInput
    };
  }

  private crearSolicitudYActivarEdicion(): void {
    if (!this.notasAgregadas.length) return;
    const input = this.buildInputForSave();
    this.saving = true;
    this.solicitudPagoService.onSaveInput(input).subscribe({
      next: (result: SolicitudPago) => {
        this.saving = false;
        if (result?.id != null) {
          this.solicitudPagoId = result.id;
          this.isEditMode = true;
          this.tituloDialogo = 'Editar solicitud de pago';
        }
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  onGuardar(): void {
    if (!this.isEditable) return;
    if (!this.selectedProveedor?.id) {
      this.notificacionService.openWarn('Seleccione un proveedor');
      return;
    }
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.notasAgregadas.length) {
      this.notificacionService.openWarn('Agregue al menos una nota de recepción');
      return;
    }
    const input: SolicitudPagoInput = this.buildInputForSave();

    this.saving = true;
    if (this.isEditMode) {
      input.id = this.solicitudPagoId;
      this.solicitudPagoService.onActualizarSolicitudPago(input).subscribe({
        next: () => {
          this.notificacionService.openSucess('Solicitud de pago actualizada');
          this.dialogRef.close(true);
        },
        error: () => {
          this.saving = false;
        }
      });
    } else {
      this.solicitudPagoService.onSaveInput(input).subscribe({
        next: () => {
          this.notificacionService.openSucess('Solicitud de pago creada');
          this.dialogRef.close(true);
        },
        error: () => {
          this.saving = false;
        }
      });
    }
  }

  onCancelar(): void {
    this.dialogRef.close(false);
  }
}
