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

  async create(file: Express.Multer.File) {
    const fileName =
      file.originalname.substring(0, file.originalname.lastIndexOf('.')) || '';
    const fileExt =
      file.originalname.substring(
        file.originalname.lastIndexOf('.'),
        file.originalname.length,
      ) || '';

    const fileType = fileName !== 'undefined' ? fileExt : 'undefined';
    const path =
      fileName !== 'undefined' ? `/${file.originalname}` : 'undefined';
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

  async findByFileName(fileName: string): Promise<string> {
    const rs: IFileResult[] = (await this.fileRepository
      .createQueryBuilder('file')
      .select()
      .where({
        fileName,
      })
      .execute()) as IFileResult[];
    return rs?.[0]?.file_id;
  }
}
