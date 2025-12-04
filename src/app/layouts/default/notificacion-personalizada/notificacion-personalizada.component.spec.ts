import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificacionPersonalizadaComponent } from './notificacion-personalizada.component';

describe('NotificacionPersonalizadaComponent', () => {
  let component: NotificacionPersonalizadaComponent;
  let fixture: ComponentFixture<NotificacionPersonalizadaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ NotificacionPersonalizadaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificacionPersonalizadaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
