import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListSectorComponent } from './list-sector.component';

describe('ListSectorComponent', () => {
  let component: ListSectorComponent;
  let fixture: ComponentFixture<ListSectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListSectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListSectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
