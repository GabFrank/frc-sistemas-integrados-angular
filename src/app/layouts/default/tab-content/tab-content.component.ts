import { Component, OnInit, Input, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { Tab } from '../../tab/tab.model';
import { ContentContainerDirective } from '../content-container.directive';
import { SkeletonComponent } from '../../../skeleton.component';
import { NotificacionSnackbarService, NotificacionColor } from '../../../notificacion-snackbar.service';

@Component({
  selector: 'app-tab-content',
  template: '<ng-template style="height: 100%; flex: 1; display: flex; flex-direction: column;" content-container></ng-template>',
  // El contenedor del tab acota su alto al del área de contenido (que ya es de alto fijo).
  // Sin esto, la pantalla del tab crece con su contenido y el overflow-y de la pantalla nunca
  // se activa: el contenido que sobra se recorta en vez de poder scrollear.
  styles: [':host { display: block; height: 100%; }']
})

export class TabContentComponent implements OnInit {

  @Input() tab;
  @ViewChild(ContentContainerDirective, { static: true })
  contentContainer: ContentContainerDirective;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private notificacionSnackbar: NotificacionSnackbarService
  ) { }

  /**
   * El try/catch no es defensivo por las dudas: sin él, cualquier excepción en el constructor o
   * en el ngOnInit de CUALQUIER pantalla de la app deja la pestaña completamente en blanco, sin
   * un log, sin un aviso y sin nada en la consola. El usuario ve un panel vacío y no tiene forma
   * de saber si la pantalla está cargando, si le falta un permiso o si el sistema se rompió.
   *
   * Pasó el 2026-09-02 abriendo el PDV con una configuración local incompleta: el constructor de
   * VentaTouchComponent explotaba en `precios.split(',')` y la única manera de enterarse fue
   * invocar ngOnInit a mano desde la consola del navegador.
   */
  ngOnInit() {
    const tab: Tab = this.tab;
    try {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(tab.component);
      const viewContainerRef = this.contentContainer.viewContainerRef;
      const componentRef = viewContainerRef.createComponent(componentFactory);
      (componentRef.instance as SkeletonComponent).data = tab;
    } catch (e) {
      const nombre = tab?.component?.name || tab?.title || 'la pantalla';
      // El console.error va primero: es lo que deja rastro para diagnosticar después.
      console.error(`[TabContent] No se pudo abrir ${nombre}:`, e);
      this.notificacionSnackbar.notification$.next({
        color: NotificacionColor.danger,
        texto: `No se pudo abrir ${nombre}. Revisá la consola para el detalle.`,
        duracion: 6
      });
    }
  }

}
