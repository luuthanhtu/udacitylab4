import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { updateAttachmentUrl } from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
// import { getUserId } from '../utils'
import { TodosStorage } from '../../businessLogic/attachmentUtils'
import * as uuid from 'uuid'
import { updateTodo } from '../../businessLogic/todos'


const todosStorage = new TodosStorage()

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
    const attachmentId = uuid.v4();
    const attachmentUrl = await todosStorage.getAttachmentUrl(attachmentId)
    const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
    const UpdateItem = await updateTodo(todoId, updatedTodo)

    await updateAttachmentUrl(todoId,attachmentUrl)
    return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          UpdateItem: UpdateItem
        })
      }

}
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
