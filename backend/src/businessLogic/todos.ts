import { TodosAccess } from '../dataLayer/todosAcess'
import { TodosStorage } from '../dataLayer/todosStorage'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'
// import { getUserId } from '../lambda/utils';
import { TodoUpdate } from '../models/TodoUpdate'

// TODO: Implement businessLogic
const logger = createLogger('todos')
const todosAccess = new TodosAccess()
const todosStorage = new TodosStorage()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info('Retrieving todos for user')
    return await todosAccess.getTodoItems(userId)
  }


export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest) {
  
    if (userId != null) {
      console.log("No user")
    }

    todosAccess.updateTodoItem(todoId, updateTodoRequest as TodoUpdate)
  }

  export async function updateAttachmentUrl(userId: string, todoId: string, attachmentId: string) {
  
    if (userId != null) {
      console.log("No user")
    }

    const attachmentUrl = await todosStorage.getAttachmentUrl(attachmentId)
  
    await todosAccess.updateAttachmentUrl(todoId, attachmentUrl)
  }

  export async function createAttachmentPresignedUrl(attachmentId: string): Promise<string> {
  
    const uploadUrl = await todosStorage.getUploadUrl(attachmentId)
  
    return uploadUrl
  }

  export async function deleteTodo(userId: string, todoId: string) {
    
      if (userId != null) {
      console.log("No user")
    }
    
    todosAccess.deleteTodoItem(todoId)
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
  
  
    await todosAccess.createTodoItem(newItem)
  
    return newItem
  }