import { Injectable } from '@angular/core';
import { printImage } from './graphql/graphql-query';
import { PrintImageGQL } from './graphql/printImage';

export class ThermalPrintData {
  text: string;
  img: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrintService {

constructor(
  private printImage: PrintImageGQL
) { }

 print(image: string){
   this.printImage.fetch({
     image
   }, {
     fetchPolicy: 'no-cache',
     errorPolicy: 'all'
   }).subscribe(res => {
      console.log(res)
   })
 }

}
