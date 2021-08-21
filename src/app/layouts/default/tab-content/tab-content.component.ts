import { Component, OnInit, Input, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { Tab } from '../../tab/tab.model';
import { ContentContainerDirective } from '../content-container.directive';
import { SkeletonComponent } from '../../../skeleton.component';

@Component({
  selector: 'app-tab-content',
  template: '<ng-template content-container></ng-template>'
})

export class TabContentComponent implements OnInit {

  @Input() tab;
  @ViewChild(ContentContainerDirective, { static: true })
  contentContainer: ContentContainerDirective;
  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }
  ngOnInit() {
    const tab: Tab = this.tab;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(tab.component);
    const viewContainerRef = this.contentContainer.viewContainerRef;
    const componentRef = viewContainerRef.createComponent(componentFactory);
    (componentRef.instance as SkeletonComponent).data = tab;
  }

}
