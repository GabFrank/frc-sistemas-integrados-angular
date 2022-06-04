import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditInventarioComponent } from './edit-inventario.component';

describe('EditInventarioComponent', () => {
  let component: EditInventarioComponent;
  let fixture: ComponentFixture<EditInventarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditInventarioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditInventarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
