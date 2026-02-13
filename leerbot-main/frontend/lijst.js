// ========== GLOBALE FUNCTIE (direct beschikbaar) ==========
window.getLijstId = function() {
  // Als we hem al hebben opgeslagen, geef die terug
  if (window._lijstId) return window._lijstId;
  // Anders uit URL halen
  const urlParams = new URLSearchParams(window.location.search);
  window._lijstId = urlParams.get('id');
  return window._lijstId;
}

// ========== HOOFDPROGRAMMA ==========
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📋 lijst.js gestart');

  // Controleer of Supabase beschikbaar is
  if (typeof supabase === 'undefined') {
    console.error('Supabase niet geladen');
    alert('Fout: Kan geen verbinding maken. Ververs de pagina.');
    return;
  }

  // Sessie ophalen
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error('Geen sessie:', sessionError);
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('username').textContent = session.user.email;

  // Lijst-ID ophalen
  const lijstId = window.getLijstId();
  if (!lijstId) {
    alert('Geen lijst geselecteerd');
    window.location.href = 'dashboard.html';
    return;
  }
  console.log('Lijst ID:', lijstId);

  // Laad lijstnaam en woorden
  await laadLijstNaam(session.access_token, lijstId);
  await laadWoorden(session.access_token, lijstId);

  // Event listener voor toevoegen
  document.getElementById('voegWoordBtn').addEventListener('click', async () => {
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
      const res = await fetch(`/api/words?listId=${lijstId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ source_word: bron, target_word: doel })
      });

      if (res.ok) {
        document.getElementById('bronWoord').value = '';
        document.getElementById('doelWoord').value = '';
        await laadWoorden(session.access_token, lijstId);
        showToast('Woord toegevoegd!', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('Fout: ' + (err.error || 'Onbekend'), 'error');
      }
    } catch (e) {
      showToast('Netwerkfout: ' + e.message, 'error');
    }
  });
});

// ========== HULPFUNCTIES ==========
async function laadLijstNaam(token, lijstId) {
  try {
    const res = await fetch('/api?resource=lists', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Lijsten niet geladen');
    const lijsten = await res.json();
    const lijst = lijsten.find(l => l.id == lijstId);
    if (lijst) document.getElementById('lijstNaam').textContent = lijst.name;
  } catch (e) {
    console.warn('Lijstnaam laden mislukt:', e);
  }
}

async function laadWoorden(token, lijstId) {
  try {
    const res = await fetch(`/api/words?listId=${lijstId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Woorden niet geladen');
    const woorden = await res.json();

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
    console.error('Fout bij laden woorden:', e);
    showToast('Fout bij laden woorden', 'error');
  }
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    return m;
  });
}

window.verwijderWoord = async function(id) {
  if (!confirm('Weet je zeker dat je dit woord wilt verwijderen?')) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const lijstId = window.getLijstId();
  try {
    const res = await fetch(`/api/words?listId=${lijstId}&id=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    if (res.ok) {
      await laadWoorden(session.access_token, lijstId);
      showToast('Woord verwijderd', 'success');
    } else {
      showToast('Fout bij verwijderen', 'error');
    }
  } catch (e) {
    showToast('Netwerkfout', 'error');
  }
}
