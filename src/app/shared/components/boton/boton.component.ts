import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  Renderer2,
  AfterViewChecked,
  AfterViewInit,
  HostListener,
} from "@angular/core";
import { MatButton } from "@angular/material/button";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { BehaviorSubject } from "rxjs";

export interface BotonData {
  nombre: string;
  icon: string;
  iconSize: number;
  clickEvent: any;
  expression: boolean;
}

type Color = "primary" | "accent" | "warn" | "danger"; // Add more as needed

@UntilDestroy()
@Component({
  selector: "app-boton",
  templateUrl: "./boton.component.html",
  styleUrls: ["./boton.component.scss"],
})
export class BotonComponent implements OnInit, AfterViewInit {
  @ViewChild("btn", { static: false }) btn: MatButton;
  @ViewChild('textContent', { static: false }) textContent: ElementRef;

  @Input()
  nombre;

  @Input()
  disableExpression: boolean;

  @Input()
  color: any = "primary";

  @Input()
  icon;

  @Input()
  iconSize = 1;

  @Input()
  clickDelay: any = 1000;

  @Input()
  prefix;

  @Input()
  sufix;

  @Input()
  delay = 0;

  @Input()
  basic = false;

  temporaryDisable = false;

  isNumber = false;

  @Output()
  clickEvent = new EventEmitter();

  @Input()
  focusEvent = new BehaviorSubject<boolean>(false);

  showButton = true;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.focusEvent.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.btn.focus();
      }
    });

    if (Number(this.nombre) == +this.nombre) this.isNumber = true;

    if (this.delay != null) {
      this.showButton = false;
      setTimeout(() => {
        this.showButton = true;
      }, this.delay);
    }
  }

  ngAfterViewInit(): void {
    this.adjustFontSize();
  }

  private adjustFontSize(): void {
    // const element = this.textContent?.nativeElement;
    // const button = this.btn?._elementRef?.nativeElement;

    // let fontSize = parseInt(window.getComputedStyle(element).fontSize, 8);

    // // Start with a large font size and decrease until it fits the button width
    // while (element.scrollWidth > button.clientWidth && fontSize > 8) {
    //   fontSize -= 1;
    //   this.renderer.setStyle(element, 'fontSize', `${fontSize}px`);
    // }

    // // If the text still overflows, allow it to wrap to the next line
    // if (element.scrollWidth > button.clientWidth) {
    //   this.renderer.setStyle(element, 'white-space', 'normal');
    // } else {
    //   this.renderer.setStyle(element, 'white-space', 'nowrap');
    // }
  }

  onClick() {
    if (this.disableExpression != true) {
      this.clickEvent.emit();
      this.temporaryDisable = true;
      setTimeout(() => {
        this.temporaryDisable = false;
      }, this.clickDelay);
    }
  }

  onGetFocus() {
    this.btn?.focus();
  }
}
