import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import * as uuid from 'uuid'
import { createAttachmentPresignedUrl, updateAttachmentUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('GenuploadURL')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    logger.info('GenuploadURL event', { event })
    const userId = getUserId(event)
    const attachmentId = uuid.v4()
  
    const uploadUrl = await createAttachmentPresignedUrl(attachmentId)
  
    await updateAttachmentUrl(userId, todoId, attachmentId)

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadUrl
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
