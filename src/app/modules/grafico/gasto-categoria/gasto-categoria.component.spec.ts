import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GastoCategoriaComponent } from './gasto-categoria.component';

describe('GastoCategoriaComponent', () => {
  let component: GastoCategoriaComponent;
  let fixture: ComponentFixture<GastoCategoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GastoCategoriaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GastoCategoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
