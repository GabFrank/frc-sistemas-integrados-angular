import { Type } from '@angular/core';
import { TabData } from './tab.service';
export class Tab {
public id: number;
public title: string;
public tabData: TabData;
public active: boolean;
public component: Type<any>;
public parentComponent: Type<any>;
constructor(component: Type<any>, title: string, tabData?: TabData, parentComponent?: Type<any>) {
this.tabData = tabData
this.component = component
this.title = title
this.parentComponent = parentComponent
}
}
