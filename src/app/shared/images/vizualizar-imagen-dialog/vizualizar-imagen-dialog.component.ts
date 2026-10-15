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
      this.img = reader.result as string;
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
            this.img = res;
            // La mutation devuelve un Boolean: la foto a mostrar es la recortada.
            this.presentacionService.onImageSave(
              res,
              `${id}.jpg`
            ).pipe(untilDestroyed(this)).subscribe({
              error: (error) => {
                console.error('Error al guardar imagen:', error);
              }
            });
          }
        });
    };
    reader.readAsDataURL(file);
  }

}
