import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TodosService } from './todos.service';
import { CreateTodoDto, UpdateTodoDto, QueryTodoDto } from './dto/todo.dto';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private todosService: TodosService) {}

  @Post()
  async create(@Body() dto: CreateTodoDto, @Request() req) {
    return this.todosService.create(dto, req.user.userId, req.user.companyId);
  }

  @Get()
  async findAll(@Request() req, @Query() query: QueryTodoDto) {
    return this.todosService.findAll(req.user.userId, query);
  }

  @Get('business')
  async getBusinessTodos(@Request() req) {
    return this.todosService.getBusinessTodos(
      req.user.userId,
      req.user.companyId,
      req.user.role,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.todosService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTodoDto, @Request() req) {
    await this.todosService.update(id, dto, req.user.userId);
    return { message: '更新成功' };
  }

  @Patch(':id/toggle')
  async toggleComplete(@Param('id') id: string, @Request() req) {
    const todo = await this.todosService.toggleComplete(id, req.user.userId);
    return todo || { message: '待办不存在' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.todosService.remove(id, req.user.userId);
    return { message: '删除成功' };
  }
}
