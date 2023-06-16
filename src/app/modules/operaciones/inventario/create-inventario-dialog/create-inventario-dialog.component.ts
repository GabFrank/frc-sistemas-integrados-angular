import { untilDestroyed } from '@ngneat/until-destroy';
import { InventarioService } from './../inventario.service';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogosService } from './../../../../shared/components/dialogos/dialogos.service';
import { Inventario, InventarioEstado } from './../inventario.model';
import { NotificacionColor, NotificacionSnackbarService } from './../../../../notificacion-snackbar.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { SectorService } from './../../../empresarial/sector/sector.service';
import { sectoresSearch } from './../../../empresarial/sector/graphql/graphql-query';
import { MainService } from './../../../../main.service';
import { FormControl, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { TipoInventario } from '../inventario.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';

@UntilDestroy()
@Component({
  selector: 'app-create-inventario-dialog',
  templateUrl: './create-inventario-dialog.component.html',
  styleUrls: ['./create-inventario-dialog.component.scss']
})
export class CreateInventarioDialogComponent implements OnInit {

  tipoInventarioControl = new FormControl(TipoInventario.ZONA, Validators.required)

  tipoInventarioList = Object.values(TipoInventario)

  responsable: Usuario;

  constructor(
    private mainService: MainService,
    private sectorService: SectorService,
    private notificacionService: NotificacionSnackbarService,
    private dialogoService: DialogosService,
    private matDialogRef: MatDialogRef<CreateInventarioDialogComponent>,
    private inventarioService: InventarioService
    ) {
    this.responsable = mainService.usuarioActual;
  }

  ngOnInit(): void {

  }

  onIniciarInventario(){
    this.sectorService.onGetSectores(this.mainService.sucursalActual.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if(res.length==0){
          this.notificacionService.notification$.next({
            texto: 'No hay sectores ni zonas registradas.',
            color: NotificacionColor.warn,
            duracion: 3
          })
        } else {
          this.dialogoService.confirm('Realmente desea iniciar la sesión de inventario?', null).subscribe(res => {
            if(res){
              let inventario = new Inventario()
              inventario.abierto = true;
              inventario.estado = InventarioEstado.ABIERTO
              inventario.fechaInicio = new Date()
              inventario.sucursal = this.mainService.sucursalActual
              inventario.tipo = this.tipoInventarioControl.value
              this.inventarioService.onSaveInventario(inventario.toInput())
                .pipe(untilDestroyed(this))
                .subscribe(res2 => {
                  if(res2!=null){
                    this.matDialogRef.close(res2)
                  }
                })
            }
          })
        }
      })
  }

  onCancel(){
    this.matDialogRef.close(null)
  }

}
