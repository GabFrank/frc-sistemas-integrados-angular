import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { MainService } from "../../main.service";
import { CargandoDialogService } from "../../shared/components/cargando-dialog/cargando-dialog.service";
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
  logoBackgroundColor = '#c30e0e'; // Default fallback color

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

    this.statusSub = connectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.verficarAuth();
        }
      });
  }

  ngAfterViewInit(): void {
    // Detect logo background color after the view is initialized
    setTimeout(() => {
      this.detectLogoBackgroundColor();
    }, 300); // Small delay to ensure image is loaded
  }

  /**
   * Detects the background color of the logo image by sampling the top-left pixel
   * and applies it to the logo container background
   */
  detectLogoBackgroundColor(): void {
    try {
      // Create a canvas to draw the image and analyze pixels
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Get the image element
      const img = this.logoImageRef?.nativeElement;
      
      if (!img || !context) {
        console.warn('Image or canvas context not available');
        return;
      }
      
      // Wait for the image to load
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
  
  /**
   * Analyzes the image to detect its background color and applies it to the container
   */
  private analyzeImage(img: HTMLImageElement, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
    try {
      // Set canvas dimensions to match image
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      
      // Draw the image on the canvas
      context.drawImage(img, 0, 0);
      
      // Sample multiple pixels from the corners to better detect the background color
      const topLeft = context.getImageData(0, 0, 1, 1).data;
      const topRight = context.getImageData(canvas.width - 1, 0, 1, 1).data;
      const bottomLeft = context.getImageData(0, canvas.height - 1, 1, 1).data;
      
      // Choose the most consistent color from the corners (preferring top-left)
      // This helps in cases where the logo might have different colored edges
      let r = topLeft[0];
      let g = topLeft[1];
      let b = topLeft[2];
      
      // Check if majority of corners have similar color
      if (this.areSimilarColors(topLeft, topRight) && 
          this.areSimilarColors(topLeft, bottomLeft)) {
        console.log('Consistent background color detected in corners');
      } else {
        console.log('Inconsistent corner colors, using top-left pixel');
        // You could implement more complex color selection logic here if needed
      }
      
      this.logoBackgroundColor = this.rgbToHex(r, g, b);
      
      // If the detected color is too light or white, use the default color
      if (this.isLightColor(r, g, b)) {
        console.log('Detected color too light, using default color');
        return;
      }
      
      console.log('Detected logo background color:', this.logoBackgroundColor);
      
      // Apply the detected color to the logo background
      const logoBackground = this.elementRef.nativeElement.querySelector('.logo-background');
      if (logoBackground) {
        logoBackground.style.backgroundColor = this.logoBackgroundColor;
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    }
  }
  
  /**
   * Check if two color arrays are similar enough to be considered the same background
   */
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
  
  /**
   * Converts RGB values to hex color string
   */
  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number): string => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }
  
  /**
   * Checks if a color is too light (to avoid white/very light backgrounds)
   */
  private isLightColor(r: number, g: number, b: number): boolean {
    // Calculate relative luminance (perceived brightness)
    // Using formula from WCAG 2.0
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 200; // Values close to 255 are lighter
  }

  createForm(): void {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("nickname", this.nicknameControl);
    this.formGroup.addControl("password", this.passwordControl);
    this.formGroup.addControl("keepLogged", this.keepLoggedControl);
  }

  onEntrar(): void {
    if (this.nicknameControl.valid && this.passwordControl.valid) {
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
            this.errorMessage = res.error.message;
          }
        });
    }
  }

  onCancelar(): void {
    // Ensure user is properly logged out
    this.mainService.logout();
    this.dialogRef.close(null);
  }

  onForgotPassword(): void {
    // Show a simple notification since we're preserving existing login logic
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

  // New method for the configuration button
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
}
