//Simply to import to app.module.ts and start to use all angular
// by this way is easier to maintenance you app.module

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {MatSliderModule} from '@angular/material/slider';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatMenuModule} from '@angular/material/menu';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatCardModule} from '@angular/material/card';
import {MatStepperModule} from '@angular/material/stepper';
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import { NgModule } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import {ClipboardModule} from '@angular/cdk/clipboard';
import { MatKeyboardModule } from 'angular-onscreen-material-keyboard';
import {MatTreeModule} from '@angular/material/tree';
import { MatFileUploadModule } from 'angular-material-fileupload';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { EnumToStringPipe } from './utils/pipes/enum-to-string';
import { TimeDiffPipe } from './utils/pipes/time-diff';
import { BdcWalkModule } from 'bdc-walkthrough';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@NgModule({
  imports: [],
  providers: [],
  declarations: [EnumToStringPipe, TimeDiffPipe],
  bootstrap: [],
  exports: [
    BrowserAnimationsModule,
    MatCheckboxModule,
    MatCheckboxModule,
    MatButtonModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatRadioModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatStepperModule,
    MatTabsModule,
    MatExpansionModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTableModule,
    MatNativeDateModule,
    MatSortModule,
    MatDatepickerModule,
    NgxMaterialTimepickerModule,
    ClipboardModule,
    MatStepperModule,
    MatKeyboardModule,
    MatTreeModule,
    MatFileUploadModule,
    NgxMatSelectSearchModule,
    EnumToStringPipe,
    TimeDiffPipe,
    BdcWalkModule,
    NgxChartsModule
    ]
})
export class MaterialModule { }
