import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
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
  notasAgregadas: (NotaRecepcion & {
    proveedorNombreDisplay?: string;
    pedidoMonedaDisplay?: string;
    pedidoFormaPagoDisplay?: string;
    pedidoPlazoDisplay?: string;
    pedidoObservacionDisplay?: string;
  })[] = [];
  /** Detalles (formas de pago) con display para la tabla. */
  detallesAgregados: (SolicitudPagoDetalleInput & { monedaDenominacion?: string; formaPagoDescripcion?: string })[] = [];

  proveedorNombreDisplay = '';
  montoTotalComputed = 0;
  totalFormasPagoComputed = 0;
  saving = false;

  /** Modo edición: true cuando se abre con solicitudPago existente. */
  isEditMode = false;
  /** Solo PENDIENTE permite editar. CANCELADO, CONCLUIDO, PARCIAL = solo lectura. */
  isEditable = false;
  tituloDialogo = 'Nueva solicitud de pago';
  solicitudPagoId: number;

  displayedColumnsNotas: string[] = ['numero', 'fecha', 'valorTotal', 'moneda', 'formaPago', 'plazo', 'quitar'];
  displayedColumnsDetalles: string[] = ['moneda', 'formaPago', 'valor', 'fechaPago', 'observacion', 'quitar'];

  /** Fila de nota expandida para mostrar observación del pedido. */
  expandedNota: NotaRecepcion | null = null;
  /** Mapa id nota -> true si tiene observación de forma de pago (para clase CSS sin funciones en template). */
  notaTieneObservacionMap: Record<number, boolean> = {};

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateEditSolicitudPagoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { proveedorId?: number; solicitudPago?: SolicitudPago },
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
      this.isEditable = this.data.solicitudPago.estado === SolicitudPagoEstado.PENDIENTE;
      this.tituloDialogo = this.isEditable ? 'Editar solicitud de pago' : 'Ver solicitud de pago';
      this.loadSolicitudParaEdicion();
    } else {
      this.isEditable = true;
      if (this.data?.proveedorId) {
        this.selectedProveedor = { id: this.data.proveedorId, persona: { nombre: '' } } as Proveedor;
        this.proveedorNombreDisplay = 'Proveedor preseleccionado';
      }
    }
    this.loadMonedas();
    this.loadFormasPago();
  }

  private loadSolicitudParaEdicion(): void {
    this.solicitudPagoService.onGetById(this.solicitudPagoId).subscribe({
      next: (sp: SolicitudPago) => {
        this.selectedProveedor = sp.proveedor;
        this.proveedorNombreDisplay = (sp?.proveedor?.persona?.nombre || '').toString().toUpperCase();
        this.form.patchValue({
          observaciones: sp.observaciones || ''
        });
        if (sp.notasRecepcion?.length) {
          this.notasAgregadas = sp.notasRecepcion.map((nr) => {
            const nota = nr.notaRecepcion;
            const display = (nota?.pedido?.proveedor?.persona?.nombre ?? '').toString().toUpperCase();
            const n = nota as NotaRecepcion & {
              proveedorNombreDisplay?: string;
              pedidoMonedaDisplay?: string;
              pedidoFormaPagoDisplay?: string;
              pedidoPlazoDisplay?: string;
              pedidoObservacionDisplay?: string;
            };
            n.proveedorNombreDisplay = display;
            return n;
          });
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
          this.updateTotalFormasPago();
        }
        if (!this.isEditable) {
          this.form.disable();
        }
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
      const newNotas: (NotaRecepcion & {
        proveedorNombreDisplay?: string;
        pedidoMonedaDisplay?: string;
        pedidoFormaPagoDisplay?: string;
        pedidoPlazoDisplay?: string;
        pedidoObservacionDisplay?: string;
      })[] = [];
      notas.forEach((nota) => {
        if (!idsAntes.has(nota.id)) {
          const display = (nota?.pedido?.proveedor?.persona?.nombre ?? '').toString().toUpperCase();
          const notaWithDisplay = nota as NotaRecepcion & {
            proveedorNombreDisplay?: string;
            pedidoMonedaDisplay?: string;
            pedidoFormaPagoDisplay?: string;
            pedidoPlazoDisplay?: string;
            pedidoObservacionDisplay?: string;
          };
          notaWithDisplay.proveedorNombreDisplay = display;
          this.notasAgregadas.push(notaWithDisplay);
          newNotas.push(notaWithDisplay);
        }
      });
      if (newNotas.length === 0) return;
      this.updateNotasDisplay();
      this.updateMontoTotal();
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
              this.updateMontoTotal();
              this.saving = false;
            },
            error: () => {
              this.notificacionService.openAlgoSalioMal('No se pudo desvincular la nota');
              this.saving = false;
            }
          });
        } else {
          this.notasAgregadas.splice(index, 1);
          this.updateMontoTotal();
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
        montoSugerido: this.montoTotalComputed,
        solicitudPagoId: this.isEditMode ? this.solicitudPagoId : undefined
      }
    });
    ref.afterClosed().subscribe((detalle: (SolicitudPagoDetalleInput & { monedaDenominacion?: string; formaPagoDescripcion?: string }) | null) => {
      if (!detalle) return;
      const row = {
        ...detalle,
        monedaDenominacion: detalle.monedaDenominacion ?? (this.monedaList.find((m) => m.id === detalle.monedaId)?.denominacion || '').toString().toUpperCase(),
        formaPagoDescripcion: detalle.formaPagoDescripcion ?? (this.formaPagoList.find((f) => f.id === detalle.formaPagoId)?.descripcion || '').toString().toUpperCase()
      };
      this.detallesAgregados.push(row);
      this.updateTotalFormasPago();
      if (this.solicitudPagoId != null) {
        this.saving = true;
        const detalleInput: SolicitudPagoDetalleInput = {
          monedaId: detalle.monedaId,
          formaPagoId: detalle.formaPagoId,
          valor: detalle.valor,
          fechaPago: detalle.fechaPago,
          observacion: detalle.observacion,
          cotizacion: detalle.cotizacion,
          orden: detalle.orden,
          fechaEmisionCheque: detalle.fechaEmisionCheque,
          portador: detalle.portador,
          nominal: detalle.nominal,
          diferido: detalle.diferido
        };
        this.solicitudPagoService.onAgregarSolicitudPagoDetalle(this.solicitudPagoId, detalleInput).subscribe({
          next: (res: any) => {
            if (res?.id != null) {
              const last = this.detallesAgregados[this.detallesAgregados.length - 1];
              if (last) last.id = res.id;
            }
            this.saving = false;
          },
          error: () => {
            this.notificacionService.openAlgoSalioMal('Error al agregar forma de pago');
            this.detallesAgregados.pop();
            this.updateTotalFormasPago();
            this.saving = false;
          }
        });
      } else {
        this.crearSolicitudYActivarEdicion();
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
              this.detallesAgregados.splice(index, 1);
              this.updateTotalFormasPago();
            },
            error: () => {
              this.notificacionService.openAlgoSalioMal('No se pudo eliminar la forma de pago');
            }
          });
        } else {
          this.detallesAgregados.splice(index, 1);
          this.updateTotalFormasPago();
        }
      });
  }

  private updateTotalFormasPago(): void {
    this.totalFormasPagoComputed = this.detallesAgregados.reduce((sum, d) => sum + (d.valor ?? 0), 0);
  }

  private updateMontoTotal(): void {
    const sum = this.notasAgregadas.reduce(
      (acc, n) => acc + (n.valorTotal ?? (n as any).valor ?? 0),
      0
    );
    // Redondear para evitar decimales por errores de punto flotante (valorTotal viene como Double del backend; suma en JS puede dar 962499.9999999)
    this.montoTotalComputed = Math.round(sum);
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
      };
      n.pedidoMonedaDisplay = (ped?.moneda?.denominacion ?? ped?.moneda?.simbolo ?? '-').toString().toUpperCase();
      n.pedidoFormaPagoDisplay = (ped?.formaPago?.descripcion ?? '-').toString().toUpperCase();
      n.pedidoPlazoDisplay = ped?.plazoCredito != null ? String(ped.plazoCredito) : '-';
      n.pedidoObservacionDisplay = (ped?.observacionFormaPago ?? '').toString().trim();
      map[nota.id] = !!(n.pedidoObservacionDisplay && n.pedidoObservacionDisplay.length > 0);
    });
    this.notaTieneObservacionMap = map;
  }

  onNotaRowClick(nota: NotaRecepcion): void {
    this.expandedNota = this.expandedNota === nota ? null : nota;
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
    return {
      proveedorId: this.selectedProveedor.id,
      montoTotal: this.montoTotalComputed,
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

    const input: SolicitudPagoInput = {
      proveedorId: this.selectedProveedor.id,
      montoTotal: this.montoTotalComputed,
      estado: SolicitudPagoEstado.PENDIENTE,
      notaRecepcionIds: this.notasAgregadas.map((n) => n.id),
      observaciones: (this.form.get('observaciones').value || '').toString().trim().toUpperCase() || undefined,
      usuarioId: this.mainService?.usuarioActual?.id,
      detalles: detallesInput
    };

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
