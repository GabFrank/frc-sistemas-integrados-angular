import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListActualizacionComponent } from './list-actualizacion.component';

describe('ListActualizacionComponent', () => {
  let component: ListActualizacionComponent;
  let fixture: ComponentFixture<ListActualizacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListActualizacionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListActualizacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
