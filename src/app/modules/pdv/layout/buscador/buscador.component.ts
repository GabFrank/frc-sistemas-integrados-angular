import { NotificacionColor, NotificacionSnackbarService } from './../../../../notificacion-snackbar.service';
import { BeepService } from './../../../../shared/beep/beep.service';
import { MatDialog } from '@angular/material/dialog';
import { Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { PdvSearchProductoData, PdvSearchProductoDialogComponent, PdvSearchProductoResponseData } from '../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { VentaItem } from '../../../operaciones/venta/venta-item.model';
import { ProductoPorCodigoGQL } from '../../../productos/producto/graphql/productoPorCodigo';
import { Producto } from '../../../productos/producto/producto.model';
import { Observable } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'app-buscador',
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.scss']
})
export class BuscadorComponent implements OnInit {

  @ViewChild('buscadorInput', { static: false }) buscadorInput: ElementRef;

  @Input()
  selectedTipoPrecio;

  @Input()
  tiposPrecios;

  @Input() 
  focusEvent: Observable<void>;

  @Output()
  dialogEvent = new EventEmitter;

  @Output()
  addItemEvent = new EventEmitter;

  @Output()
  crearItemEvent = new EventEmitter;

  formGroup: FormGroup;
  cantidadControl = new FormControl(null, Validators.required)
  buscadorControl = new FormControl(null)
  dialogReference;
  isAudio = true;


  constructor(
    private dialog: MatDialog,
    public getProductoByCodigo: ProductoPorCodigoGQL,
    private beepService: BeepService,
    private notificacionSnackbar: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      'cantidad': this.cantidadControl,
      'buscador': this.buscadorControl
    })
    this.formGroup.get("cantidad").setValue(1);

    this.focusEvent
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.setFocusToInput()
      })
  }

  buscarProductoDialog() {
    let data: PdvSearchProductoData = {
      cantidad: this.formGroup.get("cantidad").value,
      texto: this.formGroup.get("buscador").value,
      selectedTipoPrecio: this.selectedTipoPrecio,
      tiposPrecios: this.tiposPrecios,
      mostrarStock: true,
      mostrarOpciones: true,
    };
    this.dialogReference = this.dialog.open(PdvSearchProductoDialogComponent, {
      height: "98%",
      data,
      autoFocus: false,
      restoreFocus: true,
    });
    this.formGroup.get("buscador").setValue("");
    this.dialogReference.afterClosed().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        let response: PdvSearchProductoResponseData = res;
        this.formGroup.get("cantidad").setValue(response.cantidad);
        let item = new VentaItem();
        item.cantidad = this.formGroup.controls.cantidad.value;
        item.producto = response.producto;
        item.presentacion = response.presentacion;
        item.precioVenta = response.precio;
        this.addItemEvent.emit(item);
      }
      this.dialogReference = undefined;
      this.setFocusToInput()
    });
  }

  onTabPress() {
    let cantidad = this.buscadorControl.value;
    if (!isNaN(cantidad)) {
      this.cantidadControl.setValue(cantidad)
      this.buscadorControl.setValue(null)
      this.setFocusToInput()
    }
  }

  onEnterPress() {
    this.buscarPorCodigo(this.buscadorControl.value)
  }

  buscarPorCodigo(texto: string) {
    let producto: Producto;
    if (texto == null || texto == " " || texto == "") return null;
    this.getProductoByCodigo
      .fetch(
        {
          texto,
        },
        { fetchPolicy: "no-cache", errorPolicy: "all" }
      ).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res.errors == null) {
          producto = res.data.data;
          if (producto != null) {
            this.isAudio ? this.beepService.beep() : null;
            this.crearItemEvent.emit({ producto: producto, texto: texto, cantidad: this.cantidadControl.value });
            this.buscadorControl.setValue(null);
          } else {
            this.isAudio ? this.beepService.boop() : null;
            this.buscarProductoDialog();
            this.notificacionSnackbar.notification$.next({
              texto: "Producto no encontrado",
              color: NotificacionColor.warn,
              duracion: 2,
            });
          }
        }
        this.setFocusToInput()
      });
  }

  setFocusToInput() {
    setTimeout(() => {
      this.buscadorInput.nativeElement.focus();
    }, 1000);
  }

}
