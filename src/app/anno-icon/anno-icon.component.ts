import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit } from '@angular/core';
import { AnnoDLC_list } from "../AnnoDLC.list";


@Component({
  selector: 'app-anno-icon',
  template: `
    <ng-content></ng-content>&nbsp;`,
  styleUrls: ['./anno-icon.component.sass'],
  host: {
    'class': 'anno-icon notranslate',
    '[class]': "'icon-'+icon.toLowerCase()",
    '[class.alert]': "alert",
    '[class.warning]': "alert"
  }
})
export class AnnoIconComponent implements OnInit, OnChanges {

  @Input() icon: string = "";
  @Input() alert: boolean = false;
  @Input() warning: boolean = false;
  private nativeElement: HTMLElement;

  constructor(private elt: ElementRef) {
    this.nativeElement = (this.elt.nativeElement as HTMLElement);
  }

  ngOnInit(): void {
  }

  ngOnChanges() {
  }

}
