import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { User } from '../auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateFileDto } from './dto/update-file.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private s3 = new S3();

  async uploadFile(dataBuffer: Buffer, fileName: string, user: User) {
    try {
      const key = `${uuid()}-${fileName}`;
      const filestored = await this.fileRepository.save({
        fileName,
        key: key,
        url: `${this.configService.get('HOST_API')}/files/${fileName}`,
        user,
      });

      await this.s3
        .upload({
          Bucket: this.configService.get('AWS_BUCKET_NAME'),
          Body: dataBuffer,
          Key: key,
        })
        .promise();

      delete filestored.user;
      return filestored;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async getFile(fileName: string, user: User) {
    const file = await this.fileRepository.findOne({
      where: { fileName },
      relations: { user: true },
      select: { fileName: true, key: true, id: true },
    });

    this.validateFileAndOwner(file, user);

    const fileData = await this.s3.getObject({
      Bucket: this.configService.get('AWS_BUCKET_NAME'),
      Key: file.key,
    });

    return fileData;
  }

  async updateFileName(
    fileName: string,
    updateFileDto: UpdateFileDto,
    user: User,
  ) {
    const file = await this.fileRepository.findOne({
      where: { fileName },
      relations: { user: true },
      select: { fileName: true, id: true },
    });

    this.validateFileAndOwner(file, user);

    file.fileName = updateFileDto.newFileName;
    file.url = `${this.configService.get('HOST_API')}/files/${
      updateFileDto.newFileName
    }`;

    try {
      return await this.fileRepository.save(file);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async getData(id: string, user: User) {
    const file = await this.fileRepository.findOne({
      where: { id },
      relations: { user: true },
      select: { fileName: true, id: true, url: true },
    });

    this.validateFileAndOwner(file, user);

    delete file.user;

    return file;
  }

  async uploadImage(uploadImageDto: UploadImageDto, user: User) {
    const { urlImage } = uploadImageDto;

    let response;

    try {
      response = await this.httpService.axiosRef.get(urlImage, {
        responseType: 'stream',
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    const extension = response.headers['content-type'].split('/')[1];

    return await this.uploadFile(
      response.data,
      `image-${uuid()}.${extension}`,
      user,
    );
  }

  private validateFileAndOwner(file: File, user: User) {
    if (!file) {
      throw new BadRequestException('File not found');
    }

    if (file.user.id !== user.id) {
      throw new UnauthorizedException('Unauthorized to update file');
    }
  }

  private handleExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    throw new InternalServerErrorException(error);
  }
}
