import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMueblesComponent } from './list-muebles.component';

describe('ListMueblesComponent', () => {
  let component: ListMueblesComponent;
  let fixture: ComponentFixture<ListMueblesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListMueblesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListMueblesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
