import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { JwtPayload } from '../../auth/JwtPayload'
// import { Jwt } from '../../auth/Jwt'

const logger = createLogger('auth')

const jwksUrl = `https://dev-dw9-yk2u.us.auth0.com/.well-known/jwks.json`

let cachedCertificate: string

// let cert = `-----BEGIN CERTIFICATE-----
// MIIDDTCCAfWgAwIBAgIJTIjnteC3iNDYMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
// BAMTGWRldi1kdzkteWsydS51cy5hdXRoMC5jb20wHhcNMjIwNDE3MjA0NjI2WhcN
// MzUxMjI1MjA0NjI2WjAkMSIwIAYDVQQDExlkZXYtZHc5LXlrMnUudXMuYXV0aDAu
// Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAseR5iDdnNGmKw9Qd
// lCB/ecBI7jjtoaB8Ioe2/rD+Gp2zwKbzIuxdTQGV1BvC6Q+Fq0kHfq27D/dv9Nck
// aenDlFU1aY8Wk627Rb3YhMRtIGeCOBq+Aakae9mL7ZsuIwgTZfQBnarwsbTZip+N
// EUAXfpI9NozIJpS1ZOBBgRAa1tdaApfIu6PtwZapvfvV56FVOBtLNdwYAm3ccozN
// 8RKV7pJLI1mTHQftNgcgr7+i1X9TZDdY79joDVZHdmFnbhdL3xFiuZiXhAWfBkjc
// 55YmTFU4A3338E2/Jer+3+i3acoTC5s3MRY1enxVnPkQws9l4f64xtZWX9XMC/mW
// RqWUoQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBS7FGkfmxZ+
// xgsKcnetfllaoU3uYDAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
// ACLgHNXzPke6Fkp8c617yTt3/hVZxDPYCvseAgQjc4hv+DSJiAbdGtVc2Ob0Tqrb
// wAJqEL8nfSCZxsJimK6+M4R3QXhXI+B00tvEwlARb1EoIDpjFHCqTYC4/Ss399s6
// eZo/VdHVvxtFnLBqH0s3xErL6jRf1tLWIKXD8VdtTBecFeeqVUWpfQjgozWAcyuU
// 4XFF223/97bFUaMVSvrcpAaSGq+Q8Ll67lckOYV9/OhcbCAudYBqlNdZg50+n7NQ
// zZdwVUHJN8vhK1jV35/EkqMLosJ9qO/mwzRl2Osf1vV2iXlbfgES5MOzLzBthptV
// yZ1lnFKiClMSDZErWtFBpg4=
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
  // const jwt: Jwt = decode(token, { complete: true }) as Jwt
  // if (jwt.header.alg !== 'RS256') {
  //   // we are only supporting RS256 so fail if this happens.
  //   return null;
  // }
  logger.info('Verifying token ${token}')
  const cert = await JwksClient()

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  logger.info('Spliting token ${token} ')
  const token = split[1]
  logger.info('Getting token ${token} ')
  return token
}

async function JwksClient(): Promise<string> {
  if (cachedCertificate) return cachedCertificate

  logger.info('certificate from ${jwksUrl}')

  const response = await Axios.get(jwksUrl)
  const keys = response.data.keys

  if (!keys || !keys.length)
    throw new Error('No JWKS keys found')
    logger.info('Cannot get certificate from ${jwksUrl}')
  const signingKeys = keys.filter(
    key => key.use === 'sig' // JWK property `use` determines the JWK is for signature verification
           && key.kty === 'RSA' // We are only supporting RSA (RS256)
           && key.alg === 'RS256'  
           && key.n
           && key.e
           && key.kid // The `kid` must be present to be useful for later
           && (key.x5c && key.x5c.length)
  )

  if (!signingKeys.length)
    throw new Error('The JWKS endpoint did not contain any signature verification keys')
  
  const key = signingKeys[0]
  const pub = key.x5c[0] 

  cachedCertificate = convertCert(pub)

  logger.info('Valid cert found', cachedCertificate)

  return cachedCertificate
}

function convertCert(cert: string): string {
  cert = cert.match(/.{1,64}/g).join('\n')
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`
  return cert
}
