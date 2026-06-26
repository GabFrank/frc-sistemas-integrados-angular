import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WindowInfoService {

  innerWidth: any;
  innerHeight: any;
  innerTabHeight: number;
  wide?: boolean;
  readonly layoutChanged$ = new Subject<void>();

  constructor() {
    this.updateDimensions();
    window.addEventListener('resize', () => this.updateDimensions());
  }

  updateDimensions(): void {
    this.innerHeight = window.innerHeight;
    this.innerWidth = window.innerWidth;
    this.innerTabHeight = this.innerHeight * 0.9;
    this.wide = (this.innerWidth / this.innerHeight) < 1.4;
    this.notifyLayoutChange();
  }

  notifyLayoutChange(): void {
    this.layoutChanged$.next();
  }
}
