import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMarcacionComponent } from './list-marcacion.component';

describe('ListMarcacionComponent', () => {
  let component: ListMarcacionComponent;
  let fixture: ComponentFixture<ListMarcacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListMarcacionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListMarcacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
