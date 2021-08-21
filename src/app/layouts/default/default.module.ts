import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefaultComponent } from './default.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MaterialModule } from '../../commons/core/material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BootstrapModule } from '../../commons/core/bootstrap.module';
import { TabService } from '../tab/tab.service';
import { TabContentComponent } from './tab-content/tab-content.component';
import { ContentContainerDirective } from './content-container.directive';
import { CloseTabPopupComponent } from './close-tab-popup.component';



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
    ],
    providers: [TabService]
})
export class DefaultModule { }
