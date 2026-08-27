import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Cargo } from '../cargo.model';
import { CargoService } from '../cargo.service';
import { EditCargoDialogComponent } from '../edit-cargo-dialog/edit-cargo-dialog.component';

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

  constructor(
    private cargoService: CargoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) { }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar() {
    const texto = this.textoControl.value;
    const obs = texto ? this.cargoService.onSearch(texto) : this.cargoService.onGetAll();
    obs.pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) { this.dataSource.data = res || []; }
    });
  }

  onResetFiltro() {
    this.textoControl.setValue(null);
    this.onFiltrar();
  }

  onNuevo() {
    this.dialog.open(EditCargoDialogComponent, { width: '520px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onEditar(cargo: Cargo) {
    this.dialog.open(EditCargoDialogComponent, { data: { cargo }, width: '520px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onEliminar(cargo: Cargo) {
    this.dialogosService.confirm(
      'Eliminar cargo', '¿Desea eliminar el cargo ' + cargo.nombre + '?',
      'Si hay funcionarios con este cargo, historico o subcargos, el backend lo rechaza y te lo dice.',
      null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.cargoService.onDelete(cargo.id)
          .pipe(untilDestroyed(this)).subscribe(ok => { if (ok) this.onFiltrar(); });
      }
    });
  }
}
