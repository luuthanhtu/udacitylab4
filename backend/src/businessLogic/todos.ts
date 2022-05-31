import 'source-map-support/register'

import * as uuid from 'uuid'

import { TodosAccess } from './TodosAccess'
import { connectToS3 } from '../dataConnect/attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'

const logger = createLogger('todos')

const todosAccess = new TodosAccess()
const Storage = new connectToS3()

export async function getTodos(userId: string): Promise<TodoItem[]> {
  logger.info(`Retrieve all todos`)

  return await todosAccess.getTodoItems(userId)
}

export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
  const todoId = uuid.v4()

  const newItem: TodoItem = {
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: null,
    ...createTodoRequest
  }

  logger.info(`Create todo ${todoId}`)

  await todosAccess.createTodoItem(newItem)

  return newItem
}

export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest) {
  logger.info(`Update todo ${todoId} and ${userId}`)

  const item = await todosAccess.getTodoItem(userId, todoId)


  if (item.userId !== userId) {
    logger.error(`User ${userId} does not have permission to update todo ${todoId}`)
    throw new Error('Not authorized to update item')  
  }

  todosAccess.updateTodoItem(userId, todoId, updateTodoRequest as TodoUpdate)
}

export async function deleteTodo(userId: string, todoId: string) {
  logger.info(`Deleting todo ${todoId} for user ${userId}`, { userId, todoId })

  const item = await todosAccess.getTodoItem(userId, todoId)

  if (item.userId !== userId) {
    logger.error(`User ${userId} does not have permission to delete todo ${todoId}`)
    throw new Error('Not authorized to delete item')  
  }

  todosAccess.deleteTodoItem(userId, todoId)
}

export async function updateAttachmentUrl(userId: string, todoId: string, attachmentId: string) {
  logger.info(`Create attachment URL for attachment ${attachmentId}`)

  const attachmentUrl = await Storage.getAttachmentUrl(attachmentId)

  logger.info(`Update todo ${todoId} and ${userId} with attachment URL ${attachmentUrl}`)

  const item = await todosAccess.getTodoItem(userId, todoId)

  if (item.userId !== userId) {
    logger.error(`User ${userId} does not have permission to update todo ${todoId}`)
    throw new Error('Not authorized to update item')
  }

  await todosAccess.updateAttachmentUrl(userId, todoId, attachmentUrl)
}

export async function createAttachmentPresignedUrl(attachmentId: string): Promise<string> {
  logger.info(`Generating upload URL for attachment ${attachmentId}`)

  const uploadUrl = await Storage.getUploadUrl(attachmentId)

  return uploadUrl
}

