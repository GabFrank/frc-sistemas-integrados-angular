import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalisisDiferenciaComponent } from './analisis-diferencia.component';

describe('AnalisisDiferenciaComponent', () => {
  let component: AnalisisDiferenciaComponent;
  let fixture: ComponentFixture<AnalisisDiferenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnalisisDiferenciaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalisisDiferenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
