import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WindowInfoService {

  innerWidth: any;
  innerHeight: any;
  wide?: boolean;

  constructor() { 
    this.innerHeight = window.innerHeight;
    this.innerWidth = window.innerWidth;
    this.wide = (this.innerWidth / this.innerHeight) < 1.4;
  }
}
