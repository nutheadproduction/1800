import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModListItemComponent } from './mod-list-item.component';

describe('ModListItemComponent', () => {
  let component: ModListItemComponent;
  let fixture: ComponentFixture<ModListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModListItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
