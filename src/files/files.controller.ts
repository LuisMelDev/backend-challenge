import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Res,
  Put,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { User } from '../auth/entities/user.entity';
import { Auth, GetUser } from 'src/auth/decorators';
import { Param } from '@nestjs/common/decorators/http/route-params.decorator';
import { UpdateFileDto } from './dto/update-file.dto';
import { UploadImageDto } from './dto/upload-image.dto';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    if (!file) throw new BadRequestException('file not found');

    return await this.filesService.uploadFile(
      file.buffer,
      file.originalname,
      user,
    );
  }

  @Post('url')
  @Auth()
  async uploadImage(
    @Body() uploadImageDto: UploadImageDto,
    @GetUser() user: User,
  ) {
    return await this.filesService.uploadImage(uploadImageDto, user);
  }

  @Get(':fileName')
  @Auth()
  async getFile(
    @Res() res: Response,
    @Param('fileName') fileName: string,
    @GetUser() user: User,
  ) {
    const file = await this.filesService.getFile(fileName, user);

    res.attachment(fileName);

    file.createReadStream().pipe(res);
  }

  @Put(':fileName')
  @Auth()
  async updateFileName(
    @Param('fileName') fileName: string,
    @Body() updateFileDto: UpdateFileDto,
    @GetUser() user: User,
  ) {
    return await this.filesService.updateFileName(
      fileName,
      updateFileDto,
      user,
    );
  }

  @Get('get-data/:id')
  @Auth()
  async getData(@Param('id') id: string, @GetUser() user: User) {
    return await this.filesService.getData(id, user);
  }
}
