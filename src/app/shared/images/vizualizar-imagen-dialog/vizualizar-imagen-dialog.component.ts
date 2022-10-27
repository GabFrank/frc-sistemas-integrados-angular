import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Presentacion } from '../../../modules/productos/presentacion/presentacion.model';
import { PresentacionService } from '../../../modules/productos/presentacion/presentacion.service';
import { CortarImagenDialogComponent } from '../../cortar-imagen-dialog/cortar-imagen-dialog.component';
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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VizualizarImagenData,
    private matDialogRef: MatDialogRef<VizualizarImagenDialogComponent>,
    private presentacionService: PresentacionService,
    private matDialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.img = this.data?.entity?.imagenPrincipal;
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
          if (res != null) this.img = res;
          this.presentacionService.onImageSave(
            res,
            `${id}.jpg`
          ).pipe(untilDestroyed(this)).subscribe(res2 => {
            if(res2!=null){
              this.img = res2;
            }
          });
        });
    };
    reader.readAsDataURL(file);
  }

}
