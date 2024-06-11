const key = 'mqtt.auth.client'
export interface LoginInfo {
    server: string,
    clientId: string,
    username?: string,
    password?: string,
}

export function getStoredUser(): LoginInfo| null {
    const info = localStorage.getItem(key)
    if(info) {
        return JSON.parse(info) as LoginInfo
    }
    return null
}

export function setStoredUser(user: LoginInfo | null) {
    if (user) {
        localStorage.setItem(key, JSON.stringify(user))
    } else {
        localStorage.removeItem(key)
    }
}
