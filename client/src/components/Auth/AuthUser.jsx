import { getToken, getUserEmail } from "../../utils"
import { Navigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"

export function AuthUser ({ children }) {
    const token = getToken()
    const userEmail = getUserEmail()

    try {
        const user = jwtDecode(token)

        if (user.userEmail !== userEmail) {
            throw new Error("User email mismatch")
        }

        return <>{children}</>
    }
    catch (err) {
        return <Navigate to={'/'} replace />
    }
}