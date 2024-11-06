import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Maletin, MaletinInput } from "../maletin.model";
import { MaletinService } from "../maletin.service";

export class AdicionarMaletinData {
  maletin?: Maletin;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-adicionar-maletin-dialog",
  templateUrl: "./adicionar-maletin-dialog.component.html",
  styleUrls: ["./adicionar-maletin-dialog.component.scss"],
})
export class AdicionarMaletinDialogComponent implements OnInit {
  idControl = new FormControl();
  descripcionControl = new FormControl(null, Validators.required);
  activoControl = new FormControl(true);
  abiertoControl = new FormControl(false);
  creadoEnControl = new FormControl();
  usuarioControl = new FormControl();
  selectedMaletin: Maletin;
  sucursalControl = new FormControl(null, [Validators.required]);
  sucursalList: Sucursal[] = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarMaletinData,
    private matDialogRef: MatDialogRef<AdicionarMaletinDialogComponent>,
    private maletinService: MaletinService,
    private sucursalService: SucursalService
  ) {
    if (data?.maletin != null) {
      this.selectedMaletin = data.maletin;
      this.cargarDatos();
    }
  }

  ngOnInit(): void {
    this.idControl.disable();
    this.creadoEnControl.disable();
    this.usuarioControl.disable();
    this.sucursalService
      .onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.sucursalList = res;
      });
  }

  cargarDatos() {
    this.idControl.setValue(this.selectedMaletin.id);
    this.descripcionControl.setValue(this.selectedMaletin.descripcion);
    this.activoControl.setValue(this.selectedMaletin.activo);
    this.abiertoControl.setValue(this.selectedMaletin.abierto);
    this.creadoEnControl.setValue(this.selectedMaletin.creadoEn);
    this.usuarioControl.setValue(this.selectedMaletin.usuario.persona.nombre);
  }

  onSave() {
    let maletin = new Maletin();
    if (this.selectedMaletin != null) {
      Object.assign(this.selectedMaletin, maletin);
    }
    maletin.abierto = this.abiertoControl.value;
    maletin.activo = this.activoControl.value;
    maletin.descripcion = this.descripcionControl.value;
    maletin.sucursal = this.sucursalControl.value;
    this.maletinService.onSave(maletin.toInput()).subscribe((res) => {
      if (res != null) {
        this.matDialogRef.close(res);
      }
    });
  }

  onCancel() {
    this.matDialogRef.close();
  }
}
