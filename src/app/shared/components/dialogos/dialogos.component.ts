import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export class DialogoData {
  public title: string;
  public message1?: string;
  public message2?: string;
  public listMessages?: string[];
  public action?: boolean = true;
  public btn1Name?: string = 'Si';
  public btn2Name?: string = 'No';
}

@Component({
  selector: 'app-dialogos',
  templateUrl: './dialogos.component.html',
  styleUrls: ['./dialogos.component.css'],
})
export class DialogosComponent implements OnInit, AfterViewInit {
  @ViewChild('okButton', { static: false, read: MatButton })
  okButton: MatButton;
  @ViewChild('okButton2', { static: false, read: MatButton })
  okButton2: MatButton;
  @ViewChild('cancelButton', { static: false, read: MatButton })
  cancelButton: MatButton;

  constructor(
    public dialogRef: MatDialogRef<DialogosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogoData
  ) {
    if(data.btn1Name==null)data.btn1Name = 'Si';
    if(data.btn2Name==null)data.btn2Name = 'No';
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      if(this.data?.action != false){
        this.okButton._elementRef.nativeElement.focus();
      } else {
        this.okButton2._elementRef.nativeElement.focus();
      }
    }, 0);
  }

  okKeydownEvent(e: KeyboardEvent) {
    if (e.key == 'ArrowRight' || e.key == 'ArrowLeft') {
      this.cancelButton._elementRef.nativeElement.focus();
    }
  }

  cancelKeydownEvent(e: KeyboardEvent) {
    if (e.key == 'ArrowRight' || e.key == 'ArrowLeft') {
      this.data.action
        ? this.okButton._elementRef.nativeElement.focus()
        : this.okButton2._elementRef.nativeElement.focus();
    }
  }
}
