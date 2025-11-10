import { untilDestroyed } from '@ngneat/until-destroy';
import { InventarioService } from './../inventario.service';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { DialogosService } from './../../../../shared/components/dialogos/dialogos.service';
import { Inventario, InventarioEstado, TipoInventario } from './../inventario.model';
import { NotificacionColor, NotificacionSnackbarService } from './../../../../notificacion-snackbar.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { SectorService } from './../../../empresarial/sector/sector.service';
import { MainService } from './../../../../main.service';
import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Sucursal } from './../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from './../../../empresarial/sucursal/sucursal.service';

@UntilDestroy()
@Component({
  selector: 'app-create-inventario-dialog',
  templateUrl: './create-inventario-dialog.component.html',
  styleUrls: ['./create-inventario-dialog.component.scss']
})
export class CreateInventarioDialogComponent implements OnInit {

  selectedSucursal: Sucursal;
  responsable: Usuario;
  tipoInventario: TipoInventario = TipoInventario.ZONA;
  sucursalNombre: string = 'No seleccionada';
  responsableNombre: string = 'No disponible';

  constructor(
    private mainService: MainService,
    private sectorService: SectorService,
    private notificacionService: NotificacionSnackbarService,
    private dialogoService: DialogosService,
    private matDialogRef: MatDialogRef<CreateInventarioDialogComponent>,
    private inventarioService: InventarioService,
    private sucursalService: SucursalService,
    private matDialog: MatDialog
  ) {
    this.responsable = mainService.usuarioActual;
    this.updateResponsableNombre();
  }

  ngOnInit(): void {
    if (this.mainService.sucursalActual) {
      this.setSelectedSucursal(this.mainService.sucursalActual, false);
    }
  }

  private setSelectedSucursal(sucursal: Sucursal, verificarInventario: boolean = true): void {
    this.selectedSucursal = sucursal;
    this.updateSucursalNombre();
    if (verificarInventario && sucursal) {
      this.verificarInventarioAbierto(sucursal.id);
    }
  }

  private updateSucursalNombre(): void {
    this.sucursalNombre = this.selectedSucursal?.nombre || 'No seleccionada';
  }

  private updateResponsableNombre(): void {
    this.responsableNombre = this.responsable?.persona?.nombre || 'No disponible';
  }

  onSelectSucursal(): void {
    this.sucursalService.openSearchDialog('Seleccionar Sucursal', 'Seleccione la sucursal para el inventario')
      .pipe(untilDestroyed(this))
      .subscribe((sucursal: Sucursal) => {
        if (sucursal) {
          this.setSelectedSucursal(sucursal, true);
        }
      });
  }

  verificarInventarioAbierto(sucursalId: number): void {
    this.inventarioService.onGetInventarioAbiertoPorSucursal(sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe((inventariosAbiertos: Inventario[]) => {
        if (inventariosAbiertos && inventariosAbiertos.length > 0) {
          this.notificacionService.notification$.next({
            texto: `Hay un inventario abierto en la sucursal ${this.selectedSucursal.nombre}. Por favor, finalícelo antes de crear uno nuevo.`,
            color: NotificacionColor.warn,
            duracion: 5
          });
        }
      });
  }

  onIniciarInventario(): void {
    if (!this.selectedSucursal) {
      this.notificacionService.notification$.next({
        texto: 'Debe seleccionar una sucursal',
        color: NotificacionColor.warn,
        duracion: 3
      });
      return;
    }
    this.dialogoService.confirm('Atención!!', 'Estás iniciando un nuevo inventario. ¿Deseas continuar?').subscribe(resConf => {
      if (resConf) {
        let inventario = new Inventario();
        inventario.abierto = true;
        inventario.estado = InventarioEstado.ABIERTO;
        inventario.sucursal = this.selectedSucursal;
        inventario.tipo = TipoInventario.ZONA;
        inventario.usuario = this.responsable;

        this.inventarioService.onSaveInventario(inventario.toInput())
          .pipe(untilDestroyed(this))
          .subscribe(res2 => {
            if (res2 != null) {
              this.notificacionService.notification$.next({
                texto: 'Inventario creado con éxito',
                color: NotificacionColor.success,
                duracion: 3
              });
              this.matDialogRef.close(res2);
            }
          });
      }
    });
  }

  onCancel(): void {
    this.matDialogRef.close(null);
  }
}
