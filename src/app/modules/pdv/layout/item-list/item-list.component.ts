import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {

  @Input()
  itemList;

  @Output()
  editEvent = new EventEmitter;

  @Output()
  removeEvent = new EventEmitter;
  constructor() { }

  ngOnInit(): void {
  }

  editItem(item, i){
    this.editEvent.emit({item, i})
  }

  removeItem(item, i){
    this.removeEvent.emit({item, i})
  }

}
