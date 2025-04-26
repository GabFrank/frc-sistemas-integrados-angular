import { Injectable } from '@angular/core';
import { printImage, printVale } from './graphql/graphql-query';
import { PrintValeGQL } from './graphql/print-vale';
import { PrintImageGQL } from './graphql/printImage';
import { PrintTicketFiestaData } from './print-tickets/print-tickets.component';

export class ThermalPrintData {
  text: string;
  img: string;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class PrintService {

constructor(
  private printImage: PrintImageGQL,
  private printVale: PrintValeGQL
) { }

 print(image: string){
   this.printImage.fetch({
     image
   }, {
     fetchPolicy: 'no-cache',
     errorPolicy: 'all'
   }).pipe(untilDestroyed(this)).subscribe(res => {
   })
 }

 onPrintVale(vale: PrintTicketFiestaData){
   this.printVale.fetch({
     entity: vale
   }, {
     fetchPolicy: 'no-cache',
     errorPolicy: 'all'
   }).pipe(untilDestroyed(this)).subscribe(res => {
     if(res){
     }
   })
 }

}

