import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BeepService {

  audio = new AudioContext

  constructor() { }

  createSound(frec, time){
    let v= this.audio.createOscillator()
    let u= this.audio.createGain()
    v.connect(u)
    v.frequency.value= frec
    v.type="square"
    u.connect(this.audio.destination)
    u.gain.value=10*0.01
    v.start(this.audio.currentTime)
    v.stop(this.audio.currentTime+time*0.001)
  }

  beep(){
    this.createSound(600, 100);
  }

  boop(){
    this.createSound(100, 500)
  }

}
