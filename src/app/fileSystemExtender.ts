export default function extendFileSystemAPI() {

  if (!('copy' in FileSystemFileHandle.prototype)) {
    FileSystemFileHandle.prototype.copy = function (target: FileSystemFileHandle): Promise<void> {
      if (!(target instanceof FileSystemFileHandle)) return Promise.reject("target needs to be a valid FileSystemFileHandle");
      return new Promise<void>(async (resolve, reject) => {
        if (await target.queryPermission({ mode: "readwrite" }) !== 'granted') {
          return reject('target needs readwrite permissions');
        }
        try {
          console.info('copy file ', this, target);
          const srcFile = await this.getFile();
          const writable = await target.createWritable();
          const srcContent = await srcFile.stream();
          // @ts-ignore
          await srcContent.pipeTo(writable);
          // await writable.close();
          return resolve();
        } catch (e) {
          return reject(e);
        }
      });
    }
  }

  if (!('copy' in FileSystemDirectoryHandle.prototype)) {
    FileSystemDirectoryHandle.prototype.copy = function (target: FileSystemDirectoryHandle, options: FileSystemCopyOptions): Promise<void> {
      if (!(target instanceof FileSystemDirectoryHandle)) return Promise.reject("target needs to be a valid FileSystemDirectoryHandle");

      const recursive = options ? options?.recursive : true;

      return new Promise<void>(async (resolve, reject) => {

        //make sure target is writeable
        if (await target.queryPermission({ mode: "readwrite" }) !== 'granted') {
          return reject('target needs readwrite permissions');
        }

        let filePromises: Promise<void>[] = [];

        for await (const [elementName, elementHandle] of this.entries()) {
          if (elementHandle.kind == "file") {
            const targetFile = await target.getFileHandle(elementName, { create: true });
            filePromises.push(elementHandle.copy(targetFile));
          } else if (elementHandle.kind == "directory" && recursive) {
            const targetDir = await target.getDirectoryHandle(elementName, { create: true });
            filePromises.push(elementHandle.copy(targetDir, { recursive: true }));
          }
        }

        Promise.all(filePromises).then(() => {
          resolve();
        }).catch(reject);
      });
    }
  }
}
