import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WindowInfoService {

  innerWidth: any;
  innerHeight: any;
  innerTabHeight: number;
  wide?: boolean;

  constructor() { 
    this.innerHeight = window.innerHeight;
    this.innerWidth = window.innerWidth;
    this.innerTabHeight = this.innerHeight * 0.9;
    this.wide = (this.innerWidth / this.innerHeight) < 1.4;
  }
}
