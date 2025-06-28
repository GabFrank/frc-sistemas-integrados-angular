import { Component, Inject, OnInit, OnDestroy, ViewChild, AfterViewInit, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { NotaRecepcionAgrupada, NotaRecepcionAgrupadaEstado } from '../../../../nota-recepcion/nota-recepcion-agrupada/nota-recepcion-agrupada.model';
import { NotaRecepcion } from '../../../../nota-recepcion/nota-recepcion.model';
import { NotaRecepcionService } from '../../../../nota-recepcion/nota-recepcion.service';
import { Pedido } from '../../../../edit-pedido/pedido.model';
import { PedidoService } from '../../../../pedido.service';
import { PedidoEstado } from '../../../../edit-pedido/pedido-enums';
import { GenericCrudService } from '../../../../../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../../../shared/components/dialogos/dialogos.service';
import { ManageNotaItemsDialogComponent } from '../../../recepcion-nota/manage-nota-items-dialog/manage-nota-items-dialog.component';
import { NotaRecepcionAgrupadaService } from '../../../../nota-recepcion/nota-recepcion-agrupada/nota-recepcion-agrupada.service';

export interface GestionarGrupoDialogData {
  grupo: NotaRecepcionAgrupada;
  pedido: Pedido;
  puedeEliminar: boolean;
  puedeAgregarNotas: boolean;
}

export interface GestionarGrupoDialogResult {
  accion: 'ELIMINAR_GRUPO' | 'EDITAR_NOTA' | 'REABRIR_GRUPO' | 'DESVINCULAR_NOTA' | 'CERRAR';
  grupoAfectado?: NotaRecepcionAgrupada;
  notaSeleccionada?: NotaRecepcion;
  pedidoEstadoCambiado?: boolean;
}

// Enhanced NotaRecepcion for display
type NotaRecepcionDisplay = NotaRecepcion & {
  // Computed properties for template binding
  computedFechaDisplay: string;
  computedValorDisplay: string;
  computedItemsDisplay: string;
  computedUsuarioDisplay: string;
  computedEstadoChipClass: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-gestionar-grupo-dialog',
  templateUrl: './gestionar-grupo-dialog.component.html',
  styleUrls: ['./gestionar-grupo-dialog.component.scss']
})
export class GestionarGrupoDialogComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('paginator') paginator: MatPaginator;

  // Event emitter to notify parent of changes without closing dialog
  private changeNotifier = new EventEmitter<GestionarGrupoDialogResult>();

  grupo: NotaRecepcionAgrupada;
  pedido: Pedido;
  
  // Permissions
  puedeEliminar = false;
  puedeAgregarNotas = false;
  
  // Table data
  notasDataSource = new MatTableDataSource<NotaRecepcionDisplay>([]);
  displayedColumns = ['numero', 'fecha', 'items', 'valor', 'usuario', 'estado', 'actions'];
  
  // Search
  searchControl = new FormControl('');
  
  // Loading states
  isLoading = false;
  isProcessing = false;
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  
  // Computed properties for template binding
  dialogTitleComputed = '';
  grupoInfoComputed = '';
  monedaSymbolComputed = 'Gs.';
  totalNotasComputed = 0;
  valorTotalGrupoComputed = 0;
  valorTotalGrupoDisplay = '';
  estadoGrupoChipClassComputed = '';
  hasNotasComputed = false;
  canDeleteGrupoComputed = false;
  puedeDesvincularNotaComputed = false;
  puedeReabrirGrupoComputed = false;
  
  // Grupo detailed info for display
  grupoDetallesComputed = {
    proveedor: '',
    sucursal: '',
    fechaCreacion: '',
    usuarioCreacion: '',
    estado: '',
    solicitudPago: '',
    pago: ''
  };

  constructor(
    public dialogRef: MatDialogRef<GestionarGrupoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GestionarGrupoDialogData,
    private genericCrudService: GenericCrudService,
    private notaRecepcionService: NotaRecepcionService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private dialog: MatDialog,
    private pedidoService: PedidoService,
    private notaRecepcionAgrupadaService: NotaRecepcionAgrupadaService
  ) {
    this.grupo = data.grupo;
    this.pedido = data.pedido;
    this.puedeEliminar = data.puedeEliminar;
    this.puedeAgregarNotas = data.puedeAgregarNotas;
  }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.computeBasicProperties();
    this.loadNotasDelGrupo();
  }

  ngAfterViewInit(): void {
    // Setup paginator after view initialization
    if (this.paginator) {
      this.notasDataSource.paginator = this.paginator;
    }
  }

  ngOnDestroy(): void {
    this.notasDataSource.data = [];
  }

  private setupSearchSubscription(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => {
        this.applyFilter();
      });
  }

  private computeBasicProperties(): void {
    // Dialog title
    this.dialogTitleComputed = `Gestionar Grupo #${this.grupo.id}`;
    
    // Moneda symbol
    this.monedaSymbolComputed = this.pedido?.moneda?.simbolo || 'Gs.';
    
    // Basic grupo info
    this.totalNotasComputed = this.grupo.cantNotas || 0;
    this.valorTotalGrupoComputed = this.grupo.valorTotal || 0;
    this.valorTotalGrupoDisplay = this.formatCurrency(this.valorTotalGrupoComputed);
    
    // Estado chip class
    this.estadoGrupoChipClassComputed = this.getEstadoChipClass(this.grupo.estado);
    
    // Permissions
    this.canDeleteGrupoComputed = this.puedeEliminar && !this.isProcessing;
    
    // Check if notas can be unlinked (desvincular)
    // Can unlink if: grupo is not CONCLUIDO AND (no solicitud pago OR solicitud pago exists but is not CONCLUIDO or CANCELADO)
    const solicitudPago = this.grupo.solicitudPago;
    const grupoEsConcluido = this.grupo.estado === NotaRecepcionAgrupadaEstado.CONCLUIDO;
    this.puedeDesvincularNotaComputed = !grupoEsConcluido && (!solicitudPago || 
      (solicitudPago && solicitudPago.estado !== 'CONCLUIDO' && solicitudPago.estado !== 'CANCELADO'));
    
    // Check if grupo can be reopened
    // Can reopen if: grupo is CONCLUIDO AND (no solicitud pago OR solicitud pago is not CONCLUIDO or CANCELADO)
    this.puedeReabrirGrupoComputed = grupoEsConcluido && (!solicitudPago || 
      (solicitudPago && solicitudPago.estado !== 'CONCLUIDO' && solicitudPago.estado !== 'CANCELADO'));
    
    // Detailed grupo information
    this.grupoDetallesComputed = {
      proveedor: this.grupo.proveedor?.persona?.nombre || 'No especificado',
      sucursal: this.grupo.sucursal?.nombre || 'No especificada',
      fechaCreacion: this.formatDate(this.grupo.creadoEn),
      usuarioCreacion: this.grupo.usuario?.persona?.nombre || this.grupo.usuario?.nickname || 'No especificado',
      estado: this.grupo.estado || 'No especificado',
      solicitudPago: this.grupo.solicitudPago ? `#${this.grupo.solicitudPago.id}` : 'Ninguna',
      pago: this.grupo.solicitudPago?.pago ? `#${this.grupo.solicitudPago.pago.id}` : 'Ninguno'
    };
  }

  private loadNotasDelGrupo(page: number = 0, size: number = 10): void {
    if (!this.grupo?.id) {
      console.warn('No grupo ID available for loading notas');
      return;
    }

    this.isLoading = true;
    
    this.notaRecepcionService.onGetNotaRecepcionPorNotaRecepcionAgrupadaIdPage(
      this.grupo.id, 
      page, 
      size
    )
    .pipe(untilDestroyed(this))
    .subscribe({
      next: (response) => {
        // Update pagination info
        this.currentPage = page;
        this.pageSize = size;
        this.totalElements = response.getTotalElements;
        this.totalPages = response.getTotalPages;
        
        // Transform notas for display
        const notasDisplay = response.getContent.map(nota => this.transformNotaForDisplay(nota));
        this.notasDataSource.data = notasDisplay;
        this.updateComputedProperties();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notas del grupo:', error);
        this.notificacionService.openWarn('Error al cargar las notas del grupo');
        this.isLoading = false;
      }
    });
  }

  private transformNotaForDisplay(nota: NotaRecepcion): NotaRecepcionDisplay {
    const notaBase = Object.assign(new NotaRecepcion(), nota);
    return Object.assign(notaBase, {
      computedFechaDisplay: this.formatDate(nota.fecha),
      computedValorDisplay: this.formatCurrency(nota.valor || 0),
      computedItemsDisplay: `${nota.cantidadItens || 0} items`,
      computedUsuarioDisplay: nota.usuario?.persona?.nombre || nota.usuario?.nickname || 'No especificado',
      computedEstadoChipClass: this.getNotaEstadoChipClass('ACTIVA') // Default estado since NotaRecepcion doesn't have estado property
    });
  }

  private updateComputedProperties(): void {
    this.hasNotasComputed = this.notasDataSource.data.length > 0;
    // Additional computed properties can be added here
  }

  private applyFilter(): void {
    const filterValue = this.searchControl.value?.toLowerCase() || '';
    this.notasDataSource.filter = filterValue;
    
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  // Pagination event handlers
  onPageChange(event: any): void {
    this.loadNotasDelGrupo(event.pageIndex, event.pageSize);
  }

  // Actions
  async onDesvincularNota(nota: NotaRecepcionDisplay): Promise<void> {
    if (!this.puedeDesvincularNotaComputed) {
      if (this.grupo.estado === NotaRecepcionAgrupadaEstado.CONCLUIDO) {
        this.notificacionService.openWarn('No se puede desvincular: El grupo está concluido. Use el botón de reabrir para permitir modificaciones.');
      } else {
        this.notificacionService.openWarn('No se puede desvincular: Solicitud de pago concluida o cancelada');
      }
      return;
    }

    const confirmacion = await this.dialogosService.confirm(
      'Desvincular Nota de Recepción',
      `¿Está seguro que desea desvincular la Nota #${nota.numero} del grupo?\n\nEsta acción removerá la nota del grupo actual. La nota seguirá existiendo pero no estará asociada a ningún grupo.`
    ).toPromise();

    if (confirmacion) {
      this.isProcessing = true;
      
      try {
        // Create a copy of the nota and set notaRecepcionAgrupada to null
        const notaInput = nota.toInput();
        notaInput.notaRecepcionAgrupadaId = null;

        // Save the nota without the grupo association
        await this.notaRecepcionService.onSaveNotaRecepcion(notaInput).toPromise();
        
        this.notificacionService.openSucess(`Nota #${nota.numero} desvinculada exitosamente del grupo`);
        
        // Refresh the local data
        this.loadNotasDelGrupo(this.currentPage, this.pageSize);
        
        // Notify parent component about the nota desvinculation without closing the dialog
        this.notifyParentOfNotaDesvinculation(nota);
        
      } catch (error) {
        console.error('Error al desvincular nota:', error);
        this.notificacionService.openWarn('Error al desvincular la nota del grupo');
      } finally {
        this.isProcessing = false;
      }
    }
  }

  onVerNota(nota: NotaRecepcionDisplay): void {
    if (!nota || !this.pedido) {
      this.notificacionService.openWarn('Error: Nota o pedido no disponible');
      return;
    }

    // Open the manage nota items dialog in read-only mode
    const dialogRef = this.dialog.open(ManageNotaItemsDialogComponent, {
      width: '95vw',
      height: '90vh',
      maxWidth: '1400px',
      data: {
        notaRecepcion: nota,
        pedido: this.pedido,
        readOnlyMode: true // Add read-only mode flag
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      // Since this is read-only mode, we don't expect any changes
      // but we can handle any result if needed
      if (result?.itemsChanged) {
        // If somehow items were changed, refresh our data
        this.loadNotasDelGrupo(this.currentPage, this.pageSize);
      }
    });
  }

  async onReabrirGrupo(): Promise<void> {
    if (!this.puedeReabrirGrupoComputed) {
      this.notificacionService.openWarn('No se puede reabrir: Solicitud de pago concluida o cancelada');
      return;
    }

    const confirmacion = await this.dialogosService.confirm(
      'Reabrir Grupo',
      `¿Está seguro que desea reabrir el Grupo #${this.grupo.id}?\n\nEsto realizará las siguientes acciones:\n• Cambiará el estado del grupo a EN_RECEPCION\n• Cambiará el estado del pedido a EN_SOLICITUD_PAGO\n• Permitirá realizar modificaciones como desvincular notas\n\nDeberá concluir nuevamente el proceso de solicitud de pago después de realizar los cambios.`
    ).toPromise();

    if (confirmacion) {
      this.isProcessing = true;
      
      try {
        // Step 1: Update grupo estado to EN_RECEPCION
        const grupoInput = {
          id: this.grupo.id,
          estado: 'EN_RECEPCION',
          proveedorId: this.grupo.proveedor?.id,
          sucursalId: this.grupo.sucursal?.id,
          usuarioId: this.grupo.usuario?.id
        };

        await this.updateGrupoEstado(grupoInput);
        
        // Step 2: Update pedido estado to EN_SOLICITUD_PAGO
        await this.pedidoService.onFinalizarPedido(this.pedido.id, PedidoEstado.EN_SOLICITUD_PAGO).toPromise();
        
        // Step 3: Update local states
        this.grupo.estado = NotaRecepcionAgrupadaEstado.EN_RECEPCION;
        this.pedido.estado = PedidoEstado.EN_SOLICITUD_PAGO;
        
        // Step 4: Recompute properties
        this.computeBasicProperties();
        
        this.notificacionService.openSucess(
          `Grupo #${this.grupo.id} reabierto exitosamente.\n\n` +
          `• Estado del grupo: EN_RECEPCION\n` +
          `• Estado del pedido: EN_SOLICITUD_PAGO\n\n` +
          `Ahora puede realizar modificaciones como desvincular notas.`
        );
        
        // Notify parent component about the changes without closing the dialog
        // The dialog stays open so user can continue managing the grupo
        this.notifyParentOfChanges();
        
      } catch (error) {
        console.error('Error al reabrir grupo:', error);
        this.notificacionService.openWarn('Error al reabrir el grupo y actualizar el estado del pedido');
      } finally {
        this.isProcessing = false;
      }
    }
  }

  /**
   * Notifies parent component of changes without closing the dialog
   */
  private notifyParentOfChanges(): void {
    const result: GestionarGrupoDialogResult = {
      accion: 'REABRIR_GRUPO',
      grupoAfectado: this.grupo,
      pedidoEstadoCambiado: true
    };
    
    // Emit the change to parent through the dialog ref's componentInstance
    // This allows the parent to handle the change without closing the dialog
    this.changeNotifier.emit(result);
    
    // Also store the result in the dialog ref for access by parent
    (this.dialogRef as any)._lastChangeResult = result;
  }

  /**
   * Notifies parent component about nota desvinculation without closing the dialog
   */
  private notifyParentOfNotaDesvinculation(nota: NotaRecepcionDisplay): void {
    const result: GestionarGrupoDialogResult = {
      accion: 'DESVINCULAR_NOTA',
      grupoAfectado: this.grupo,
      notaSeleccionada: nota
    };
    
    // Emit the change to parent through the dialog ref's componentInstance
    // This allows the parent to handle the change without closing the dialog
    this.changeNotifier.emit(result);
    
    // Also store the result in the dialog ref for access by parent
    (this.dialogRef as any)._lastChangeResult = result;
  }

  private async updateGrupoEstado(grupoInput: any): Promise<void> {
    try {
      // Use the specific reabrirRecepcion mutation
      const updatedGrupo = await this.notaRecepcionAgrupadaService.onReabrirRecepcion(grupoInput.id).toPromise();
      
      if (!updatedGrupo) {
        throw new Error('No se recibió respuesta del servidor al reabrir el grupo');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error reopening grupo:', error);
      return Promise.reject(error);
    }
  }

  async onEliminarGrupo(): Promise<void> {
    if (!this.canDeleteGrupoComputed) {
      this.notificacionService.openWarn('No tiene permisos para eliminar este grupo');
      return;
    }

    const hasSolicitudPago = !!this.grupo.solicitudPago;
    const solicitudPagoId = hasSolicitudPago ? this.grupo.solicitudPago.id : null;
    
    const title = `Eliminar Grupo #${this.grupo.id}`;
    const message1 = `¿Está seguro de eliminar este grupo?`;
    const warnings = [
      `Proveedor: ${this.grupoDetallesComputed.proveedor}`,
      `Estado: ${this.grupoDetallesComputed.estado}`,
      `Cantidad de notas: ${this.totalNotasComputed}`,
      `Las notas quedarán sin agrupar y deberán ser reagrupadas`
    ];

    // Add warning about SolicitudPago deletion if applicable
    if (hasSolicitudPago) {
      warnings.push(`⚠️ ATENCIÓN: También se eliminará la Solicitud de Pago #${solicitudPagoId} asociada a este grupo`);
    }
    
    warnings.push(`Esta acción no se puede deshacer`);

    try {
      const confirmed = await this.dialogosService.confirm(
        title,
        message1,
        'Información del grupo a eliminar:',
        warnings,
        true, // action = true means "Sí" and "No" buttons
        'Eliminar',
        'Cancelar'
      ).toPromise();

      if (confirmed) {
        const result: GestionarGrupoDialogResult = {
          accion: 'ELIMINAR_GRUPO',
          grupoAfectado: this.grupo
        };
        this.dialogRef.close(result);
      }
    } catch (error) {
      console.error('Error in confirmation dialog:', error);
    }
  }

  onCerrar(): void {
    const result: GestionarGrupoDialogResult = {
      accion: 'CERRAR'
    };
    this.dialogRef.close(result);
  }

  // Utility methods
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount).replace('PYG', 'Gs.');
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-PY');
  }

  private getEstadoChipClass(estado: NotaRecepcionAgrupadaEstado): string {
    switch (estado) {
      case NotaRecepcionAgrupadaEstado.EN_RECEPCION:
        return 'estado-chip-warning';
      case NotaRecepcionAgrupadaEstado.CONCLUIDO:
        return 'estado-chip-success';
      case NotaRecepcionAgrupadaEstado.CANCELADO:
        return 'estado-chip-danger';
      default:
        return 'estado-chip-default';
    }
  }

  private getNotaEstadoChipClass(estado: string): string {
    switch (estado) {
      case 'ACTIVO':
      case 'ACTIVA':
        return 'estado-chip-success';
      case 'CANCELADO':
      case 'CANCELADA':
        return 'estado-chip-danger';
      case 'PENDIENTE':
        return 'estado-chip-warning';
      default:
        return 'estado-chip-default';
    }
  }
} 