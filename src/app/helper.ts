export namespace readUploadedFile {
  export function asText(inputFile: File): Promise<string> {
    const temporaryFileReader = new FileReader();

    return new Promise<string>((resolve, reject) => {
      temporaryFileReader.onerror = () => {
        temporaryFileReader.abort();
        reject(new DOMException("Problem parsing input file."));
      };

      temporaryFileReader.onload = () => {
        resolve(temporaryFileReader.result + '');
      };
      temporaryFileReader.readAsText(inputFile);
    });
  }

  export function asDataURL(inputFile: File): Promise<string> {
    const temporaryFileReader = new FileReader();

    return new Promise<string>((resolve, reject) => {
      temporaryFileReader.onerror = () => {
        temporaryFileReader.abort();
        reject(new DOMException("Problem parsing input file. " + inputFile.name));
      };

      temporaryFileReader.onload = () => {
        resolve(temporaryFileReader.result + '');
      };
      temporaryFileReader.readAsDataURL(inputFile);
    });
  }

  export function asArrayBuffer(inputFile: File): Promise<ArrayBuffer> {
    const temporaryFileReader = new FileReader();

    return new Promise<ArrayBuffer>((resolve, reject) => {
      temporaryFileReader.onerror = () => {
        temporaryFileReader.abort();
        reject(new DOMException("Problem parsing input file."));
      };

      temporaryFileReader.onload = () => {
        if (temporaryFileReader.result !== null && typeof (temporaryFileReader.result) !== "string")
          resolve(temporaryFileReader.result);
        else
          reject(new DOMException("unable to read as ArrayBuffer"));
      };
      temporaryFileReader.readAsArrayBuffer(inputFile);
    });
  }
}
