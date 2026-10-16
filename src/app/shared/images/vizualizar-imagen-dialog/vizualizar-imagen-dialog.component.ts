import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Presentacion } from '../../../modules/productos/presentacion/presentacion.model';
import { PresentacionService } from '../../../modules/productos/presentacion/presentacion.service';
import { CortarImagenDialogComponent } from '../../cortar-imagen-dialog/cortar-imagen-dialog.component';
import {
  SugerenciasImagenPanelComponent,
  SugerenciasImagenPanelData,
  SUGERENCIAS_IMAGEN_PANEL_CONFIG,
} from '../../../modules/productos/presentacion/sugerencias-imagen-panel/sugerencias-imagen-panel.component';
import { ImagesService } from '../images.service';

export class VizualizarImagenData {
  entity: any;
  service: any;
  url: string;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { avisoTrasMutacion, erroresDeRechazo } from '../../../commons/core/utils/graphqlErrorUtils';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-vizualizar-imagen-dialog',
  templateUrl: './vizualizar-imagen-dialog.component.html',
  styleUrls: ['./vizualizar-imagen-dialog.component.scss']
})
export class VizualizarImagenDialogComponent implements OnInit {

  img: string;
  /** Las sugerencias de internet son por presentación. */
  esPresentacion = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VizualizarImagenData,
    private matDialogRef: MatDialogRef<VizualizarImagenDialogComponent>,
    private presentacionService: PresentacionService,
    private matDialog: MatDialog,
    private notificacionService: NotificacionSnackbarService,
  ) { }

  ngOnInit(): void {
    this.img = this.data?.entity?.imagenPrincipal;
    this.esPresentacion = this.data?.url === 'productos/presentaciones' && this.data?.entity?.id != null;
  }

  /** Panel de fotos de internet; la elegida ya vuelve guardada. */
  onBuscarEnInternet() {
    const data: SugerenciasImagenPanelData = {
      presentacion: this.data.entity,
      producto: this.data.entity?.producto,
    };
    this.matDialog
      .open(SugerenciasImagenPanelComponent, { ...SUGERENCIAS_IMAGEN_PANEL_CONFIG, data })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((imagen: string) => {
        if (imagen != null) this.img = imagen;
      });
  }

  onCancelar(){
    let entity: any;
    entity = this.data.entity;
    entity.imagenPrincipal = this.img
    this.matDialogRef.close(entity)
  }

  onFileInput(e: any, id?: number) {
    let file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      // La vista previa cambia recién con la imagen guardada: al cerrar se devuelve this.img como imagenPrincipal, y antes
      // podía devolver una foto que no se guardó (corte, false o recorte cancelado) (#501)
      this.matDialog
        .open(CortarImagenDialogComponent, {
          data: {
            imagen: e,
          },
          width: "50%",
          height: "50%",
          disableClose: false,
        })
        .afterClosed().pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            // La mutation devuelve un Boolean: la foto a mostrar es la recortada.
            this.presentacionService.onImageSave(
              res,
              `${id}.jpg`
            ).pipe(untilDestroyed(this)).subscribe({
              next: (ok) => {
                if (ok === true) {
                  this.img = res;
                } else {
                  this.notificacionService.openWarn('No se pudo guardar la imagen. Volvé a subirla.');
                }
              },
              // En un rechazo el genérico ya mostró el motivo. Sin respuesta pudo guardarse; subirla otra vez la pisa
              error: (error) => {
                console.error('Error al guardar imagen:', error);
                const aviso = erroresDeRechazo(error) == null ? avisoTrasMutacion(error, 'se guardó la imagen') : null;
                if (aviso != null) {
                  this.notificacionService.openWarn(aviso, 8);
                }
              }
            });
          }
        });
    };
    reader.readAsDataURL(file);
  }

}
