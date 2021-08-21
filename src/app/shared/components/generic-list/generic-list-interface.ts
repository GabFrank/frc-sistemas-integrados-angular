import { Type } from '@angular/core';

export interface GenericListInterface {
  add(component: Type<any>, newTabTitle: string, tabTitle: string, parentComponent): void;
  onDelete(e, deleteTitle, deleteQuery): void;
  onSearch(text, searchQuery, sort): void;
  onEdit(obj, query, component: Type<any>, editTabTitle: string, parentComponent): void;
  onSave(input, tab): void;
  onDestroy(): void;
  findById(id, findByIdQuery): void;
}
