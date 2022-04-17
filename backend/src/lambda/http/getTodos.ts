import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { getUserId } from '../utils'
import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'


const logger = createLogger('getTodos')

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    logger.info('getTodos event', { event })
    const userId = getUserId(event)
    const items = await getTodosForUser(userId);
    return {
        statusCode: 200,
        body: JSON.stringify({
            items
        })
    }
  })
handler.use(
  cors({
    credentials: true
  })
)




