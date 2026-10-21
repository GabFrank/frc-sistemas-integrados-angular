import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DOC_ORIENTATION, NgxImageCompressService } from 'ngx-image-compress';
import { ImageCroppedEvent } from 'ngx-image-cropper';


const LADO_MAXIMO = 1200;

export interface CortarImagenData {
  /** Evento `change` de un input de archivo. */
  imagen?: any;
  /** La imagen ya leída, como data URL (p. ej. una foto bajada de internet). */
  imagenBase64?: string;
}

@Component({
  selector: 'app-cortar-imagen-dialog',
  templateUrl: './cortar-imagen-dialog.component.html',
  styleUrls: ['./cortar-imagen-dialog.component.scss']
})
export class CortarImagenDialogComponent implements OnInit {

  imageChangedEvent = '';
  imageBase64 = '';
  isCropping = false;
  croppedImage = '';
  isSend = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CortarImagenData,
    public dialogRef: MatDialogRef<CortarImagenDialogComponent>,
    private imageCompress : NgxImageCompressService,
    private copyToClip: Clipboard
  ) {
    const original = data.imagenBase64 != null ? Promise.resolve(data.imagenBase64) : this.leerArchivo(data.imagen);
    original
      .then((b64) => this.encuadrar(b64))
      .then((cuadrada) => {
        this.imageBase64 = cuadrada;
        this.isCropping = true;
      })
      .catch(() => {
        // No se pudo encuadrar: el recorte de siempre, con la imagen tal cual.
        if (data.imagenBase64 != null) {
          this.imageBase64 = data.imagenBase64;
          this.isCropping = true;
        } else {
          this.fileChangeEvent(data.imagen);
        }
      });
  }

  private leerArchivo(event: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const file: File = event?.target?.files?.[0];
      if (file == null) return reject();
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * La foto entera dentro de un cuadrado blanco. El recorte es 1:1 y arranca con el cuadrado más grande que entra:
   * sobre una foto alargada (una lata, una botella) cortaba arriba y abajo; sobre el cuadrado abarca todo. El
   * lado queda en hasta {@link LADO_MAXIMO} px, de sobra para el POS y el kiosco.
   */
  private encuadrar(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const mayor = Math.max(img.naturalWidth, img.naturalHeight);
        if (mayor === 0) return reject();
        const lado = Math.min(mayor, LADO_MAXIMO);
        const escala = lado / mayor;
        const ancho = Math.round(img.naturalWidth * escala);
        const alto = Math.round(img.naturalHeight * escala);
        const canvas = document.createElement('canvas');
        canvas.width = lado;
        canvas.height = lado;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, lado, lado);
        ctx.drawImage(img, Math.round((lado - ancho) / 2), Math.round((lado - alto) / 2), ancho, alto);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  ngOnInit(
  ): void {
  }

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
    this.isCropping = true;
  }
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;

  //   this.imageCompress.compressFile(this.croppedImage, DOC_ORIENTATION.NotDefined, 50, 50).then(res =>{
  //     console.warn('Size in bytes was:', this.imageCompress.byteCount(this.croppedImage));
  //     this.croppedImage = res
  //     console.warn('Size in bytes is now:', this.imageCompress.byteCount(this.croppedImage));
  // })
  }

  imageLoaded() {
    // this.btnNewCapture = false;
    // this.btnAccept = true;
    // this.btnCancel = true;
    // this.isCropping = true;
  }
  cropperReady() {}
  loadImageFailed() {
    // show message
  }

  onCancelar() {
    this.dialogRef.close(null);
  }
  onAceptar() {
    this.isCropping = false;
    this.isSend = true;
  }
  onSend() {
    this.dialogRef.close(this.croppedImage)
  }

}
