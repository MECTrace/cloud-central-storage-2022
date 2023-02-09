import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../entity/file.entity';
import { IFileResult } from '../interface';
@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File) public fileRepository: Repository<File>,
  ) {}

  async create(prefix: string, file: Express.Multer.File) {
    const fileName =
      file.originalname.substring(0, file.originalname.lastIndexOf('.')) || '';
    const fileExt =
      file.originalname.substring(
        file.originalname.lastIndexOf('.'),
        file.originalname.length,
      ) || '';

    const fileType = fileName !== 'undefined' ? fileExt : 'undefined';
    const path =
      fileName !== 'undefined' ? 
        `https://pentaedgestorage.blob.core.windows.net/` +
        `${process.env.AZURE_STORAGE_CONTAINER}/` + 
        `${prefix}/${file.originalname}` : 
        'undefined';
    return this.fileRepository
      .createQueryBuilder()
      .insert()
      .into(File)
      .values([
        {
          fileName,
          fileType,
          path,
        },
      ])
      .execute();
  }

  async findByPath(path: string): Promise<string> {
    const rs: IFileResult[] = (await this.fileRepository
      .createQueryBuilder('file')
      .select()
      .where({
        path,
      })
      .execute()) as IFileResult[];
    return rs?.[0]?.file_id;
  }

  async update(id: string, path: string) {
    await this.fileRepository
      .createQueryBuilder()
      .update(File)
      .set({ path })
      .where({
        id: id,
      })
      .execute();
  }
}
