import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntradaSalidaComponent } from './entrada-salida.component';

describe('EntradaSalidaComponent', () => {
  let component: EntradaSalidaComponent;
  let fixture: ComponentFixture<EntradaSalidaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntradaSalidaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntradaSalidaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
