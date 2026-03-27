import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Inmueble } from '../../models/inmueble.model';
import { InmuebleService } from '../../service/inmueble.service';

@UntilDestroy()
@Component({
  selector: 'app-list-inmuebles',
  templateUrl: './list-inmuebles.component.html',
  styleUrls: ['./list-inmuebles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListInmueblesComponent implements OnInit {
  public inmuebleService = inject(InmuebleService);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<Inmueble>();

  displayedColumns: string[] = ['id', 'nombreAsignado', 'direccion', 'paisCity', 'propietario', 'tasacion', 'acciones'];

  filtroControl = new FormControl('');

  ngOnInit(): void {
    this.inmuebleService.refrescar();
    this.initFiltros();
    this.initDataStream();
  }

  private initFiltros(): void {
    this.filtroControl.valueChanges
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((texto) => {
        this.inmuebleService.setSearchText(texto || '');
      });
  }

  private initDataStream(): void {
    this.inmuebleService.inmuebles$
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.dataSource.data = res || [];
        this.cdr.markForCheck();
      });
  }

  onAdicionar(): void {
    this.inmuebleService.abrirFormulario().subscribe();
  }

  onEditar(row: Inmueble): void {
    this.inmuebleService.abrirFormulario(row).subscribe();
  }

  onFiltrar(): void {
    this.inmuebleService.refrescar();
  }

  handlePageEvent(event: PageEvent): void {
    this.inmuebleService.updatePagination(event.pageIndex, event.pageSize);
  }

  resetFiltro(): void {
    this.filtroControl.setValue('');
    this.inmuebleService.setSearchText('');
  }
}
