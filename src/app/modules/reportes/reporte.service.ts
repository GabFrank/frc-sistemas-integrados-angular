import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export class ReporteData {
  nombre: string
  pdf: string
  currentPage: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  sub = new BehaviorSubject<ReporteData[]>([]);

  reporteList: ReporteData[] = []

  constructor() { }

  onAdd(nombre, pdf){
    let data = new ReporteData()
    data.nombre = nombre;
    data.pdf = pdf;
    data.currentPage = 1;
    this.reporteList.push(data)
    this.sub.next(this.reporteList)
  }

  onRemove(i){
    this.reporteList.splice(i, 1);
    this.sub.next(this.reporteList)
  }

  clearAll(){
    this.reporteList = []
  }
}
