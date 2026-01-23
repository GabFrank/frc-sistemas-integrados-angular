import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Persona } from '../../../personas/persona/persona.model';
import { TransferenciaService } from '../transferencia.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Transferencia } from '../transferencia.model';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'entregadores',
  templateUrl: './entregadores.component.html',
  styleUrls: ['./entregadores.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class EntregadoresComponent implements OnInit {

  displayedColumns: string[] = ['id', 'nombre', 'documento', 'telefono', 'acciones'];
  dataSource = new MatTableDataSource<Persona>([]);
  isLoading = true;
  expandedElement: Persona | null;

  // Cache para las transferencias cargadas
  transferenciasCache: { [key: number]: Transferencia[] } = {};
  loadingTransferencias: { [key: number]: boolean } = {};

  constructor(
    private transferenciaService: TransferenciaService
  ) { }

  ngOnInit(): void {
    this.loadChoferes();
  }

  loadChoferes(): void {
    this.isLoading = true;
    this.transferenciaService.onGetChoferesConEntregas(0, 100)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (choferes) => {
          this.dataSource.data = choferes || [];
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar choferes:', err);
          this.isLoading = false;
        }
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onExpandRow(element: Persona): void {
    this.expandedElement = this.expandedElement === element ? null : element;

    if (this.expandedElement && !this.transferenciasCache[element.id]) {
      this.loadTransferencias(element.id);
    }
  }

  loadTransferencias(choferId: number): void {
    this.loadingTransferencias[choferId] = true;
    this.transferenciaService.onGetTransferenciasPorChofer(choferId, 0, 20)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (transferencias) => {
          this.transferenciasCache[choferId] = transferencias;
          this.loadingTransferencias[choferId] = false;
        },
        error: (err) => {
          console.error(`Error al cargar transferencias para chofer ${choferId}:`, err);
          this.loadingTransferencias[choferId] = false;
        }
      });
  }
}
