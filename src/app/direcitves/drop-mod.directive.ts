import {
  Directive,
  Output,
  Input,
  EventEmitter,
  HostBinding,
  HostListener
} from '@angular/core';

@Directive({
  selector: '[appDropMod]'
})
export class DropModDirective {

  @HostBinding('class.fileOver') fileOver: boolean = false;
  fileInFrame = false
  @Output() fileDropped = new EventEmitter<FileList>();


  private lazyTO?: NodeJS.Timeout;


  // Dragover listener
  @HostListener('dragover', ['$event']) onDragOver(evt: DragEvent) {
    // console.log('dragover', evt);
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = true;
    this.fileInFrame = true;
  }


  // Dragleave listener
  @HostListener('dragleave', ['$event'])
  public onDragLeave(evt: DragEvent) {
    // console.log('dragleave', evt);
    evt.preventDefault();
    evt.stopPropagation();
    this.fileInFrame = false;
    if (this.lazyTO) clearTimeout(this.lazyTO);
    this.lazyTO = setTimeout(() => {
      if (!this.fileInFrame) this.fileOver = false;
      this.lazyTO = undefined;
    }, 100);

  }

  // Drop listener
  @HostListener('drop', ['$event'])
  public ondrop(evt: DragEvent) {
    // console.log('drop', evt);
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
    this.fileInFrame = true;
    if (!evt.dataTransfer || !evt.dataTransfer.files.length) return;
    (window as any).fileUpload = evt.dataTransfer.files;
    this.fileDropped.emit(evt.dataTransfer.files);
  }

  constructor() { }

}
