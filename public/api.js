const BASE_URL = "http://localhost:5000"
export async function getCrossword() {
  return await fetch(BASE_URL+"/api/crossword")
}
export async function getSpellingBee() {
  return await fetch(BASE_URL+"/api/spellingbee")
}







