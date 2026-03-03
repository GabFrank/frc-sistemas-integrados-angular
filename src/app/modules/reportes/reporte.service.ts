import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TabService } from '../../layouts/tab/tab.service';

export class ReporteData {
  nombre: string
  pdf: string
  currentPage: number;
}

const TAB_REPORTES_TITLE = 'Reportes';
/** Delay to run after addTab's 500ms spinner - ensures tab switch happens when UI is ready */
const TAB_SWITCH_DELAY_MS = 550;

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  sub = new BehaviorSubject<ReporteData[]>([]);

  reporteList: ReporteData[] = []

  constructor(private tabService: TabService) { }

  onAdd(nombre, pdf){
    let data = new ReporteData()
    data.nombre = nombre;
    data.pdf = pdf;
    data.currentPage = 1;
    this.reporteList.push(data)
    this.sub.next(this.reporteList)
    setTimeout(() => this.tabService.onGoToTab(TAB_REPORTES_TITLE), TAB_SWITCH_DELAY_MS)
  }

  onRemove(i){
    this.reporteList.splice(i, 1);
    this.sub.next(this.reporteList)
  }

  clearAll(){
    this.reporteList = []
  }
}
