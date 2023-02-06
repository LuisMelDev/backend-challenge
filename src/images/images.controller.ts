import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ImagesService } from './images.service';

@ApiTags('Images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get()
  searchImage(
    @Query('query') query: string,
    @Query('page') page: string,
    @Query('per_page') per_page: string,
  ) {
    return this.imagesService.searchImage(
      query,
      Number(page || 1),
      Number(per_page || 20),
    );
  }
}
