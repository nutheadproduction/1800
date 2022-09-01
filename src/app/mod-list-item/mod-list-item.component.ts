import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AnnoMOD } from "../AnnoMOD";

@Component({
  selector: 'app-mod-list-item',
  templateUrl: './mod-list-item.component.html',
  styleUrls: ['./mod-list-item.component.sass'],
  host: {
    "[class.active]": "active",
    "[class.selected]": "selected === mod",
    "[class.slim]": "slim"
  }
})
export class ModListItemComponent implements OnInit {

  @Input() width: number = 30;
  @Input() mod?: AnnoMOD;
  active: boolean = false;
  @Input() selected?: AnnoMOD;
  @Output() selectedChange = new EventEmitter<AnnoMOD | undefined>();

  @Input() slim: boolean = false;


  constructor() { }

  ngOnInit(): void {
  }

  activeToggle() {
    this.active = !this.active;
  }

  toggleSelected() {
    if (this.selected === this.mod) {
      this.selected = undefined;
    } else {
      this.selected = this.mod;
    }
    this.selectedChange.emit(this.selected);
  }

}
