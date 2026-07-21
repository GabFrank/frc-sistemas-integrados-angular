import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ConfiguracionRrhh } from '../configuracion-rrhh.model';
import { ConfiguracionRrhhService } from '../configuracion-rrhh.service';
import { EditConfiguracionRrhhDialogComponent } from '../edit-configuracion-rrhh-dialog/edit-configuracion-rrhh-dialog.component';
import { ConfigInfoDialogComponent } from '../config-info-dialog/config-info-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-configuracion-rrhh',
  templateUrl: './list-configuracion-rrhh.component.html',
  styleUrls: ['./list-configuracion-rrhh.component.scss']
})
export class ListConfiguracionRrhhComponent implements OnInit {

  @ViewChild(MatTable) table: MatTable<any>;

  readonly ROLES = ROLES;

  displayedColumns = [
    'clave',
    'valor',
    'tipo',
    'descripcion',
    'activo',
    'acciones'
  ];

  buscarControl = new FormControl(null);
  dataSource = new MatTableDataSource<ConfiguracionRrhh>([]);

  constructor(
    private configuracionRrhhService: ConfiguracionRrhhService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) { }

  ngOnInit(): void {
    this.onBuscar();
  }

  onBuscar() {
    const texto = this.buscarControl.value ? this.buscarControl.value.toUpperCase() : null;
    if (texto) {
      this.configuracionRrhhService.onSearch(texto)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.dataSource.data = res || [];
        });
    } else {
      this.configuracionRrhhService.onGetAll()
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.dataSource.data = res || [];
        });
    }
  }

  onLimpiar() {
    this.buscarControl.setValue(null);
    this.onBuscar();
  }

  onNuevo() {
    this.dialog.open(EditConfiguracionRrhhDialogComponent, {
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.onBuscar();
      }
    });
  }

  onInfo(configuracion: ConfiguracionRrhh) {
    this.dialog.open(ConfigInfoDialogComponent, {
      data: { clave: configuracion.clave, valor: configuracion.valor, descripcion: configuracion.descripcion },
      width: '560px'
    });
  }

  onEditar(configuracion: ConfiguracionRrhh) {
    this.dialog.open(EditConfiguracionRrhhDialogComponent, {
      data: { configuracion },
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.onBuscar();
      }
    });
  }

  onEliminar(configuracion: ConfiguracionRrhh) {
    this.dialogosService.confirm(
      'Eliminar configuración',
      '¿Desea eliminar la configuración ' + configuracion.clave + '?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.configuracionRrhhService.onDelete(configuracion.id)
          .pipe(untilDestroyed(this))
          .subscribe(ok => {
            if (ok) {
              this.onBuscar();
            }
          });
      }
    });
  }
}
