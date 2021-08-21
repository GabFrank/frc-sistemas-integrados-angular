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
    this.data.action = true;
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      console.log(this.okButton);
      this.okButton._elementRef.nativeElement.focus();
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
