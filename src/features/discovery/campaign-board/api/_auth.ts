import { auth } from '@clerk/tanstack-react-start/server'

export type SerializableJson =
  | null
  | string
  | number
  | boolean
  | SerializableJson[]
  | { [key: string]: SerializableJson }

export async function getCreatorAuthorizationHeaders(
  extraHeaders?: HeadersInit,
): Promise<HeadersInit> {
  const authObject = await auth()
  const token = await authObject.getToken()

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  }
}
