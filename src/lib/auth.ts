import jwt, { JwtPayload } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret'

export function signToken(payload: any) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload
    } catch (error) {
        return null
    }
}