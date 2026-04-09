import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Mueble } from '../../models/mueble.model';
import { MuebleService } from '../../service/mueble.service';

@UntilDestroy()
@Component({
  selector: 'app-list-muebles',
  templateUrl: './list-muebles.component.html',
  styleUrls: ['./list-muebles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListMueblesComponent implements OnInit {
  public muebleService = inject(MuebleService);
  muebles$ = this.muebleService.muebles$;

  displayedColumns: string[] = ['id', 'identificador', 'descripcion', 'familiaTipo', 'propietario', 'tasacion', 'acciones'];

  filtroControl = new FormControl('');

  ngOnInit(): void {
    this.muebleService.refrescar();
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
        this.muebleService.setSearchText(texto || '');
      });
  }



  onAdicionar(): void {
    this.muebleService.abrirFormulario().subscribe();
  }

  onEditar(row: Mueble): void {
    this.muebleService.abrirFormulario(row).subscribe();
  }

  onFiltrar(): void {
    this.muebleService.refrescar();
  }

  handlePageEvent(event: PageEvent): void {
    this.muebleService.updatePagination(event.pageIndex, event.pageSize);
  }

  resetFiltro(): void {
    this.filtroControl.setValue('');
    this.muebleService.setSearchText('');
  }
}
