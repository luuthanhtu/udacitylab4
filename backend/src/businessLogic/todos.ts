import { TodosAccess } from './todosAcess'
// import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'
import {TodosStorage} from './attachmentUtils'
import { TodoUpdate } from '../models/TodoUpdate'

// // TODO: Implement businessLogic
// const todosAccess = new TodosAccess()

// export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
//     const todoId = uuid.v4()
  
//     const newItem: TodoItem = {
//       // userId,
//       todoId,
//       createdAt: new Date().toISOString(),
//       done: false,
//       attachmentUrl: null,
//       ...createTodoRequest
//     }
    
//     await todosAccess.createTodoItem(newItem)
  
//     return newItem
//   }


  
// // TODO: Implement businessLogic
const todosAccess = new TodosAccess()
const todosStorage = new TodosStorage()

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


  export async function createAttachmentPresignedUrl(attachmentId: string): Promise<string> {
  
    const uploadUrl = await todosStorage.getUploadUrl(attachmentId)
  
    return uploadUrl
  }
  
  export async function updateAttachmentUrl(todoId: string, attachmentId: string) {
  
    const attachmentUrl = await todosStorage.getAttachmentUrl(attachmentId)
  
  
  
    await todosAccess.updateAttachmentUrl(todoId, attachmentUrl)
    
  }


  export async function updateTodo(todoId: string, updateTodoRequest: UpdateTodoRequest) {
    // logger.info(`Updating todo ${todoId} for user ${userId}`, { userId, todoId, todoUpdate: updateTodoRequest })
  
    // const item = await todosAccess.getTodoItem(todoId)
  
    // if (!item)
    //   throw new Error('Item not found')  // FIXME: 404?
  
    // if (item.userId !== userId) {
    //   logger.error(`User ${userId} does not have permission to update todo ${todoId}`)
    //   throw new Error('User is not authorized to update item')  // FIXME: 403?
    // }
  
    todosAccess.updateTodoItem(todoId, updateTodoRequest as TodoUpdate)
  }


  export async function deleteTodo(todoId: string) {
  

  
    todosAccess.deleteTodoItem(todoId)
  }

  export async function GetAll(userId: string): Promise<TodoItem[]> {
  
    return await todosAccess.GetAllToDo(userId)
  }
  