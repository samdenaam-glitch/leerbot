// ========== GLOBALE FUNCTIE (direct beschikbaar) ==========
window.getLijstId = function() {
  // Als lijstId al bestaat (uit eerdere aanroep), geef die terug
  if (window._lijstId) return window._lijstId;
  // Anders uit de URL halen
  const urlParams = new URLSearchParams(window.location.search);
  window._lijstId = urlParams.get('id');
  console.log('getLijstId opgeroepen, gevonden ID:', window._lijstId);
  return window._lijstId;
}

// ========== HOOFDPROGRAMMA ==========
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📋 lijst.js geladen - DOMContentLoaded');

  // Controleer of supabase beschikbaar is
  if (typeof supabase === 'undefined') {
    console.error('supabase is niet gedefinieerd! script.js mogelijk niet geladen.');
    alert('Fout: Kan geen verbinding maken. Ververs de pagina.');
    return;
  }

  // Sessie ophalen
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('Fout bij ophalen sessie:', sessionError);
    alert('Sessie fout: ' + sessionError.message);
    return;
  }
  if (!session) {
    console.warn('Geen sessie, doorsturen naar index.html');
    window.location.href = 'index.html';
    return;
  }
  console.log('Ingelogd als:', session.user.email);
  document.getElementById('username').textContent = session.user.email;

  // Lijst-ID ophalen (via de globale functie)
  const lijstId = window.getLijstId();
  if (!lijstId) {
    alert('Geen lijst geselecteerd');
    window.location.href = 'dashboard.html';
    return;
  }
  console.log('Lijst ID:', lijstId);

  // Laad lijstnaam en woorden (fouten worden intern afgevangen)
  await laadLijstNaam(session.access_token, lijstId);
  await laadWoorden(session.access_token, lijstId);

  // ========== EVENT LISTENER VOOR TOEVOEGEN ==========
  const voegBtn = document.getElementById('voegWoordBtn');
  if (voegBtn) {
    voegBtn.addEventListener('click', async () => {
      console.log('➕ Toevoegen knop geklikt');
      const bron = document.getElementById('bronWoord').value.trim();
      const doel = document.getElementById('doelWoord').value.trim();
      if (!bron || !doel) {
        showToast('Vul beide woorden in!', 'warning');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('Niet ingelogd', 'error');
        return;
      }

      try {
        console.log('📡 Versturen POST /api/words met:', { source_word: bron, target_word: doel });
        const res = await fetch(`/api/words?listId=${lijstId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ source_word: bron, target_word: doel })
        });
        console.log('Response status:', res.status);
        if (res.ok) {
          document.getElementById('bronWoord').value = '';
          document.getElementById('doelWoord').value = '';
          await laadWoorden(session.access_token, lijstId);
          showToast('Woord toegevoegd!', 'success');
        } else {
          const err = await res.json().catch(() => ({}));
          console.error('Fout bij toevoegen:', err);
          showToast('Fout bij toevoegen: ' + (err.error || 'Onbekende fout'), 'error');
        }
      } catch (e) {
        console.error('Netwerkfout bij toevoegen:', e);
        showToast('Netwerkfout: ' + e.message, 'error');
      }
    });
  } else {
    console.error('Knop "voegWoordBtn" niet gevonden!');
  }
});

// ========== HULPFUNCTIES ==========
async function laadLijstNaam(token, lijstId) {
  try {
    console.log('📡 Ophalen lijstnaam via /api/lists');
    const res = await fetch('/api/lists', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    const lijsten = await res.json();
    const lijst = lijsten.find(l => l.id == lijstId);
    if (lijst) {
      document.getElementById('lijstNaam').textContent = lijst.name;
      console.log('Lijstnaam ingesteld:', lijst.name);
    } else {
      console.warn('Lijst niet gevonden in resultaten');
    }
  } catch (e) {
    console.error('Fout bij laadLijstNaam:', e);
    showToast('Fout bij laden lijstnaam: ' + e.message, 'error');
  }
}

async function laadWoorden(token, lijstId) {
  try {
    console.log('📡 Ophalen woorden via /api/words?listId=', lijstId);
    const res = await fetch(`/api/words?listId=${lijstId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    const woorden = await res.json();
    console.log('Aantal woorden ontvangen:', woorden.length);

    const container = document.getElementById('woordenContainer');
    container.innerHTML = '';
    if (woorden.length === 0) {
      container.innerHTML = '<p style="text-align:center;">Nog geen woordjes. Voeg er een toe!</p>';
      return;
    }
    woorden.forEach(w => {
      const div = document.createElement('div');
      div.className = 'word-item';
      div.innerHTML = `
        <div class="word-pair">
          <span class="source">${escapeHTML(w.source_word)}</span>
          <span>→</span>
          <span class="target">${escapeHTML(w.target_word)}</span>
        </div>
        <button onclick="verwijderWoord(${w.id})">🗑️</button>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error('Fout bij laadWoorden:', e);
    showToast('Fout bij laden woorden: ' + e.message, 'error');
  }
}

// Simpele escape functie om XSS te voorkomen
function escapeHTML(str) {
  return String(str).replace(/[&<>"]/g, function(match) {
    if (match === '&') return '&amp;';
    if (match === '<') return '&lt;';
    if (match === '>') return '&gt;';
    if (match === '"') return '&quot;';
    return match;
  });
}

window.verwijderWoord = async function(id) {
  if (!confirm('Weet je zeker dat je dit woord wilt verwijderen?')) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    showToast('Niet ingelogd', 'error');
    return;
  }
  const lijstId = window.getLijstId();
  try {
    console.log('🗑️ Verwijder woord ID:', id);
    const res = await fetch(`/api/words?listId=${lijstId}&id=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      await laadWoorden(session.access_token, lijstId);
      showToast('Woord verwijderd', 'success');
    } else {
      const err = await res.json().catch(() => ({}));
      console.error('Fout bij verwijderen:', err);
      showToast('Fout bij verwijderen', 'error');
    }
  } catch (e) {
    console.error('Netwerkfout bij verwijderen:', e);
    showToast('Netwerkfout: ' + e.message, 'error');
  }
}
