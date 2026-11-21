import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { PaginacionLista } from '../../../../../shared/components/paginacion/paginacion-lista';
import { PreGasto } from '../../models/pre-gasto.model';

@Component({
  selector: 'app-historial-solicitudes',
  templateUrl: './historial-solicitudes.component.html',
  styleUrls: ['./historial-solicitudes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorialSolicitudesComponent {
  @Input() ultimasSolicitudes: PreGasto[] = [];
  /** La paginación la lleva quien muestra el historial (#772). */
  @Input() pag: PaginacionLista<PreGasto>;

  @Output() onReimprimir = new EventEmitter<{id: number, sucursalId: number}>();

  displayedColumns: string[] = ['ref', 'descripcion', 'acciones'];

  reimprimir(id: number, sucursalId: number): void {
    this.onReimprimir.emit({ id, sucursalId });
  }
}
