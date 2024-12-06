import { DatePipe, DecimalPipe, TitleCasePipe } from "@angular/common";
import {
  Component,
  Inject,
  Input,
  LOCALE_ID,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { EnumToStringPipe } from "../../commons/core/utils/pipes/enum-to-string";

@Component({
  selector: "app-data-display",
  templateUrl: "./data-display.component.html",
  styleUrls: ["./data-display.component.scss"],
})
export class DataDisplayComponent implements OnChanges {
  @Input() titulo!: string;
  @Input() valor!: any;
  @Input() customPipe: string = "titlecase";
  @Input() horizontal: boolean = false; // Horizontal layout flag

  formattedValue!: string;

  constructor(
    @Inject(LOCALE_ID) private locale: string, // For number formatting
    private decimalPipe: DecimalPipe,
    private titleCasePipe: TitleCasePipe,
    private datePipe: DatePipe,
    private enumToString: EnumToStringPipe
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.valor || changes.customPipe) {
      this.formattedValue = this.applyPipe(this.valor, this.customPipe);
    }
  }

  applyPipe(value: any, pipeFormat: string): string {
    if (!pipeFormat || value == null) {
      return value || ""; // Return empty string if value is null or undefined
    }

    // Split pipe name and arguments (e.g., "date: 'short'" or "number: '1.0-2'")
    const [pipeName, pipeArgs] = pipeFormat.split(":").map((str) => str.trim());

    switch (pipeName) {
      case "number": {
        const digitInfo = pipeArgs
          ? pipeArgs.replace(/['"]/g, "").trim()
          : undefined; // Clean quotes
        return (
          this.decimalPipe.transform(value, digitInfo, this.locale) || value
        );
      }
      case "titlecase":
        return this.titleCasePipe.transform(value) || value;
      case "date": {
        const format = pipeArgs
          ? pipeArgs.replace(/['"]/g, "").trim()
          : undefined; // Clean quotes
        return (
          this.datePipe.transform(value, format, undefined, this.locale) ||
          value
        );
      }
      case "enumToString": {
        return this.enumToString.transform(value) || value;
      }
      default:
        return value; // Fallback if the pipe is not recognized
    }
  }
}
