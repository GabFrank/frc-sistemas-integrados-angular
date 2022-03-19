import { Component, Inject, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface QrCodeDialogData {
  nombre: any;
  codigo: any;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.scss']
})
export class QrCodeComponent implements OnInit {

  value = '';
  isQrShow = true;
  isImageLoaded = false;
  isWaiting = false;
  

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QrCodeDialogData,
    public dialogRef: MatDialogRef<QrCodeComponent>, 
    private store: AngularFirestore,
    private storage: AngularFireStorage
  ) { 
    this.value = encodeURI(`https://franco-system.firebaseapp.com/${data.nombre}/${data.codigo}`)
    console.log(this.value)
  }

  ngOnInit(): void {
    setInterval(() => {
      this.onRefresh()
    }, 1000);
  }

  onRefresh(){
    // let ref = this.storage.ref(`productos/${this.data.codigo}`).getDownloadURL().subscribe(res => {
      let ref = this.storage.ref(`productos/${this.data.codigo}`).getDownloadURL().pipe(untilDestroyed(this)).subscribe(res => {
        this.isWaiting = true;
        this.isQrShow = false;
        if(res!=null){
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = (event) => {
          if(xhr.response!=null){
            this.dialogRef.close(xhr.response)
          } else {
            this.isQrShow = true;
            this.isWaiting = false;
          }
        }
        xhr.open('GET', res);
        xhr.send()
        
      }
    })
  }

}
