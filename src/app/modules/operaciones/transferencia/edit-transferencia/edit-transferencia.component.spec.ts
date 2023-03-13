import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTransferenciaComponent } from './edit-transferencia.component';

describe('EditTransferenciaComponent', () => {
  let component: EditTransferenciaComponent;
  let fixture: ComponentFixture<EditTransferenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditTransferenciaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditTransferenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
