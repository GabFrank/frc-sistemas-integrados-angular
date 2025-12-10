import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefaultComponent } from './default.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MaterialModule } from '../../commons/core/material.module';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { BootstrapModule } from '../../commons/core/bootstrap.module';
import { TabService } from '../tab/tab.service';
import { TabContentComponent } from './tab-content/tab-content.component';
import { ContentContainerDirective } from './content-container.directive';
import { CloseTabPopupComponent } from './close-tab-popup.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';



@NgModule({
  declarations: [
    DefaultComponent,
    TabContentComponent,
    CloseTabPopupComponent,
    ContentContainerDirective
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    MatSidenavModule,
    MaterialModule,
    FlexLayoutModule,
    BootstrapModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule
    ],
    providers: [TabService]
})
export class DefaultModule { }
