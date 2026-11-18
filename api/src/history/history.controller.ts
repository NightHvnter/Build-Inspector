import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard.js';
import { JwtUserPayload } from '../common/dto/user.dto.js';
import { HistoryService } from './history.service.js';
import { CreateHistoryDto, HistoryItemDto } from './history.dto.js';

type AuthedRequest = { user: JwtUserPayload };

// The signed-in user's comparison history. Every route needs a valid access token
// and only ever touches that user's entries.
@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get()
  list(@Req() req: AuthedRequest): Promise<HistoryItemDto[]> {
    return this.history.list(req.user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  record(@Req() req: AuthedRequest, @Body() dto: CreateHistoryDto): Promise<HistoryItemDto> {
    return this.history.record(req.user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.history.remove(req.user.sub, id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clear(@Req() req: AuthedRequest): Promise<void> {
    return this.history.clear(req.user.sub);
  }
}
