import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventarioDashboardComponent } from './inventario-dashboard.component';

describe('InventarioDashboardComponent', () => {
  let component: InventarioDashboardComponent;
  let fixture: ComponentFixture<InventarioDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InventarioDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InventarioDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
