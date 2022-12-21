import { OnDestroy, OnInit, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timediff'
})
export class TimeDiffPipe implements PipeTransform{

  transform(value: Date, time: Date): Date {
    let diff = value.getTime() - time.getTime()
    return new Date(diff);
  }

}
