import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
// import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../businessLogic/todos'
// import * as uuid from 'uuid'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    // TODO: Implement creating a new TODO item
    const userId = getUserId(event)
    // const userId = uuid.v4()

    const newItem = await createTodo(userId,newTodo)

  //     if (!userId) {
  //   return {
  //     statusCode: 404,
  //     headers: {
  //       'Access-Control-Allow-Origin': '*'
  //     },
  //     body: JSON.stringify({
  //       error: 'User does not exist'
  //     })
  //   }
  // }
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      newItem: newItem
    })
  }
  })

handler.use(
  cors({
    credentials: true
  })
)
