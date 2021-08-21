import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditNecesidadComponent } from './edit-necesidad.component';

describe('EditNecesidadComponent', () => {
  let component: EditNecesidadComponent;
  let fixture: ComponentFixture<EditNecesidadComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditNecesidadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditNecesidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
