import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMapasComponent } from './list-mapas.component';

describe('ListMapasComponent', () => {
  let component: ListMapasComponent;
  let fixture: ComponentFixture<ListMapasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListMapasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListMapasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
