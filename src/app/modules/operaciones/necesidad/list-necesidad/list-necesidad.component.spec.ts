import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListNecesidadComponent } from './list-necesidad.component';

describe('ListNecesidadComponent', () => {
  let component: ListNecesidadComponent;
  let fixture: ComponentFixture<ListNecesidadComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListNecesidadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListNecesidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
