import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, FormControlName, FormGroup } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSelect } from "@angular/material/select";
import { MatTableDataSource } from "@angular/material/table";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { UsuarioService } from "../../../personas/usuarios/usuario.service";
import { EntradaItem } from "../entrada-item/entrada-item.model";
import { Entrada, EntradaInput, TipoEntrada } from "../entrada.model";
import { EntradaService } from "../entrada.service";

export interface EntradaDialogData {
  entrada: Entrada;
}

@Component({
  selector: "app-entrada-dialog",
  templateUrl: "./entrada-dialog.component.html",
  styleUrls: ["./entrada-dialog.component.scss"],
})
export class EntradaDialogComponent implements OnInit {
  @ViewChild("responsableInput", { static: true }) responsableInput: ElementRef;
  @ViewChild("tipoEntradaSelect", { static: true })
  tipoEntradaSelect: MatSelect;

  selectedEntrada: Entrada;
  responsableCargaControl = new FormControl();
  tipoEntradaControl = new FormControl(TipoEntrada.COMPRA);
  sucursalControl = new FormControl();
  observacionControl = new FormControl();
  formGroup: FormGroup;
  usuarioInputControl = new FormControl();
  usuarioList: Usuario[];
  timer = null;
  selectedResponsable: Usuario;
  tipoEntradasList: any[];
  selectedTipoEntrada: TipoEntrada;
  sucursalList: Sucursal[];
  filteredSucursalList: Sucursal[];
  selectedSucursal: Sucursal;
  dataSource = new MatTableDataSource<EntradaItem>(null);
  displayedColumns = [
    "id",
    "producto",
    "codigo",
    "presentacion",
    "cantidad",
    "accion",
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EntradaDialogData,
    private matDialogRef: MatDialogRef<EntradaDialogComponent>,
    private usuarioService: UsuarioService,
    private sucursalService: SucursalService,
    private entradaService: EntradaService
  ) {}

  ngOnInit(): void {
    //inicializar arrays
    this.usuarioList = [];
    this.tipoEntradasList = [];
    this.sucursalList = [];

    this.createForm();
    this.buscarSucursales();

    //listeners de los controls
    this.usuarioInputControl.valueChanges.subscribe((res) => {
      if (this.timer != null) {
        clearTimeout(this.timer);
      }
      if (res.length != 0) {
        this.timer = setTimeout(() => {
          this.usuarioService.onSeachUsuario(res).subscribe((response) => {
            this.usuarioList = response["data"];
            if (this.usuarioList.length == 1) {
              this.selectedResponsable = this.usuarioList[0];
              this.usuarioInputControl.setValue(
                this.selectedResponsable.id +
                  " - " +
                  this.selectedResponsable.persona.nombre
              );
              this.onResponsableAutocompleteClose();
            } else {
              this.selectedResponsable = null;
            }
          });
        }, 500);
      } else {
        this.usuarioList = [];
      }
    });

    this.cargarDatos();
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("responsableCarga", this.responsableCargaControl);
    this.formGroup.addControl("tipoEntrada", this.tipoEntradaControl);
    this.formGroup.addControl("sucursal", this.sucursalControl);
    this.formGroup.addControl("observacion", this.observacionControl);
    this.formGroup.addControl("observacion", this.observacionControl);

    this.tipoEntradasList = Object.values(TipoEntrada);
  }

  buscarSucursales() {
    this.sucursalService.onGetAllSucursales().subscribe((res) => {
      this.sucursalList = res.sort((a, b) => {
        if (a.nombre < b.nombre) {
          return -1;
        } else {
          return 1;
        }
      });
    });
  }

  cargarDatos() {
    if (this.data?.entrada != null) {
      this.selectedEntrada = this.data.entrada;
      if (this.data.entrada.responsableCarga != null) {
        this.usuarioInputControl.setValue(
          this.data.entrada.id +
            " - " +
            this.data.entrada.responsableCarga?.persona.nombre
        );
        this.selectedResponsable = this.data.entrada.responsableCarga;
      }
      if (this.data.entrada.tipoEntrada != null) {
        this.onSelectTipoEntrada(this.data.entrada.tipoEntrada);
      }
      if (this.data.entrada.sucursal != null) {
        if (this.sucursalList.length == 0)
          this.sucursalList.push(this.data.entrada.sucursal);
        this.onSelectSucursal(this.data.entrada.sucursal);
      }
    }
  }

  onSelectSucursal(e) {
    this.selectedSucursal = this.sucursalList.find(
      (u) => u.id == e?.option?.id
    );
  }

  onUsuarioInput() {}

  onResponsableSelect(e) {
    this.selectedResponsable = this.usuarioList.find(
      (u) => u.id == e?.option?.id
    );
  }

  onResponsableAutocompleteClose() {
    setTimeout(() => {
      this.responsableInput.nativeElement.select();
    }, 0);
  }

  onSelectTipoEntrada(e) {
    this.selectedTipoEntrada = this.tipoEntradasList[e.value] as TipoEntrada;
    console.log(this.selectedTipoEntrada);
  }

  setFocusToTipoEntrada() {
    setTimeout(() => {
      this.tipoEntradaSelect._elementRef.nativeElement.focus();
    }, 0);
  }

  onEdit(e: EntradaItem) {}

  onDelete(e: EntradaItem) {}

  onSaveEntrada() {
    let entrada = new Entrada();
    entrada.id = this.data?.entrada.id;
    entrada.responsableCarga = this.selectedResponsable;
    entrada.tipoEntrada = this.selectedTipoEntrada;
    entrada.sucursal = this.selectedSucursal;
    this.entradaService.onSaveEntrada(entrada.toInput()).subscribe((res) => {
      console.log(res);
    });
  }

  addProducto(){
    console.log('dirty', this.formGroup.dirty)
    console.log('touched', this.formGroup.touched)
    console.log('pristine', this.formGroup.pristine)
  }
}
