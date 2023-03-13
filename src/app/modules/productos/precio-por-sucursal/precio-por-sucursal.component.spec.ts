import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrecioPorSucursalComponent } from './precio-por-sucursal.component';

describe('PrecioPorSucursalComponent', () => {
  let component: PrecioPorSucursalComponent;
  let fixture: ComponentFixture<PrecioPorSucursalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrecioPorSucursalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrecioPorSucursalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
