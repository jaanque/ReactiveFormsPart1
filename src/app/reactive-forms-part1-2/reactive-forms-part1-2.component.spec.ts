import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsPart1_2Component } from './reactive-forms-part1-2.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('ReactiveFormsPart1_2Component', () => {
  let component: ReactiveFormsPart1_2Component;
  let fixture: ComponentFixture<ReactiveFormsPart1_2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsPart1_2Component, ReactiveFormsModule, CommonModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReactiveFormsPart1_2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
