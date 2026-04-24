import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { MainService } from "../../main.service";
import { LoginService } from "./login.service";
import { connectionStatusSub } from "../../shared/services/graphql-connection.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfiguracionDialogComponent } from "../../shared/components/configuracion-dialog/configuracion-dialog.component";
import { ConfiguracionService } from "../../shared/services/configuracion.service";

@UntilDestroy()
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('logoImage') logoImageRef: ElementRef;

  formGroup: FormGroup;
  nicknameControl = new FormControl(null, Validators.required);
  passwordControl = new FormControl(null, [
    Validators.required,
    Validators.min(2),
  ]);
  keepLoggedControl = new FormControl(false);
  showBienvenida = false;
  errorMessage: string;
  hidePassword = true;
  logoBackgroundColor = '#c30e0e';
  serverInfo: string;

  statusSub: Subscription;

  constructor(
    private loginService: LoginService,
    private dialogRef: MatDialogRef<LoginComponent>,
    public mainService: MainService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private configService: ConfiguracionService,
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.verficarAuth();
    this.updateServerInfo();

    this.statusSub = connectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.verficarAuth();
        }
      });
    this.configService.configChanged
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateServerInfo();
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.detectLogoBackgroundColor();
    }, 300);
  }
  detectLogoBackgroundColor(): void {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      const img = this.logoImageRef?.nativeElement;

      if (!img || !context) {
        console.warn('Image or canvas context not available');
        return;
      }
      if (!img.complete) {
        img.onload = () => {
          this.analyzeImage(img, canvas, context);
        };
      } else {
        this.analyzeImage(img, canvas, context);
      }
    } catch (error) {
      console.error('Error detecting logo background color:', error);
    }
  }
  private analyzeImage(img: HTMLImageElement, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
    try {
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      context.drawImage(img, 0, 0);

      const topLeft = context.getImageData(0, 0, 1, 1).data;
      const topRight = context.getImageData(canvas.width - 1, 0, 1, 1).data;
      const bottomLeft = context.getImageData(0, canvas.height - 1, 1, 1).data;
      let r = topLeft[0];
      let g = topLeft[1];
      let b = topLeft[2];
      if (this.areSimilarColors(topLeft, topRight) &&
        this.areSimilarColors(topLeft, bottomLeft)) {
      } else {
      }

      this.logoBackgroundColor = this.rgbToHex(r, g, b);
      if (this.isLightColor(r, g, b)) {
        return;
      }
      const logoBackground = this.elementRef.nativeElement.querySelector('.logo-background');
      if (logoBackground) {
        logoBackground.style.backgroundColor = this.logoBackgroundColor;
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    }
  }
  private areSimilarColors(color1: Uint8ClampedArray, color2: Uint8ClampedArray, threshold: number = 30): boolean {
    const r1 = color1[0];
    const g1 = color1[1];
    const b1 = color1[2];

    const r2 = color2[0];
    const g2 = color2[1];
    const b2 = color2[2];

    const rDiff = Math.abs(r1 - r2);
    const gDiff = Math.abs(g1 - g2);
    const bDiff = Math.abs(b1 - b2);

    return rDiff <= threshold && gDiff <= threshold && bDiff <= threshold;
  }
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number): string => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return '#' + toHex(r) + toHex(g) + toHex(b);
  }
  private isLightColor(r: number, g: number, b: number): boolean {
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 200;
  }

  createForm(): void {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("nickname", this.nicknameControl);
    this.formGroup.addControl("password", this.passwordControl);
    this.formGroup.addControl("keepLogged", this.keepLoggedControl);
  }

  onEntrar(): void {
    if (this.nicknameControl.valid && this.passwordControl.valid) {
      this.errorMessage = null;

      this.loginService
        .login(
          this.nicknameControl.value,
          this.passwordControl.value,
          this.keepLoggedControl.value
        )
        .subscribe((res) => {
          if (res.usuario != null) {
            this.mainService.authenticationSub.next(true);
            this.mainService.load();
            this.showBienvenida = true;
            this.errorMessage = null;
            setTimeout(() => {
              this.dialogRef.close(res);
            }, 2000);
          } else if (res.error != null) {
            this.mainService.authenticationSub.next(false);
            this.errorMessage = res.error.message || 'Error de conexión al servidor. Verifique la configuración.';
          }
        });
    }
  }

  onCancelar(): void {
    this.mainService.logout();
    this.dialogRef.close(null);
  }

  onForgotPassword(): void {
    this.snackBar.open(
      'Se ha enviado un correo electrónico con instrucciones para restablecer su contraseña',
      'Cerrar',
      { duration: 5000 }
    );
  }

  onNewUser(): void { }

  verficarAuth(): void {
    this.mainService
      .isAuthenticated()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.showBienvenida = true;
          setTimeout(() => {
            this.dialogRef.close(res);
          }, 2000);
        }
      });
  }

  onConfigurarServidor(): void {
    this.dialogRef.close(false);
  }
  onConfiguraServidor(): void {
    const config = this.configService.getConfig();

    this.dialog.open(ConfiguracionDialogComponent, {
      width: '600px',
      disableClose: true,
      data: config
    }).afterClosed().subscribe(result => {
      if (result) {
        this.configService.updateConfig(result);
        this.snackBar.open(
          'Configuración guardada correctamente',
          'OK',
          { duration: 3000 }
        );
      }
    });
  }
  updateServerInfo(): void {
    const config = this.configService.getConfig();
    if (config.isLocal) {
      this.serverInfo = `Conectando a servidor local: ${config.serverIp}:${config.serverPort}`;
    } else {
      this.serverInfo = `Conectando a servidor central: ${config.serverCentralIp}:${config.serverCentralPort}`;
    }
  }
}
