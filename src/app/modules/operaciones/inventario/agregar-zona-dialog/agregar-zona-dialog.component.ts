import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Inventario, InventarioProducto } from '../inventario.model';
import { Sector } from '../../../empresarial/sector/sector.model';
import { Zona } from '../../../empresarial/zona/zona.model';
import { SectorService } from '../../../empresarial/sector/sector.service';
import { InventarioService } from '../inventario.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { MainService } from '../../../../main.service';

export interface AgregarZonaDialogData {
  inventario: Inventario;
}

@UntilDestroy()
@Component({
  selector: 'app-agregar-zona-dialog',
  templateUrl: './agregar-zona-dialog.component.html',
  styleUrls: ['./agregar-zona-dialog.component.scss']
})
export class AgregarZonaDialogComponent implements OnInit {

  sectorControl = new FormControl(null, Validators.required);
  zonaControl = new FormControl(null, Validators.required);

  sectorList: Sector[] = [];
  zonaList: Zona[] = [];
  zonasYaAgregadas: number[] = [];

  constructor(
    public dialogRef: MatDialogRef<AgregarZonaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AgregarZonaDialogData,
    private sectorService: SectorService,
    private inventarioService: InventarioService,
    private notificacionService: NotificacionSnackbarService,
    private mainService: MainService
  ) { }

  ngOnInit(): void {
    // Deshabilitar zona inicialmente hasta que se seleccione un sector
    this.zonaControl.disable();
    this.cargarSectores();
    this.cargarZonasYaAgregadas();
  }

  private cargarSectores() {
    const sucursalId = this.data.inventario.sucursal?.id;
    if (!sucursalId) {
      this.notificacionService.openWarn('No se encontró la sucursal del inventario');
      return;
    }

    this.sectorService.onGetSectores(sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.sectorList = res.filter(s => s.activo);
        }
      });
  }

  private cargarZonasYaAgregadas() {
    if (this.data.inventario.inventarioProductoList) {
      this.zonasYaAgregadas = this.data.inventario.inventarioProductoList
        .map(ip => ip.zona?.id)
        .filter(id => id != null);
    }
  }

  onSectorChange() {
    const sector = this.sectorControl.value;
    if (sector?.zonaList) {
      // Filtrar zonas que no han sido agregadas
      this.zonaList = sector.zonaList.filter(z => 
        z.activo && !this.zonasYaAgregadas.includes(z.id)
      );
      
      if (this.zonaList.length === 0) {
        this.notificacionService.openWarn('Todas las zonas de este sector ya fueron agregadas');
        this.zonaControl.disable();
      } else {
        this.zonaControl.enable();
      }
      
      this.zonaControl.setValue(null);
    } else {
      this.zonaList = [];
      this.zonaControl.disable();
    }
  }

  onGuardar() {
    if (this.sectorControl.invalid || this.zonaControl.invalid) {
      this.notificacionService.openWarn('Debe seleccionar un sector y una zona');
      return;
    }

    const inventarioProducto = new InventarioProducto();
    inventarioProducto.inventario = this.data.inventario;
    inventarioProducto.zona = this.zonaControl.value;
    inventarioProducto.concluido = false;
    inventarioProducto.usuario = this.mainService.usuarioActual;

    const input = inventarioProducto.toInput();

    this.inventarioService.onSaveInventarioProducto(input)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.notificacionService.openSucess('Zona agregada correctamente');
          // Devolver el inventarioProducto creado para seleccionarlo automáticamente
          this.dialogRef.close(res);
        }
      });
  }

  onCancelar() {
    this.dialogRef.close(false);
  }

}

