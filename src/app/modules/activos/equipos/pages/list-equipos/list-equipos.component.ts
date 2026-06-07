import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Equipo } from '../../models/equipo.model';
import { EquiposService } from '../../services/equipos.service';

@UntilDestroy()
@Component({
  selector: 'list-equipos',
  templateUrl: './list-equipos.component.html',
  styleUrls: ['./list-equipos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListEquiposComponent implements OnInit {
  public equiposService = inject(EquiposService);
  equipos$ = this.equiposService.equipos$;

  displayedColumns: string[] = ['id', 'identificador', 'descripcion', 'marcaModelo', 'tipoEquipo', 'propietario', 'tasacion', 'acciones'];

  filtroControl = new FormControl('');

  ngOnInit(): void {
    this.equiposService.refrescar();
    this.initFiltros();
  }

  private initFiltros(): void {
    this.filtroControl.valueChanges
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((texto) => {
        this.equiposService.setSearchText(texto || '');
      });
  }

  onAdicionar(): void {
    this.equiposService.abrirFormulario().subscribe();
  }

  onEditar(row: Equipo): void {
    this.equiposService.abrirFormulario(row).subscribe();
  }

  onEliminar(row: Equipo): void {
    if (row?.id) {
      this.equiposService.onEliminar(row.id).subscribe();
    }
  }

  onFiltrar(): void {
    this.equiposService.refrescar();
  }

  handlePageEvent(event: PageEvent): void {
    this.equiposService.updatePagination(event.pageIndex, event.pageSize);
  }

  resetFiltro(): void {
    this.filtroControl.setValue('');
    this.equiposService.setSearchText('');
  }
}
