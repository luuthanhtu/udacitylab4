import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = process.env.AUTH_0_JWKS_URL
// const cert_as = `-----BEGIN CERTIFICATE-----
// MIIDDTCCAfWgAwIBAgIJeFu9gHBmGvZDMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
// BAMTGWRldi1ndzMxbDMybi51cy5hdXRoMC5jb20wHhcNMjIwNDE2MTQxNTMxWhcN
// MzUxMjI0MTQxNTMxWjAkMSIwIAYDVQQDExlkZXYtZ3czMWwzMm4udXMuYXV0aDAu
// Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA42rMgMNZDnG9obSp
// U8HrRmd0x1EJObfdDkY84Q07HDOMW607cJGz9n+1Y8tlXFR3Qkei/q1W38vMyFs/
// Z/UYlZP0MkaNKhUegUiijA7qDHqfpL9XzIarKs0FKHwhQ7yAaKAy05tUJ0zSAcGS
// nlTfu91caGaNLnRNs5TYd5r9UiPyAcPzW470GbjB9ck4mU7TqZLR2v5DYKlJDiy1
// 5za7YZ42tjo/UtUvAI0PqyS6LqgyOqMUeqWGONUuIWXAX+MpXAcgbDMka5BJreDy
// wC6Eh/0wHapAHs+TdDrN/bFnV8pCYk+FU9nxzaQOvTaOuW1br5HAWjLbJaajV1E5
// ZWVghQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTjE/kkCfEH
// AcBv7GUsUav4whEGfDAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
// AGsCrstLDNJLB+f8Cnb3DT+QajuVDen6FkOoZZAwKPE2RhoeNah3nmWPXv06DMCB
// r7d2sXt0M1uZFqifgsk1q499/0Wlc6mY76mZXZU4/aSJGOMLEh/xmUS4Sf4ybpGx
// 1zMmpABLQpIWnT/GO2movfUPV/eOGYFohCIwvRtPY9B1eNljnWohxj69RXtRr1s1
// xRFelYixTmB5jQQavoBZNfrFKKDXX5oXHBxbscx8lARJxEb2W6+I67bbvLUcsSZ3
// y4uMwkSGNamemUnt+lUU/4G1ypYLBwbBlZ1bqNCf0/dxpoP+PKJja8Q/CEGfepX1
// FWXa9Z6eq4BkxW8G971eZ7c=
// -----END CERTIFICATE-----`


export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const decoded = jwt
  console.log(decoded);
  let cert;
  const res = await Axios.get(jwksUrl);
  const pemData = res['data']['keys'][0]['x5c'][0];
  cert = `-----BEGIN CERTIFICATE-----\n${pemData}\n-----END CERTIFICATE-----`;  

  return verify(token, cert, { algorithms: ['RS256']}) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
