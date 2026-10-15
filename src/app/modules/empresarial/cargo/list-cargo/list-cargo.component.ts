import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Cargo } from '../cargo.model';
import { CargoService } from '../cargo.service';
import { EditCargoDialogComponent } from '../edit-cargo-dialog/edit-cargo-dialog.component';
import { terminarSiFalla } from '../../../../commons/core/utils/rxjsUtils';
import { PageInfo } from '../../../../app.component';

/**
 * ABM de cargos. El backend ya existia entero (CargoGraphQL); lo que faltaba era esta
 * pantalla, asi que los cargos solo se podian crear tocando la base.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-cargo',
  templateUrl: './list-cargo.component.html',
  styleUrls: ['./list-cargo.component.scss']
})
export class ListCargoComponent implements OnInit {

  displayedColumns = ['nombre', 'descripcion', 'sueldoBase', 'supervisadoPor', 'acciones'];
  dataSource = new MatTableDataSource<Cargo>([]);

  textoControl = new FormControl(null);

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<Cargo>;

  constructor(
    private cargoService: CargoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) { }

  ngOnInit(): void {
    this.onFiltrar();
  }

  /** Un filtro nuevo vuelve a la primera pagina: la actual puede no existir con menos resultados. */
  onFiltrar() {
    this.pageIndex = 0;
    this.cargarPagina();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargarPagina();
  }

  private cargarPagina() {
    this.cargoService.onGetAllWithPage(this.pageIndex, this.pageSize, this.textoControl.value || null)
      .pipe(terminarSiFalla(), untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          // Borrar el ultimo cargo de la ultima pagina la deja vacia: retroceder una.
          if (!res.getContent?.length && this.pageIndex > 0) {
            this.pageIndex--;
            this.cargarPagina();
            return;
          }
          this.selectedPageInfo = res;
          this.dataSource.data = res.getContent || [];
        }
      });
  }

  onResetFiltro() {
    this.textoControl.setValue(null);
    this.onFiltrar();
  }

  onNuevo() {
    this.dialog.open(EditCargoDialogComponent, { width: '520px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.cargarPagina(); });
  }

  onEditar(cargo: Cargo) {
    this.dialog.open(EditCargoDialogComponent, { data: { cargo }, width: '520px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.cargarPagina(); });
  }

  onEliminar(cargo: Cargo) {
    this.dialogosService.confirm(
      'Eliminar cargo', '¿Desea eliminar el cargo ' + cargo.nombre + '?',
      'Si hay funcionarios con este cargo, historico o subcargos, el backend lo rechaza y te lo dice.',
      null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.cargoService.onDelete(cargo.id)
          .pipe(untilDestroyed(this)).subscribe(ok => { if (ok) this.cargarPagina(); });
      }
    });
  }
}
