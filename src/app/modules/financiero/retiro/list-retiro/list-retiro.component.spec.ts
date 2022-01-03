import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListRetiroComponent } from './list-retiro.component';

describe('ListRetiroComponent', () => {
  let component: ListRetiroComponent;
  let fixture: ComponentFixture<ListRetiroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListRetiroComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListRetiroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
