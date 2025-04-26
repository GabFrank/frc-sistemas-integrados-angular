import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImageDialogComponent } from './image-dialog.component';

@Directive({
    selector: '[frcPrevisualizarImagen]'
})
export class PrevisualizarImgenDirective {

    @Input('frcPrevisualizarImagen') imageUrl: string;

    constructor(private el: ElementRef, public dialog: MatDialog) { }

    @HostListener('click') onMouseClick() {
        this.dialog.open(ImageDialogComponent, {
            data: { image: this.imageUrl },
            width: '500px', // specify the dialog width
            panelClass: 'custom-dialog-container'
        });
    }
}
