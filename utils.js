// utils.js
function generateRandomID() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const idLength = 11;
    let id = '';
  
    for (let i = 0; i < idLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      id += characters.charAt(randomIndex);
    }
  
    return id;
  }
  
  module.exports = { generateRandomID };
  