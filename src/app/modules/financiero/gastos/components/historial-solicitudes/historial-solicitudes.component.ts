import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { PreGasto } from '../../models/pre-gasto.model';

@Component({
  selector: 'app-historial-solicitudes',
  templateUrl: './historial-solicitudes.component.html',
  styleUrls: ['./historial-solicitudes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorialSolicitudesComponent {
  @Input() ultimasSolicitudes: PreGasto[] = [];
  @Input() totalElementos = 0;
  @Input() tamanoPagina = 15;
  @Input() paginaActual = 0;
  
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() onReimprimir = new EventEmitter<{id: number, sucursalId: number}>();

  displayedColumns: string[] = ['ref', 'descripcion', 'acciones'];

  reimprimir(id: number, sucursalId: number): void {
    this.onReimprimir.emit({ id, sucursalId });
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
