import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { Pedido } from '../../../../edit-pedido/pedido.model';
import { NotaRecepcion } from '../../../../nota-recepcion/nota-recepcion.model';
import { NotaRecepcionAgrupada, NotaRecepcionAgrupadaEstado } from '../../../../nota-recepcion/nota-recepcion-agrupada/nota-recepcion-agrupada.model';
import { GenericCrudService } from '../../../../../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../../../../../notificacion-snackbar.service';
import { AsignarNotasAGrupoGQL } from '../../graphql/asignarNotasAGrupo';
import { GetGruposDisponiblesGQL } from '../../graphql/getGruposDisponibles';

export interface SeleccionarGrupoExistenteDialogData {
  pedido: Pedido;
  notasSeleccionadas: NotaRecepcion[];
}

export interface SeleccionarGrupoExistenteDialogResult {
  grupoSeleccionado: NotaRecepcionAgrupada;
  notasAfectadas: NotaRecepcion[];
  accion: 'ASIGNAR' | 'CANCELAR';
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-seleccionar-grupo-existente-dialog',
  templateUrl: './seleccionar-grupo-existente-dialog.component.html',
  styleUrls: ['./seleccionar-grupo-existente-dialog.component.scss']
})
export class SeleccionarGrupoExistenteDialogComponent implements OnInit, OnDestroy {

  processing = false;
  loadingGrupos = false;
  
  // Computed properties for template display
  proveedorNombre = '';
  totalNotas = 0;
  valorTotal = 0;
  valorTotalDisplay = '';
  grupoSeleccionadoInfo = '';
  
  // Available groups
  gruposDisponibles: NotaRecepcionAgrupada[] = [];
  grupoSeleccionado: NotaRecepcionAgrupada | null = null;
  
  // Notas for display table
  notasDisplay: {
    numero: string;
    fecha: string;
    valor: number;
    valorDisplay: string;
    cantidadItens: number;
  }[] = [];

  // Enhanced grupos for display
  gruposDisplay: {
    grupo: NotaRecepcionAgrupada;
    titulo: string;
    info: string;
    cantidadNotas: number;
    estado: string;
    estadoChipClass: string;
    compatible: boolean;
    seleccionado: boolean;
  }[] = [];

  // Table columns
  displayedColumns: string[] = ['numero', 'fecha', 'items', 'valor'];

  constructor(
    public dialogRef: MatDialogRef<SeleccionarGrupoExistenteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarGrupoExistenteDialogData,
    private genericCrudService: GenericCrudService,
    private notificacionService: NotificacionSnackbarService,
    private asignarNotasAGrupoGQL: AsignarNotasAGrupoGQL,
    private getGruposDisponiblesGQL: GetGruposDisponiblesGQL
  ) {}

  ngOnInit(): void {
    this.computeDisplayData();
    this.loadGruposDisponibles();
  }

  ngOnDestroy(): void {
    // Cleanup handled by UntilDestroy
  }

  private computeDisplayData(): void {
    const { pedido, notasSeleccionadas } = this.data;
    
    // Basic info
    this.proveedorNombre = pedido.proveedor?.persona?.nombre || 'No especificado';
    this.totalNotas = notasSeleccionadas.length;
    this.valorTotal = notasSeleccionadas.reduce((sum, nota) => sum + (nota.valor || 0), 0);
    this.valorTotalDisplay = this.formatCurrency(this.valorTotal);
    
    // Enhanced notas for display
    this.notasDisplay = notasSeleccionadas.map(nota => ({
      numero: String(nota.numero || 'Sin número'),
      fecha: this.formatDate(nota.fecha),
      valor: nota.valor || 0,
      valorDisplay: this.formatCurrency(nota.valor || 0),
      cantidadItens: nota.cantidadItens || 0
    }));
  }

  private loadGruposDisponibles(): void {
    if (!this.data.pedido.proveedor?.id) return;

    this.loadingGrupos = true;
    
    const variables = {
      proveedorId: this.data.pedido.proveedor.id,
      page: 0,
      size: 20 // Load first 20 groups
    };

    this.genericCrudService.onCustomQuery(
      this.getGruposDisponiblesGQL,
      variables
    ).pipe(untilDestroyed(this)).subscribe({
      next: (response) => {
        const page = response.data;
        this.gruposDisponibles = page?.getContent || [];
        this.computeGruposDisplay();
        this.loadingGrupos = false;
      },
      error: (error) => {
        console.error('Error loading grupos disponibles:', error);
        this.notificacionService.openWarn('Error al cargar los grupos disponibles');
        this.loadingGrupos = false;
      }
    });
  }

  private computeGruposDisplay(): void {
    this.gruposDisplay = this.gruposDisponibles.map(grupo => ({
      grupo,
      titulo: `Grupo #${grupo.id}`,
      info: this.getGrupoInfo(grupo),
      cantidadNotas: grupo.cantNotas || 0,
      estado: grupo.estado,
      estadoChipClass: this.getEstadoChipClass(grupo.estado),
      compatible: this.isGrupoCompatible(grupo),
      seleccionado: this.grupoSeleccionado?.id === grupo.id
    }));
  }

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

  private getGrupoInfo(grupo: NotaRecepcionAgrupada): string {
    const fecha = this.formatDate(grupo.creadoEn);
    const usuario = grupo.usuario?.persona?.nombre || grupo.usuario?.nickname || 'Usuario';
    const sucursal = (grupo.sucursal as any)?.descripcion || 'Sucursal';
    return `${sucursal} • ${fecha} • ${usuario}`;
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

  private isGrupoCompatible(grupo: NotaRecepcionAgrupada): boolean {
    // Check if group is compatible for adding more notas
    if (grupo.estado === NotaRecepcionAgrupadaEstado.CONCLUIDO) {
      return false;
    }
    
    // Check if grupo has a concluded SolicitudPago/Pago
    if (grupo.solicitudPago?.pago) {
      const pagoState = (grupo.solicitudPago.pago as any)?.estado;
      if (pagoState === 'CONCLUIDO') {
        return false;
      }
    }
    
    return true;
  }

  // Actions
  onSeleccionarGrupo(grupoDisplay: any): void {
    if (!grupoDisplay.compatible) {
      this.notificacionService.openWarn('Este grupo no está disponible para agregar más notas');
      return;
    }

    this.grupoSeleccionado = grupoDisplay.grupo;
    this.grupoSeleccionadoInfo = this.getGrupoInfo(this.grupoSeleccionado);
    this.computeGruposDisplay(); // Update selection state
  }

  onAsignarNotas(): void {
    if (!this.grupoSeleccionado) {
      this.notificacionService.openWarn('Debe seleccionar un grupo');
      return;
    }

    if (this.totalNotas === 0) {
      this.notificacionService.openWarn('No hay notas para asignar');
      return;
    }

    this.processing = true;

    const mutationVariables = {
      grupoId: this.grupoSeleccionado.id,
      notaRecepcionIds: this.data.notasSeleccionadas.map(nota => nota.id)
    };

    this.genericCrudService.onCustomMutation(
      this.asignarNotasAGrupoGQL,
      mutationVariables
    ).pipe(untilDestroyed(this)).subscribe({
      next: (result) => {
        const response = result.data;
        if (response?.success) {
          this.notificacionService.openSucess(
            `${response.notasAfectadas.length} notas asignadas al grupo exitosamente`
          );
          
          const dialogResult: SeleccionarGrupoExistenteDialogResult = {
            grupoSeleccionado: response.grupo,
            notasAfectadas: response.notasAfectadas,
            accion: 'ASIGNAR'
          };
          
          this.dialogRef.close(dialogResult);
        } else {
          this.notificacionService.openWarn(
            response?.mensaje || 'Error al asignar las notas al grupo'
          );
          this.processing = false;
        }
      },
      error: (error) => {
        console.error('Error assigning notas to group:', error);
        this.notificacionService.openWarn('Error al asignar las notas al grupo');
        this.processing = false;
      }
    });
  }

  onCancelar(): void {
    const result: SeleccionarGrupoExistenteDialogResult = {
      grupoSeleccionado: {} as NotaRecepcionAgrupada,
      notasAfectadas: [],
      accion: 'CANCELAR'
    };
    this.dialogRef.close(result);
  }

  // Computed properties for template
  get canAssign(): boolean {
    return !!this.grupoSeleccionado && !this.processing && !this.loadingGrupos;
  }

  get hasCompatibleGroups(): boolean {
    return this.gruposDisplay.some(g => g.compatible);
  }
} 