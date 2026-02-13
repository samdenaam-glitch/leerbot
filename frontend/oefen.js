function toonKaart(index) {
  if (woorden.length === 0) return
  huidigeIndex = index
  toonAntwoord = false
  document.getElementById('voorkant').textContent = woorden[index].source_word
  document.getElementById('voorkant').classList.add('active')
  document.getElementById('achterkant').classList.remove('active')
  document.getElementById('achterkant').textContent = woorden[index].target_word
  document.getElementById('teller').textContent = `${index+1} / ${woorden.length}`
}

window.draaiKaart = function() {
  if (woorden.length === 0) return
  toonAntwoord = !toonAntwoord
  if (toonAntwoord) {
    document.getElementById('voorkant').classList.remove('active')
    document.getElementById('achterkant').classList.add('active')
  } else {
    document.getElementById('voorkant').classList.add('active')
    document.getElementById('achterkant').classList.remove('active')
  }
}
