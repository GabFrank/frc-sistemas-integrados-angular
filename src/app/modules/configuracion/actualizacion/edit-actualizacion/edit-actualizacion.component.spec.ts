import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditActualizacionComponent } from './edit-actualizacion.component';

describe('EditActualizacionComponent', () => {
  let component: EditActualizacionComponent;
  let fixture: ComponentFixture<EditActualizacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditActualizacionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditActualizacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
