import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CajaBalance } from '../caja.model';

interface MostrarBalanceData {
  balance: CajaBalance
}
@Component({
  selector: 'app-mostrar-balance-dialog',
  templateUrl: './mostrar-balance-dialog.component.html',
  styleUrls: ['./mostrar-balance-dialog.component.scss']
})
export class MostrarBalanceDialogComponent implements OnInit {

  selectedBalance: CajaBalance

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MostrarBalanceData,
    private matDialogRef: MatDialogRef<MostrarBalanceDialogComponent>,
  ) { }

  ngOnInit(): void {
    console.log(this.data);
    if(this.data.balance!=null){
      this.selectedBalance = this.data.balance;
    }
  }
}
