import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { createAttachmentPresignedUrl, updateAttachmentUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import * as uuid from 'uuid'

const logger = createLogger('generateUploadUrl')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    logger.info('Processing generateUploadUrl event', { event })

    const userId = getUserId(event)
    const todoId = event.pathParameters.todoId
    const attachmentId = uuid.v4()
  
    const uploadUrl = await createAttachmentPresignedUrl(attachmentId)
  
    await updateAttachmentUrl(userId, todoId, attachmentId)
    return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            uploadUrl: uploadUrl
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