(function(){
  const STORE_KEY = "michele_bank_state_v2";
  const SESSION_KEY = "michele_bank_session_v1";
  const EMBEDDED_DEMO = {"bank": {"name": "BNP PARIBAS FORTIS", "currency": "EUR"}, "user": {"id": "u_michele", "username": "michele", "password": "Viggiano@2025", "fullName": "MICHELE VIGGIANO", "email": "michele.viggiano@BNP PARIBAS FORTIS.example", "phone": "", "city": "Bruxelles", "accounts": [{"id": "a1", "type": "Compte courant", "number": "IT-001-4587-2201", "balance": 468000.0, "iban": "IT60X0542811101000000123456"}, {"id": "a2", "type": "Épargne", "number": "IT-002-1109-8871", "balance": 8200.0, "goal": "Projet maison", "target": 20000.0}], "cards": [{"id": "c1", "label": "Visa Premium", "masked": "**** 4021", "status": "Bloquée", "payLimit": 2500.0, "atmLimit": 800.0}, {"id": "c2", "label": "Mastercard Virtual", "masked": "**** 9188", "status": "Bloquée", "payLimit": 1200.0, "atmLimit": 0.0}], "beneficiaries": [{"id": "b1", "name": "Luca Bianchi", "iban": "IT12X0300203280000400000000"}, {"id": "b2", "name": "Fournisseur — Internet", "iban": "IT94X0760103200000001234567"}], "transactions": [{"id": "t1", "date": "2025-04-15", "label": "Paiement — Supermarché", "amount": -85.0, "status": "Terminé"}, {"id": "t2", "date": "2025-04-07", "label": "Salaire", "amount": 1200.0, "status": "Terminé"}, {"id": "t3", "date": "2025-03-24", "label": "Abonnement Internet", "amount": -45.0, "status": "Terminé"}, {"id": "t4", "date": "2025-03-17", "label": "Restaurant", "amount": -62.3, "status": "Terminé"}, {"id": "t5", "date": "2025-03-12", "label": "Virement entrant — Luca Bianchi", "amount": 250.0, "status": "Terminé"}], "savings": [{"id": "s1", "label": "Projet maison", "current": 8200.0, "target": 20000.0, "monthly": 300.0}]}};

  const qs = (s, el=document)=> el.querySelector(s);
  const qsa = (s, el=document)=> Array.from(el.querySelectorAll(s));

  const fmt = (n)=>{
    const sign = n<0 ? "-" : "";
    const v = Math.abs(Number(n)||0);
    // format 12 450,00
    const parts = v.toFixed(2).split(".");
    const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${sign}${int},${parts[1]} €`;
  };

  const currentDateISO = ()=> new Date().toISOString().slice(0,10);

  const seedStamp = (state)=> JSON.stringify({
    fullName: state?.user?.fullName || "",
    email: state?.user?.email || "",
    phone: state?.user?.phone || "",
    city: state?.user?.city || "",
    accounts: state?.user?.accounts || [],
    cards: state?.user?.cards || [],
    beneficiaries: state?.user?.beneficiaries || [],
    transactions: state?.user?.transactions || []
  });

  async function loadDemo(){
    // NOTE: si tu ouvres index.html en "file://", certains navigateurs bloquent fetch().
    // On essaie fetch(), sinon on utilise une donnée embarquée.
    const candidates = ["./data/michele.json","../data/michele.json"];
    const cacheBust = Date.now();
    for(const p of candidates){
      try{
        const r = await fetch(`${p}?v=${cacheBust}`, { cache: "no-store" });
        if(r && r.ok) return await r.json();
      }catch(e){}
    }
    return EMBEDDED_DEMO;
  }

  async function getState(){
    const demo = await loadDemo();
    const demoSeed = seedStamp(demo);

    const s = localStorage.getItem(STORE_KEY);
    if(s){
      const state = JSON.parse(s);
      if(state?.__seedStamp !== demoSeed){
        const refreshed = { ...demo, __seedStamp: demoSeed };
        saveState(refreshed);
        return refreshed;
      }
      return state;
    }

    const initial = { ...demo, __seedStamp: demoSeed };
    saveState(initial);
    return initial;
  }
  function saveState(state){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

  function getSession(){
    const s = localStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  }
  function setSession(){ localStorage.setItem(SESSION_KEY, JSON.stringify({ at: Date.now() })); }
  function clearSession(){ localStorage.removeItem(SESSION_KEY); }

  function showModal(title, body){
    const backdrop = qs("[data-modal-backdrop]");
    if(!backdrop){ alert(body); return; }
    qs("[data-modal-title]").textContent = title;
    qs("[data-modal-body]").textContent = body;
    backdrop.style.display = "flex";
  }
  function closeModal(){
    const backdrop = qs("[data-modal-backdrop]");
    if(backdrop) backdrop.style.display = "none";
  }

  // modal close (delegation: works even if modal HTML is parsed after this script)
  document.addEventListener("click", (e)=>{
    const closeButton = e.target.closest("[data-modal-close]");
    if(closeButton){
      closeModal();
      return;
    }
    const backdrop = e.target.closest("[data-modal-backdrop]");
    if(backdrop && e.target === backdrop){
      closeModal();
    }
  });

  // help button
  qsa("[data-help]").forEach(b=> b.addEventListener("click", ()=>{
    showModal("Assistance", "Support client. En production : chat, tickets, hotline.");
  }));

  // logout
  qsa("[data-logout]").forEach(b=> b.addEventListener("click", ()=>{
    clearSession();
    window.location.href = "../index.html";
  }));

  // protect portal pages
  const protect = document.body.getAttribute("data-protect");
  if(protect === "true"){
    const sess = getSession();
    if(!sess) window.location.href = "../index.html";
  }

  // active link
  const active = document.body.getAttribute("data-active");
  if(active){
    qsa("[data-key]").forEach(a=>{
      if(a.getAttribute("data-key")===active) a.classList.add("active");
    });
  }

  // login form
  const loginForm = qs("[data-login-form]");
  if(loginForm){
    loginForm.addEventListener("submit", (e)=>{
      e.preventDefault();
      setSession();
      window.location.href = "./portal/dashboard.html";
    });
  }

  function renderUserHeader(state){
    const u = state.user;
    const avatar = qs("[data-avatar]");
    const name = qs("[data-user-name]");
    const meta = qs("[data-user-meta]");
    const first = qs("[data-user-firstname]");
    if(avatar) avatar.textContent = (u.fullName||"?").trim().slice(0,1);
    if(name) name.textContent = u.fullName || "Client";
    if(meta) meta.textContent = `${u.city} • ${u.phone}`;
    if(first) first.textContent = (u.fullName||"Client").split(" ")[0];
  }

  function txRow(t){
    const tag = `<span class="tag ok">${t.status || "Terminé"}</span>`;
    return `<tr><td>${t.date}</td><td>${t.label}</td><td><b>${fmt(t.amount)}</b></td><td>${tag}</td></tr>`;
  }

  function renderStats(state){
    const box = qs("[data-stats]");
    if(!box) return;
    const u = state.user;
    const courant = u.accounts[0];
    const epargne = u.accounts[1];
    const spends = u.transactions.filter(t=>t.amount<0).slice(0,6).reduce((s,t)=>s+Math.abs(t.amount),0);
    box.innerHTML = `
      <div class="stat"><div class="k">Solde disponible</div><div class="v">${fmt(courant.balance)}</div><div class="small">${courant.type}</div></div>
      <div class="stat"><div class="k">Épargne</div><div class="v">${fmt(epargne.balance)}</div><div class="small">${epargne.goal ? ("Objectif: " + epargne.goal) : epargne.type}</div></div>
      <div class="stat"><div class="k">Dépenses récentes</div><div class="v">-${fmt(spends).replace(" €","")} €</div><div class="small">Estimation</div></div>
    `;
  }

  function renderLastTx(state){
    const tbody = qs("[data-last-tx]");
    if(!tbody) return;
    tbody.innerHTML = state.user.transactions.slice(0,6).map(txRow).join("");
  }

  function renderAllTx(state){
    const tbody = qs("[data-all-tx]");
    if(!tbody) return;
    tbody.innerHTML = state.user.transactions.map(txRow).join("");
  }

  function renderAccounts(state){
    const box = qs("[data-accounts]");
    if(!box) return;
    const u = state.user;
    box.innerHTML = u.accounts.map(a=>{
      const goal = a.target ? `<div class="progress"><div style="width:${Math.min(100, Math.round((a.balance/a.target)*100))}%"></div></div>
        <div class="small" style="margin-top:8px">${fmt(a.balance)} / ${fmt(a.target)} — ${a.goal || "Objectif"}</div>` : "";
      return `
        <div class="panel">
          <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start">
            <div>
              <span class="badge">${a.type}</span>
              <div style="font-weight:950; font-size:22px; margin-top:10px">${fmt(a.balance)}</div>
              <div class="small" style="margin-top:6px">N° ${a.number}</div>
              ${a.iban ? `<div class="small">IBAN: <span class="kbd">${a.iban}</span></div>` : ""}
              ${goal}
            </div>
            <div class="icon">💼</div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderSavingsSummary(state){
    const box = qs("[data-savings-summary]");
    if(!box) return;
    const s = state.user.savings?.[0];
    if(!s){ box.innerHTML = `<div class="small">Aucun objectif.</div>`; return; }
    const pct = Math.min(100, Math.round((s.current/s.target)*100));
    box.innerHTML = `
      <div class="small"><b>${s.label}</b></div>
      <div class="small">${fmt(s.current)} / ${fmt(s.target)} (${pct}%)</div>
      <div class="progress"><div style="width:${pct}%"></div></div>
      <div class="small" style="margin-top:8px">Versement mensuel suggéré : ${fmt(s.monthly)}</div>
    `;
  }

  function renderCardsMini(state){
    const box = qs("[data-cards-mini]");
    if(!box) return;
    const cards = state.user.cards || [];
    box.innerHTML = cards.slice(0,2).map(c=>`
      <div class="card">
        <div class="virtual-card compact">
          <div class="vc-top">
            <div class="vc-chip"></div>
            <div class="vc-brand">VIRTUAL</div>
          </div>
          <div class="vc-number">${c.masked}</div>
          <div class="vc-meta">
            <div>
              <div class="vc-label">Titulaire</div>
              <div class="vc-value">MICHELE VIGGIANO</div>
            </div>
            <div>
              <div class="vc-label">Expire</div>
              <div class="vc-value">12/29</div>
            </div>
          </div>
        </div>
        <div class="small" style="font-weight:900; margin-top:10px">${c.label}</div>
        <div class="small" style="margin-top:6px">Statut: <span class="tag bad">Bloquée</span></div>
      </div>
    `).join("");
  }

  function renderCards(state){
    const box = qs("[data-cards]");
    if(!box) return;
    const cards = state.user.cards || [];
    box.innerHTML = cards.map(c=>`
      <div class="panel">
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start">
          <div>
            <span class="badge">${c.label}</span>
            <div class="virtual-card" style="margin-top:10px; min-width:300px">
              <div class="vc-top">
                <div class="vc-chip"></div>
                <div class="vc-brand">BNP PARIBAS</div>
              </div>
              <div class="vc-number">${c.masked}</div>
              <div class="vc-meta">
                <div>
                  <div class="vc-label">Titulaire</div>
                  <div class="vc-value">MICHELE VIGGIANO</div>
                </div>
                <div>
                  <div class="vc-label">Expire</div>
                  <div class="vc-value">12/29</div>
                </div>
              </div>
            </div>
            <div class="small" style="margin-top:6px">Statut: <span class="tag bad">Bloquée</span></div>
          </div>
          <div class="icon">💳</div>
        </div>
        <div class="split" style="margin-top:12px">
          <div class="card"><b>Plafond paiement</b><div class="small">${fmt(c.payLimit)}/semaine</div></div>
          <div class="card"><b>Plafond retrait</b><div class="small">${fmt(c.atmLimit)}/semaine</div></div>
        </div>
        <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap">
          <button class="btn" data-card-toggle="${c.id}">Bloquer / Débloquer</button>
          <button class="btn btn-primary" data-card-limits="${c.id}">Modifier plafonds</button>
        </div>
      </div>
    `).join("");

    qsa("[data-card-toggle]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-card-toggle");
        const card = state.user.cards.find(x=>x.id===id);
        card.status = "Bloquée";
        saveState(state);
        renderCards(state);
        showModal("Carte", `Statut mis à jour : ${card.status}.`);
      });
    });
    qsa("[data-card-limits]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        showModal("Plafonds", "En production, changement plafonds + validation (MFA/OTP).");
      });
    });
  }

  function hydrateTransferLists(state){
    const selA = qs("[data-from-account]");
    if(selA){
      selA.innerHTML = state.user.accounts.map(a=>`<option value="${a.id}">${a.type} — ${a.number} (${fmt(a.balance)})</option>`).join("");
    }
  }

  function renderTransferTx(state){
    const tbody = qs("[data-transfer-tx]");
    if(!tbody) return;
    const tx = state.user.transactions.filter(t=>String(t.label||"").toLowerCase().includes("virement")).slice(0,10);
    tbody.innerHTML = tx.map(txRow).join("");
  }

  function bindTransferForm(state){
    const form = qs("[data-transfer-form]");
    if(!form) return;
    form.addEventListener("submit", (e)=>{
      e.preventDefault();
      const alertBox = qs("[data-alert]", form);
      const beneficiaryName = (qs('[name="beneficiaryName"]', form).value || "").trim();
      const beneficiaryIban = (qs('[name="beneficiaryIban"]', form).value || "").trim();
      if(!beneficiaryName || !beneficiaryIban){
        alertBox.className = "alert bad";
        alertBox.textContent = "Veuillez saisir le nom et le RIB/IBAN du bénéficiaire.";
        alertBox.classList.remove("hidden");
        return;
      }
      showModal("Compte bloqué", "votre compte est bloquez veuillez proceder au déblocage pour effectuer un virement");
      return;
      const fromId = qs('[name="fromAccount"]', form).value;
      const benId = "manual";
      const amount = parseFloat((qs('[name="amount"]', form).value || "").replace(",", "."));
      const reason = (qs('[name="reason"]', form).value || "").trim();

      if(!amount || amount<=0){
        alertBox.className = "alert bad"; alertBox.textContent = "Montant invalide."; alertBox.classList.remove("hidden"); return;
      }
      const account = state.user.accounts.find(a=>a.id===fromId);
      const ben = { id: benId, name: beneficiaryName, iban: beneficiaryIban };
      if(!account){
        alertBox.className = "alert bad"; alertBox.textContent = "Veuillez choisir un compte."; alertBox.classList.remove("hidden"); return;
      }
      if(account.balance < amount){
        alertBox.className = "alert bad"; alertBox.textContent = "Solde insuffisant."; alertBox.classList.remove("hidden"); return;
      }

      account.balance -= amount;
      state.user.transactions.unshift({
        id: "t" + Math.random().toString(16).slice(2),
        date: currentDateISO(),
        label: `Virement sortant — ${ben.name}${reason ? " ("+reason+")" : ""}`,
        amount: -amount,
        status: "Terminé"
      });

      saveState(state);
      alertBox.className = "alert ok";
      alertBox.textContent = `Virement validé : ${fmt(amount)} vers ${ben.name}`;
      alertBox.classList.remove("hidden");
      form.reset();

      hydrateTransferLists(state);
      renderTransferTx(state);
    });
  }

  function bindSavingsButtons(state){
    const dep = qs("[data-savings-deposit]");
    const wit = qs("[data-savings-withdraw]");
    if(dep){
      dep.addEventListener("click", ()=>{
        const val = prompt("Montant à verser sur l’épargne (€) ?");
        const amount = parseFloat((val||"").replace(",", "."));
        if(!amount || amount<=0) return;
        const courant = state.user.accounts[0];
        const epargne = state.user.accounts[1];
        if(courant.balance < amount){
          showModal("Épargne", "Solde insuffisant.");
          return;
        }
        courant.balance -= amount;
        epargne.balance += amount;
        const s = state.user.savings?.[0];
        if(s) s.current = epargne.balance;

        state.user.transactions.unshift({
          id: "t" + Math.random().toString(16).slice(2),
          date: currentDateISO(),
          label: "Versement épargne",
          amount: -amount,
          status: "Terminé"
        });

        saveState(state);
        renderStats(state);
        renderLastTx(state);
        renderSavingsSummary(state);
        showModal("Épargne", `Versement effectué : ${fmt(amount)}.`);
      });
    }
    if(wit){
      wit.addEventListener("click", ()=>{
        const val = prompt("Montant à retirer de l’épargne (€) ?");
        const amount = parseFloat((val||"").replace(",", "."));
        if(!amount || amount<=0) return;
        const courant = state.user.accounts[0];
        const epargne = state.user.accounts[1];
        if(epargne.balance < amount){
          showModal("Épargne", "Solde épargne insuffisant.");
          return;
        }
        epargne.balance -= amount;
        courant.balance += amount;
        const s = state.user.savings?.[0];
        if(s) s.current = epargne.balance;

        state.user.transactions.unshift({
          id: "t" + Math.random().toString(16).slice(2),
          date: currentDateISO(),
          label: "Retrait épargne",
          amount: +amount,
          status: "Terminé"
        });

        saveState(state);
        renderStats(state);
        renderLastTx(state);
        renderSavingsSummary(state);
        showModal("Épargne", `Retrait effectué : ${fmt(amount)}.`);
      });
    }
  }

  function bindQuickActions(){
    qsa("[data-action]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const a = btn.getAttribute("data-action");
        if(a==="alerts") showModal("Alertes", "Notifications activées (paiements, virements).");
        if(a==="export") showModal("Relevés", "Export PDF/CSV (à connecter en production).");
        if(a==="password") showModal("Mot de passe", "Écran changement mot de passe.");
        if(a==="mfa") showModal("2FA", "Activer MFA/OTP en production.");
      });
    });
  }

  function bindProfileForm(state){
    const form = qs("[data-profile-form]");
    if(!form) return;
    const alertBox = qs("[data-profile-alert]");
    const u = state.user;
    qs('input[name="fullName"]', form).value = u.fullName || "";
    qs('input[name="email"]', form).value = u.email || "";
    qs('input[name="phone"]', form).value = u.phone || "";
    qs('input[name="city"]', form).value = u.city || "";

    form.addEventListener("submit", (e)=>{
      e.preventDefault();
      u.fullName = qs('input[name="fullName"]', form).value.trim();
      u.email = qs('input[name="email"]', form).value.trim();
      u.phone = qs('input[name="phone"]', form).value.trim();
      u.city = qs('input[name="city"]', form).value.trim();
      saveState(state);
      alertBox.className = "alert ok";
      alertBox.textContent = "Profil enregistré.";
      alertBox.classList.remove("hidden");
      renderUserHeader(state);
    });

    const reset = qs("[data-reset]");
    if(reset){
      reset.addEventListener("click", ()=>{
        localStorage.removeItem(STORE_KEY);
        clearSession();
        showModal("Reset", "Données réinitialisées. Reconnectez-vous.");
        setTimeout(()=> window.location.href="../index.html", 500);
      });
    }
  }

  // hydrate portal pages
  (async ()=>{
    const needsUser = qs("[data-user-name]") || qs("[data-stats]") || qs("[data-accounts]") || qs("[data-cards]") || qs("[data-all-tx]");
    if(!needsUser) { bindQuickActions(); return; }

    const state = await getState();
    renderUserHeader(state);
    bindQuickActions();

    renderStats(state);
    renderLastTx(state);
    renderAllTx(state);
    renderAccounts(state);
    renderSavingsSummary(state);
    renderCardsMini(state);
    renderCards(state);

    hydrateTransferLists(state);
    renderTransferTx(state);
    bindTransferForm(state);

    bindSavingsButtons(state);
    bindProfileForm(state);
  })();
})();
