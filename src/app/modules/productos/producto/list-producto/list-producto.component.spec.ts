import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListProductoComponent } from './list-producto.component';

describe('ListProductoComponent', () => {
  let component: ListProductoComponent;
  let fixture: ComponentFixture<ListProductoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListProductoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
