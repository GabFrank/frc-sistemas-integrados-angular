import { SearchBarService, SearchData, SearchDataResult } from './search-bar.service';
import { FormControl } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-search-bar-dialog',
  templateUrl: './search-bar-dialog.component.html',
  styleUrls: ['./search-bar-dialog.component.scss']
})
export class SearchBarDialogComponent implements OnInit {

  buscarControl = new FormControl('')
  searchDataList: SearchDataResult;

  constructor(private searchBarService: SearchBarService, private matDialogRef: MatDialogRef<SearchBarDialogComponent>) { }

  ngOnInit(): void {
  }

  async onBuscar() {
    console.log('buscando')
    this.searchDataList = await this.searchBarService.onSearch(this.buscarControl.value)
  }

  onClick(item: SearchData) {
    this.searchBarService.openTab(item)
    this.matDialogRef.close()
  }

}
