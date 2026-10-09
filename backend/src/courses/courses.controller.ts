import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service.js';

/**
 * Read-only course catalog.
 *
 * Deliberately unauthenticated: the catalog is marketing-facing (the landing
 * page will consume it too) and only exposes PUBLISHED rows.
 */
@ApiTags('Courses')
@Controller('api/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'List published courses' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id/levels')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'List the levels of a course, in order' })
  findLevels(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findLevels(id);
  }
}
