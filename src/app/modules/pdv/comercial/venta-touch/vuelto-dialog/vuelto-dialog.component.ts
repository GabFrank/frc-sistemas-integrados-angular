import { ViewChild } from '@angular/core';
import { Component, Inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MonedasGetAllGQL } from '../../../../../modules/financiero/moneda/graphql/monedasGetAll';
import { Moneda } from '../../../../../modules/financiero/moneda/moneda.model';

export class VueltoDialogData {
  valor: number;
  moneda: Moneda;
}

@Component({
  selector: 'app-vuelto-dialog',
  templateUrl: './vuelto-dialog.component.html',
  styleUrls: ['./vuelto-dialog.component.css'],
})
export class VueltoDialogComponent implements OnInit {
  @ViewChild('okButton', { static: false, read: MatButton })
  okButton: MatButton;
  @ViewChild('cancelButton', { static: false, read: MatButton })
  cancelButton: MatButton;

  monedas: Moneda[];
  selectedMoneda: Moneda;

  constructor(
    private getMoneda: MonedasGetAllGQL,
    @Inject(MAT_DIALOG_DATA) public data: VueltoDialogData,
    public dialogRef: MatDialogRef<VueltoDialogComponent>
  ) {
    this.selectedMoneda = data.moneda;
  }

  ngOnInit(): void {
    this.getMoneda.fetch().subscribe((res) => {
      if (!res.errors) {
        this.monedas = res.data.data;
      }
    });

    setTimeout(() => {
      this.okButton._elementRef.nativeElement.focus()
    }, 0);
  }

  setMoneda(moneda) {
    this.selectedMoneda = this.monedas.find((m) => m.denominacion == moneda);
  }

  onOtrasMonedasClick() {}

  okKeydownEvent(e: KeyboardEvent) {
    if (e.key == 'ArrowRight' || e.key == 'ArrowLeft') {
      this.cancelButton._elementRef.nativeElement.focus();
    }
    // this.setFocusToOkButton()
  }

  cancelKeydownEvent(e: KeyboardEvent) {
    if (e.key == 'ArrowRight' || e.key == 'ArrowLeft') {
      this.okButton._elementRef.nativeElement.focus()
    }
    // this.setFocusToOkButton()
  }

  onClose(){

  }

  setFocusToOkButton(){
    this.okButton._elementRef.nativeElement.focus()
  }
}
