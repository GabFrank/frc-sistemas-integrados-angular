import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DOC_ORIENTATION, NgxImageCompressService } from 'ngx-image-compress';
import { ImageCroppedEvent } from 'ngx-image-cropper';


export interface CortarImagenData {
  imagen: string;
}

@Component({
  selector: 'app-cortar-imagen-dialog',
  templateUrl: './cortar-imagen-dialog.component.html',
  styleUrls: ['./cortar-imagen-dialog.component.scss']
})
export class CortarImagenDialogComponent implements OnInit {

  imageChangedEvent = '';
  isCropping = false;
  croppedImage = '';
  isSend = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CortarImagenData,
    public dialogRef: MatDialogRef<CortarImagenDialogComponent>,
    private imageCompress : NgxImageCompressService,
    private copyToClip: Clipboard
  ) {
    this.fileChangeEvent(data.imagen)
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
