import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarBilletesTouchComponent } from './seleccionar-billetes-touch.component';

describe('SeleccionarBilletesTouchComponent', () => {
  let component: SeleccionarBilletesTouchComponent;
  let fixture: ComponentFixture<SeleccionarBilletesTouchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SeleccionarBilletesTouchComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SeleccionarBilletesTouchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
