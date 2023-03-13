import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { icons } from '../../commons/core/icons';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-select-icon-dialog',
  templateUrl: './select-icon-dialog.component.html',
  styleUrls: ['./select-icon-dialog.component.scss']
})
export class SelectIconDialogComponent implements OnInit {

  iconsList: string[] = icons;
  searchControl = new FormControl();
  filteredIconsList : string[]
  constructor(
    private dialogRef: MatDialogRef<SelectIconDialogComponent>
  ) { }

  ngOnInit(): void {
    this.filteredIconsList = this.iconsList;

    this.searchControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.searchIcon(res);
    })
  }

  searchIcon(text){
    this.filteredIconsList = this.iconsList.filter(i => i.toUpperCase().includes(text.toUpperCase()))
  }

  selectIcon(icon){
    this.dialogRef.close(icon)
  }

}
