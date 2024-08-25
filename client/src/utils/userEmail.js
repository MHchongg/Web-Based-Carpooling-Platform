const userEmail_key = 'userEmail'

function setUserEmail (userEmail) {
    localStorage.setItem(userEmail_key, userEmail)
}

function getUserEmail() {
    return localStorage.getItem(userEmail_key)
}

function removeUserEmail() {
    localStorage.removeItem(userEmail_key)
}

export {
    setUserEmail,
    getUserEmail,
    removeUserEmail,
}