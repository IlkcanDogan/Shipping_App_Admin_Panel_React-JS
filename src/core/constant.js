export const API_URL ="http://domain.com/sevkiyat/api/web.php"

export const UserStorage = () => {
    let userJson = JSON.parse(localStorage.getItem('user'));
    return userJson;
}