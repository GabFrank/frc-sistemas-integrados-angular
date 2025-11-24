import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
  selector: "app-gestion-de-dialog",
  templateUrl: "./gestion-de-dialog.component.html",
  styleUrls: ["./gestion-de-dialog.component.scss"],
})
export class GestionDeDialogComponent implements OnInit {
  selectedTabIndex = 0;

  constructor(
    private matDialogRef: MatDialogRef<GestionDeDialogComponent>
  ) {}

  ngOnInit(): void {}

  onClose(): void {
    this.matDialogRef.close();
  }
}

