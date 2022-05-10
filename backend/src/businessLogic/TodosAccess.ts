import 'source-map-support/register'

import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
const AWSXRay = require('aws-xray-sdk');

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'

const logger = createLogger('todosAccess')

const XAWS = AWSXRay.captureAWS(AWS)

export class TodosAccess {

  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosByUserIndex = process.env.TODOS_CREATED_AT_INDEX
  ) {}

  async getTodoItems(userId: string): Promise<TodoItem[]> {
    logger.info(`Getting all todos for user ${userId}`)

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosByUserIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

    const items = result.Items

    logger.info(`Found ${items.length} todos for user ${userId}`)

    return items as TodoItem[]
  }

  async getTodoItem(todoId: string): Promise<TodoItem> {
    logger.info(`Get todo ${todoId}`)

    const result = await this.docClient.get({
      TableName: this.todosTable,
      Key: {
        todoId
      }
    }).promise()

    const item = result.Item

    return item as TodoItem
  }

  async createTodoItem(todoItem: TodoItem) {
    logger.info(`Putting todo ${todoItem.todoId} into ${this.todosTable}`)

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem,
    }).promise()
  }

  async updateTodoItem(todoId: string, todoUpdate: TodoUpdate) {
    logger.info(`Updating todo item ${todoId}`)

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId
      },
      UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeNames: {
        "#name": "name"
      },
      ExpressionAttributeValues: {
        ":name": todoUpdate.name,
        ":dueDate": todoUpdate.dueDate,
        ":done": todoUpdate.done
      }
    }).promise()   
  }

  async deleteTodoItem(todoId: string) {
    logger.info(`Deleting todo item ${todoId} from ${this.todosTable}`)

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        todoId
      }
    }).promise()    
  }

  async updateAttachmentUrl(todoId: string, attachmentUrl: string) {
    logger.info(`Updating attachment URL for todo ${todoId}`)

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId
      },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      }
    }).promise()
  }

}
