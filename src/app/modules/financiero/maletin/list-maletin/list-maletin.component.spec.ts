import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMaletinComponent } from './list-maletin.component';

describe('ListMaletinComponent', () => {
  let component: ListMaletinComponent;
  let fixture: ComponentFixture<ListMaletinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListMaletinComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListMaletinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
