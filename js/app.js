/* Tandem – Calls prototype. Plain JS, single state object, re-render on change. */
(() => {
  const D = window.DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ic = (n, cls = '') => `<img class="ic ${cls}" src="assets/icons/${n}.svg" alt="">`;
  const pad = (n) => String(n).padStart(2, '0');
  const mmss = (sec) => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(sec % 60); };
  const nowHM = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const uid = () => Math.random().toString(36).slice(2, 9);

  const ME = () => (S.guestMode ? { ...D.me, name: S.guestName || 'Guest', short: 'You', initials: (S.guestName || 'G').slice(0, 2).toUpperCase() } : D.me);
  const P = (id) => (id === 'me' ? ME() : D.people[id]);
  const nameOf = (id) => (id === 'me' ? ME().name + ' (You)' : P(id).name);
  const avatar = (id, cls) => { const p = P(id); return `<span class="${cls}" style="background:${p.color}">${p.photo ? `<img src="${p.photo}" alt="">` : p.initials}</span>`; };
  const listNames = (ids, max = 2) => {
    const n = ids.map((i) => P(i).short);
    if (n.length <= max + 1) return n.length > 1 ? n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1] : (n[0] || '');
    const rest = n.length - max;
    return n.slice(0, max).join(', ') + ' and ' + rest + ' other' + (rest > 1 ? 's' : '');
  };

  /* ------------------------------------------------------------------ state */
  const T0 = Date.now();
  const S = {
    route: 'chat',
    chatId: 'design-team',
    pop: null,            // light popovers: 'chatCall' | 'callsNew' | 'calEvent' | 'demo' | 'bell' | 'pill'
    modal: null,          // 'start' | 'schedule'
    modalData: null,
    incoming: null,
    calSelected: null,
    callsTab: 'upcoming',
    callsSelected: 'dr',
    inCall: false,
    meeting: null,
    prejoin: { mic: true, cam: true, blur: false, blocked: false },
    guestMode: false,
    guestName: 'Alex from Brightway',
    summary: null,
    ended: null,
    calling: null,
    drafts: {},
    history: JSON.parse(JSON.stringify(D.channelHistory)),
    unreadChats: { 'warehouse-ops': 0 },
    rating: 0,
    search: '',
    events: [
      { id: "e1", day: 0, start: 9.5, dur: 0.5, title: "Standup", people: ["marco", "sofia", "me"] },
      { id: "e2", day: 1, start: 11, dur: 1, title: "Q3 retro", people: ["sofia", "me"] },
      { id: "e3", day: 2, start: 9.5, dur: 0.5, title: "Standup", people: ["marco", "sofia", "me"] },
      { id: 'e4', day: 2, start: 14, dur: 0.5, title: 'Supplier sync', call: true, callId: 'ss', when: 'Wed, Nov 11 · 14:00 – 14:30', badge: 'Starts in 5 min', link: 'Table: Supplier prices', linkIcon: 'table-dark', people: ['marco', 'sofia', 'me'], chat: 'marco' },
      { id: 'e5', day: 2, start: 16.5, dur: 1, title: "Weekly warehouse planning", call: true, callId: 'wwp', when: "Wed, Nov 11 · 16:30 – 17:30", badge: 'Today', link: 'Doc: Dock schedule', linkIcon: 'task-dark', people: ["marco", "sofia", "me"], chat: "warehouse-ops" },
      { id: 'e6', day: 3, start: 10, dur: 1, title: "Q4 budget walkthrough", call: true, callId: 'q4', when: "Thu, Nov 12 · 10:00 – 11:00", badge: 'Tomorrow', link: 'Table: Q4 budget', linkIcon: 'table-dark', people: ["marco", "me"], chat: "finance-ops" },
      { id: "e7", day: 4, start: 15, dur: 0.5, title: "1:1 with Sofia", people: ["sofia"] },
    ],
    calls: [
      { id: 'dr', group: 'TODAY', time: 'Now', title: 'Design review: order status', sub: 'design-team', live: true, chat: 'design-team' },
      { id: 'ss', group: 'TODAY', time: '14:00 – 14:30', title: 'Supplier sync', sub: 'marco · 2 people', people: ['marco', 'sofia'], chat: 'marco', when: 'Today · marco', link: 'Table: Supplier prices', linkIcon: 'table-dark' },
      { id: 'wwp', group: 'TODAY', time: '16:30 – 17:30', title: 'Weekly warehouse planning', sub: 'warehouse-ops · 3 people', people: ['sofia', 'tom', 'lina'], chat: 'warehouse-ops', when: 'Today · warehouse-ops', link: 'Doc: Dock schedule', linkIcon: 'task-dark' },
      { id: 'q4', group: 'TOMORROW', time: '10:00 – 11:00', title: 'Q4 budget walkthrough', sub: 'finance-ops · 3 people', people: ['eli', 'sofia', 'marco'], chat: 'finance-ops', when: 'Tomorrow · finance-ops', link: 'Table: Q4 budget', linkIcon: 'table-dark' },
    ],
    callHistory: [
      { time: 'Yesterday · 16:02', title: 'Supplier sync', sub: 'marco · 18 min', people: ['marco', 'sofia'] },
      { time: 'Mon · 11:30', title: 'Warehouse floor map review', sub: 'warehouse-ops · 34 min', people: ['tom', 'eli', 'sofia'] },
      { time: 'Mon · 09:30', title: 'Standup', sub: 'design-team · 12 min', people: ['anna', 'marco', 'lina'] },
    ],
    recordings: [
      { time: 'Mon · 11:30', title: 'Warehouse floor map review', sub: '34:12 · saved to Dock schedule', people: ['tom', 'eli'] },
    ],
  };

  function newMeeting(o = {}) {
    const m = {
      id: o.id || 'dr',
      title: o.title || D.meeting.title,
      short: o.short || D.meeting.short,
      channel: o.channel === undefined ? D.meeting.channel : o.channel,
      startedAt: Date.now() - (o.elapsed || 0) * 1000,
      recording: o.recording !== undefined ? o.recording : false,
      recStart: Date.now() - (o.recElapsed || 0) * 1000,
      others: o.others || [],
      st: {},
      mic: true, cam: true, cc: false, hand: false, blur: false,
      layout: 'grid', pinned: null, page: 0,
      panel: null, pop: null,
      share: null,
      ringing: [], waiting: [],
      invitable: o.invitable || ['tom', 'lina', 'dana'],
      network: 'good', netBanner: false, poor: {},
      raised: {}, reactions: {},
      speaking: null,
      host: o.host !== undefined ? o.host : 'anna',
      locked: false,
      unread: o.unread || 0,
      messages: o.messages || [],
      linked: o.linked !== undefined ? o.linked : true,
      checklist: JSON.parse(JSON.stringify(D.meeting.task.checklist)),
      notes: D.meeting.notes,
      toasts: [],
      inviteClosed: false,
      rowMenu: null,
      participantsSeen: new Set(),
      reconnecting: false,
      follow: true,
      sharePaused: false,
      captionIdx: 0,
    };
    m.others.forEach((id) => { m.st[id] = defaultSt(id); m.participantsSeen.add(id); });
    return m;
  }
  function defaultSt(id) {
    const p = D.people[id];
    if (id === 'marco') return { mic: false, cam: false };
    return { mic: !['tom', 'eli'].includes(id), cam: !!(p && p.photo) };
  }

  // The live design review that Anna started in #design-team
  S.meeting = newMeeting({
    elapsed: 372 - 4, recording: true, recElapsed: 168 - 4, others: ['anna', 'marco', 'sofia'], unread: 2,
    messages: [...D.chatMessages.map((m) => ({ ...m, id: uid() })), { kind: "task", id: "task" }], host: 'anna',
  });

  const M = () => S.meeting;
  const C = () => (S.inCall ? S.meeting : null);

  /* --------------------------------------------------------------- helpers */
  function toast(text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    $('#toast-root').appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; }, 2600);
    setTimeout(() => el.remove(), 3000);
  }
  function stoast(t) {
    const c = M(); if (!c) return;
    t.id = uid();
    c.toasts.push(t);
    if (c.toasts.length > 3) c.toasts.shift();
    setTimeout(() => { c.toasts = c.toasts.filter((x) => x.id !== t.id); render(); }, t.ttl || 7000);
  }
  function copyLink(link = D.meeting.link) {
    try { navigator.clipboard && navigator.clipboard.writeText('https://' + link); } catch (e) { /* noop */ }
    if (S.inCall && S.route === 'call') stoast({ icon: 'link', title: 'Call link copied', single: true, ttl: 2500 });
    else toast('Link copied: ' + link);
  }
  const elapsed = (m) => (Date.now() - m.startedAt) / 1000;
  const inCallIds = (m) => [...m.others];
  const isHost = (m) => m.host === 'me';

  /* ================================================================ VIEWS */
  const V = {};

  /* ----------------------------------------------------------- Chats page */
  V.chat = () => {
    const id = S.chatId;
    const chat = D.chats.find((c) => c.id === id);
    const m = M();
    const live = m && m.channel === id && !S.inCall;
    const q = S.search.trim().toLowerCase();
    const items = D.chats.filter((c) => !q || (c.kind === 'dm' ? P(c.person).name : c.name).toLowerCase().includes(q)).map((c) => {
      const isLive = m && m.channel === c.id;
      const name = c.kind === 'dm' ? P(c.person).name : c.name;
      const avt = c.kind === 'dm' ? avatar(c.person, 'av44 av44--txt') : `<span class="av44" style="background:${c.color}">#</span>`;
      const hist = S.history[c.id] || [];
      const lastMsg = hist[hist.length - 1];
      const last = isLive ? (S.inCall ? 'You are in the call' : `${P(m.host === 'me' ? 'anna' : m.host).short} started a call`) : (lastMsg ? (lastMsg.from === 'me' ? 'You: ' : '') + (lastMsg.lines ? lastMsg.lines[lastMsg.lines.length - 1] : lastMsg.text) : c.last);
      const time = isLive ? '' : (lastMsg && lastMsg.time && lastMsg.time.length <= 5 && c.time !== 'Yesterday' && c.time !== 'Mon' ? lastMsg.time : c.time);
      const unread = S.unreadChats[c.id];
      return `<button class="citem ${c.id === id ? 'is-active' : ''}" data-a="openChat" data-id="${c.id}">
        ${avt}
        <span class="citem__text"><span class="citem__name">${esc(name)}</span><span class="citem__last">${esc(last)}</span></span>
        ${isLive ? '<span class="live-tag"><i></i>Live</span>' : `<span class="citem__time">${esc(time || '')}</span>`}
        ${unread ? `<span class="citem__unread">${unread}</span>` : ''}
      </button>`;
    }).join('');

    const isDM = chat.kind === 'dm';
    const headAv = isDM ? avatar(chat.person, 'av38') : `<span class="av38" style="background:${chat.color}">#</span>`;
    const headName = isDM ? P(chat.person).name : chat.name;
    const headSub = isDM ? `Online · ${P(chat.person).dept}` : `${chat.members} members`;
    const callDisabled = isDM && S.inCall;

    let banner = '';
    if (live) {
      banner = `<div class="callbanner"><i></i><div class="callbanner__text">
        <div class="callbanner__t">Call in progress · <span data-timer="meeting">${mmss(elapsed(m))}</span></div>
        <div class="callbanner__s">${esc(listNames(inCallIds(m)))} ${inCallIds(m).length === 1 ? 'is' : 'are'} in the call</div></div>
        <button class="btn-blue" data-a="goPrejoin">Join</button></div>`;
    } else if (S.inCall && m.channel === id) {
      banner = `<div class="callbanner"><i></i><div class="callbanner__text">
        <div class="callbanner__t">You're in this call · <span data-timer="meeting">${mmss(elapsed(m))}</span></div>
        <div class="callbanner__s">${esc(m.channel)}: ${esc(m.short)}</div></div>
        <button class="btn-blue btn-blue--14" data-a="returnToCall">Return</button></div>`;
    } else if (S.inCall && isDM && !m.others.includes(chat.person) && !m.ringing.includes(chat.person) && !(S.dismissedAdd || {})[chat.person]) {
      const p = P(chat.person);
      banner = `<div class="callbanner">${ic('video-blue')}<div class="callbanner__text">
        <div class="callbanner__t">You're in a call: ${esc(m.short)}</div>
        <div class="callbanner__s">Add ${esc(p.short)} to the call without leaving this chat</div></div>
        <button class="btn-light btn-light--14" data-a="dmNotNow" data-id="${p.id}">Not now</button>
        <button class="btn-blue btn-blue--14" data-a="dmAddToCall" data-id="${p.id}">Add to call</button></div>`;
    } else if (S.inCall && isDM && m.ringing.includes(chat.person)) {
      banner = `<div class="callbanner">${ic('video-blue')}<div class="callbanner__text">
        <div class="callbanner__t">Calling ${esc(P(chat.person).short)}…</div>
        <div class="callbanner__s">${esc(P(chat.person).short)} gets a call notification in Tandem</div></div></div>`;
    }

    const hist = S.history[id] || [];
    const msgs = hist.map((h) => {
      if (h.kind === 'call') {
        return `<div class="msg">${avatar(h.from, 'av36')}<div><div class="msg__head"><span class="msg__name">${esc(nameOf(h.from).replace(' (You)', ''))}</span><span class="msg__time">${h.time}</span></div>
          <div class="callcard">${ic(h.icon || 'video-dark')}<span>${esc(h.text)}</span></div></div></div>`;
      }
      const lines = (h.lines || [h.text]).map((l) => `<div class="msg__line">${esc(l)}</div>`).join('');
      const r = h.reaction ? `<button class="msg__react ${h.reacted ? 'is-mine' : ''}" data-a="react" data-id="${hist.indexOf(h)}">${ic('thumbs-blue')}${h.reaction}</button>` : '';
      const who = h.from === 'me' ? ME().name : P(h.from).name;
      return `<div class="msg">${avatar(h.from, 'av36')}<div><div class="msg__head"><span class="msg__name">${esc(who)}</span><span class="msg__time">${h.time}</span></div>${lines}${r}</div></div>`;
    }).join('');

    let pop = '';
    if (S.pop === 'chatCall') {
      const inThis = S.inCall;
      const liveHere = m && m.channel === id && !S.inCall;
      pop = `<div class="lpop" style="right:40px;top:86px;width:330px" data-keep>
        ${inThis ? `<div class="incall-note"><i></i><div style="flex:1"><b>You're in a call · <span data-timer="meeting">${mmss(elapsed(m))}</span></b><span>${esc(m.channel || 'Call')}: ${esc(m.short)}</span></div><button class="btn-blue" data-a="returnToCall">Return</button></div>` : ''}
        <button class="lpop__item" ${inThis ? 'disabled' : ''} data-a="${liveHere ? 'goPrejoin' : 'startChannelCall'}">
          <span class="lpop__ic">${ic('video-dark')}</span><span><div class="lpop__t">${liveHere ? 'Join the call' : 'Start a call'}</div><div class="lpop__s">${inThis ? 'Leave your current call first' : liveHere ? 'A call is already in progress here' : 'Members see a banner in the chat'}</div></span></button>
        <div class="lpop__div"></div>
        <button class="lpop__item" data-a="openSchedule"><span class="lpop__ic">${ic('calendar-dark')}</span><span><div class="lpop__t">Schedule a call</div><div class="lpop__s">Pick a time for this chat</div></span></button>
      </div>`;
    }

    return `<div class="page">
      <div class="chatlist"><h2>Chats</h2>${items || '<div class="empty-l">No chats found</div>'}</div>
      <div class="conv">
        <div class="conv__head">${headAv}<div><div class="conv__name">${esc(headName)}</div><div class="conv__sub">${esc(headSub)}</div></div>
          <button class="conv__call ${S.pop === 'chatCall' ? 'is-open' : ''}" ${callDisabled ? 'disabled title="You are already in a call"' : ''} data-a="${isDM ? 'callPerson' : 'toggleChatCall'}" data-id="${isDM ? chat.person : ''}" data-keep>${ic('video-dark')}</button>
        </div>
        ${banner}
        <div class="conv__body" id="convBody"><div class="daydiv"><span>Today</span></div>${msgs}</div>
        <div class="lcomposer"><input data-fk="chat-${id}" data-draft="chat-${id}" placeholder="Message ${esc(isDM ? P(chat.person).short : chat.name)}" value="${esc(S.drafts['chat-' + id] || '')}"><button class="send-btn" data-a="sendChat">${ic('send')}</button></div>
      </div>
      ${pop}
    </div>`;
  };

  /* ----------------------------------------------------------- Calls page */
  function callPeople(row) {
    if (row.live && M() && M().id === row.id) return S.inCall ? ['me', ...M().others] : [...M().others];
    return row.people || [];
  }
  V.calls = () => {
    const m = M();
    const rows = S.calls.filter((r) => !r.live || (m && m.id === r.id));
    let list = '';
    if (S.callsTab === 'upcoming') {
      let grp = '';
      rows.forEach((r) => {
        if (r.group !== grp) { grp = r.group; list += `<div class="cgroup">${grp}</div>`; }
        const ppl = callPeople(r);
        const sub = r.live ? `${r.sub} · ${ppl.length} ${ppl.length === 1 ? 'person' : 'people'}` : r.sub;
        const btn = r.live ? (S.inCall ? '<button class="btn-blue" data-a="returnToCall">Return</button>' : '<button class="btn-blue" data-a="goPrejoin">Join</button>') : `<button class="btn-light" data-a="selectCall" data-id="${r.id}">Details</button>`;
        list += `<div class="crow ${S.callsSelected === r.id ? 'is-selected' : ''}" data-a="selectCall" data-id="${r.id}">
          <span class="crow__time">${esc(r.time)}</span>
          <div class="crow__main"><div class="crow__title">${esc(r.title)}${r.live ? '<span class="livebadge"><i></i>Live</span>' : ''}</div><div class="crow__sub">${esc(sub)}</div></div>
          <div class="stack">${ppl.slice(0, 4).map((p) => avatar(p, 'av30')).join('')}</div>${btn}</div>`;
      });
      if (!rows.length) list = '<div class="empty-l">No upcoming calls</div>';
    } else {
      const src = S.callsTab === 'history' ? S.callHistory : S.recordings;
      list = '<div class="cgroup">' + (S.callsTab === 'history' ? 'RECENT' : 'SAVED RECORDINGS') + '</div>' + src.map((r) => `<div class="crow hist-row"><span class="crow__time">${esc(r.time)}</span>
        <div class="crow__main"><div class="crow__title">${esc(r.title)}</div><div class="crow__sub">${esc(r.sub)}</div></div>
        <div class="stack">${r.people.map((p) => avatar(p, 'av30')).join('')}</div><button class="btn-light" data-a="${S.callsTab === 'history' ? 'callAgain' : 'playRec'}" data-id="${esc(r.title)}">${S.callsTab === 'history' ? 'Call again' : 'Play'}</button></div>`).join('');
      if (!src.length) list = '<div class="empty-l">Nothing here yet</div>';
    }

    const sel = S.calls.find((r) => r.id === S.callsSelected && (!r.live || m)) || rows[0];
    let details = '';
    if (sel) {
      const ppl = callPeople(sel);
      const isLive = sel.live;
      details = `<div class="cdetails"><div class="cdetails__body">
        ${isLive ? '<span class="badge-g">Live now</span>' : `<span class="badge-n">${esc(sel.time)}</span>`}
        <h3>${esc(sel.title)}</h3>
        <div class="cdetails__sub">${esc(sel.when || 'Today · ' + (sel.sub || '').split(' · ')[0])}</div>
        <div class="llabel">LINKED TO</div>
        <span class="lchip">${ic(sel.linkIcon || 'task-dark')}${esc(sel.link || (m && m.linked ? 'Task: Order status redesign' : 'Nothing linked'))}</span>
        <div class="llabel">CALL LINK</div>
        <div class="linkbox"><span class="linkbox__url">${esc(sel.linkUrl || D.meeting.link)}</span><button class="btn-light" data-a="copyLink" data-link="${esc(sel.linkUrl || D.meeting.link)}">Copy</button></div>
        <div class="llabel">${isLive ? 'IN THE CALL' : 'INVITED'} · ${ppl.length}</div>
        ${ppl.map((p) => `<div class="prow-l">${avatar(p, 'av36r')}${esc(nameOf(p))}</div>`).join('')}
        </div><div class="cdetails__foot">${isLive ? (S.inCall ? '<button class="btn-blue btn-blue--44" data-a="returnToCall">Return to call</button>' : '<button class="btn-blue btn-blue--44" data-a="goPrejoin">Join call</button>') : `<button class="btn-blue btn-blue--44" data-a="joinScheduled" data-id="${sel.id}" ${S.inCall ? 'disabled' : ''}>Join call</button>`}
        <button class="btn-light btn-light--44" data-a="copyLink" data-link="${esc(sel.linkUrl || D.meeting.link)}">Copy link</button></div>
      </div>`;
    }

    const pop = S.pop === 'callsNew' ? `<div class="lpop callsnew-pop" data-keep>
      <button class="lpop__item" data-a="openStart" ${S.inCall ? 'disabled' : ''}><span class="lpop__ic">${ic('video-dark')}</span><span><div class="lpop__t">Start a call</div><div class="lpop__s">${S.inCall ? 'Leave your current call first' : 'Call people or open an empty room'}</div></span></button>
      <div class="lpop__div"></div>
      <button class="lpop__item" data-a="openSchedule"><span class="lpop__ic">${ic('calendar-dark')}</span><span><div class="lpop__t">Schedule a call</div><div class="lpop__s">Pick a time and invite people</div></span></button></div>` : '';

    const upCount = rows.length;
    return `<div class="page">
      <div class="ptitle">Calls</div>
      <button class="btn-blue btn-blue--44 calls-new" data-a="toggleCallsNew" data-keep>New call</button>
      <div class="tabs">
        <button class="tab ${S.callsTab === 'upcoming' ? 'is-active' : ''}" data-a="callsTab" data-id="upcoming">Upcoming <span class="count">${upCount}</span></button>
        <button class="tab ${S.callsTab === 'history' ? 'is-active' : ''}" data-a="callsTab" data-id="history">History</button>
        <button class="tab ${S.callsTab === 'recordings' ? 'is-active' : ''}" data-a="callsTab" data-id="recordings">Recordings</button>
      </div>
      <div class="calllist">${list}</div>
      ${details}
      ${pop}
    </div>`;
  };

  /* -------------------------------------------------------- Calendar page */
  const HOUR0 = 9, HPX = 88, TOP0 = 34; // 9:00 line sits 34px below the day labels
  const fmtH = (h) => Math.floor(h) + ":" + pad(Math.round((h % 1) * 60));
  V.calendar = () => {
    const days = ['Mon 9', 'Tue 10', 'Wed 11', 'Thu 12', 'Fri 13'];
    let hours = '';
    for (let h = 9; h <= 17; h++) {
      const y = TOP0 + (h - HOUR0) * HPX;
      hours += `<div class="cal-hour" style="top:${y}px"></div><div class="cal-hlabel" style="top:${y - 8}px">${h}:00</div>`;
    }
    const cols = days.map((d, i) => {
      const evs = S.events.filter((e) => e.day === i).map((e) => {
        const top = TOP0 + (e.start - HOUR0) * HPX + 2;
        const h = Math.max(40, e.dur * HPX - 4);
        const range = fmtH(e.start) + " – " + fmtH(e.start + e.dur);
        const ppl = (e.people || []).slice(0, 3);
        const liveNow = e.callId && M() && M().id === e.callId;
        return `<button class="cal-ev ${e.call ? 'cal-ev--call' : ''} ${S.calSelected === e.id ? 'is-selected' : ''} ${e.isNew ? 'cal-ev--new' : ''}" style="top:${top}px;height:${h}px" data-a="calEvent" data-id="${e.id}" data-keep>
          <div class="cal-ev__t">${e.call ? ic('video-blue-13') : ''}${esc(e.title)}${liveNow ? ' · Live' : ''}</div><div class="cal-ev__s">${range}</div>${ppl.length ? `<span class="cal-ev__ppl ${h > 60 ? "is-bottom" : ""}">${ppl.map((p) => avatar(p, "av20b")).join("")}</span>` : ""}</button>`;
      }).join('');
      return `<div class="cal-col">${evs}</div>`;
    }).join('');

    let pop = '';
    const ev = S.events.find((e) => e.id === S.calSelected);
    if (S.pop === 'calEvent' && ev) {
      const col = 100 + ev.day * ((1308 - 132) / 5);
      let left = 100 + (ev.day + 1) * ((document.body.clientWidth - 132 - 132) / 5) - 4;
      const pageW = ($('#view') || { clientWidth: 1308 }).clientWidth;
      const colW = (pageW - 132) / 5;
      left = 100 + (ev.day + 1) * colW + 5;
      if (left + 360 > pageW - 20) left = 100 + ev.day * colW - 360 + 8;
      let top = 96 + TOP0 + (ev.start - HOUR0) * HPX - 220;
      top = Math.max(110, Math.min(top, 920 - 280));
      void col;
      pop = `<div class="lpop evpop" style="left:${left}px;top:${top}px" data-keep>
        <h4>${esc(ev.title)}</h4><button class="evpop__close" data-a="closePop">${ic('x-dark-14')}</button>
        <div class="evpop__when">${esc(ev.when || days[ev.day])}</div>
        <div class="evpop__tags">${ev.badge ? `<span class="badge-g">${esc(ev.badge)}</span>` : ''}${ev.link ? `<span class="lchip">${ic(ev.linkIcon || 'table-dark')}${esc(ev.link)}</span>` : ''}</div>
        ${ev.people ? `<div class="evpop__people"><div class="stack stack--27">${ev.people.map((p) => avatar(p, 'av30')).join('')}</div>${ev.people.length} invited</div>` : ''}
        <div class="evpop__btns">${ev.call ? `<button class="btn-blue" data-a="joinScheduled" data-id="${ev.callId}" ${S.inCall && !(M() && M().id === ev.callId) ? 'disabled' : ''}>${ic('video-16')}Join</button>` : ''}
          <button class="btn-light" data-a="openChat" data-id="${ev.chat || 'design-team'}">Open chat</button></div>
      </div>`;
    }

    return `<div class="page">
      <div class="ptitle">Calendar</div><div class="cal-range">Nov 9 – 13</div>
      <button class="btn-blue btn-blue--44 cal-sched" data-a="openSchedule">Schedule</button>
      <div class="cal-grid"><div class="cal-days">${days.map((d, i) => `<div class="${i === 2 ? 'is-today' : ''}">${d}</div>`).join('')}</div>
        ${hours}<div class="cal-cols" style="top:0">${cols}</div></div>
      ${pop}
    </div>`;
  };

  /* ----------------------------------------------------------- Tasks page */
  V.tasks = () => {
    const m = M();
    const live = m && m.linked;
    const card = (t, s, extra = '') => `<button class="kcard" data-a="taskCard" data-id="${esc(t)}"><b>${esc(t)}</b><span>${esc(s)}</span>${extra}</button>`;
    return `<div class="page"><div class="ptitle">Tasks</div>
      <div class="kanban">
        <div class="kcol"><h3>To do</h3>${card('Update dock labels', 'Due Nov 9')}${card('Check supplier lead times', 'Due Nov 10')}</div>
        <div class="kcol"><h3>In progress</h3>${card('Order status redesign', 'Due Nov 12', live ? '<span class="incall"><i></i>In a call</span>' : '')}${card('Invoice batch export', 'Due Nov 11')}</div>
        <div class="kcol"><h3>Done</h3>${card('Warehouse floor map', 'Done Nov 2')}</div>
      </div></div>`;
  };

  const placeholder = (title, text) => () => `<div class="page"><div class="ptitle">${title}</div><div class="ph"><div><h2>${title}</h2>${text}</div></div></div>`;
  V.home = placeholder('Home', 'Your workspace overview lives here. Calls, chats and tasks are one click away in the left menu.');
  V.tables = placeholder('Tables', 'Supplier prices, Q4 budget and 12 more tables.');
  V.wiki = placeholder('Knowledge base', 'Guides and processes for Northwind Logistics.');
  V.docs = placeholder('Documents', 'Dock schedule, contracts and shared files.');
  V.settings = placeholder('Settings', 'Workspace and notification preferences.');

  /* ------------------------------------------------------------- Pre-join */
  function previewBox(pj, opts = {}) {
    const camOn = pj.cam && !pj.blocked;
    const body = pj.blocked
      ? `<div class="preview__blocked">${ic('video-off-34')}<h4>Tandem cannot use your camera</h4><p>Allow camera access in your browser settings, then refresh the page.</p><button class="pill-btn pill-btn--ghost" data-a="howAllow">How to allow access</button></div>`
      : camOn ? `<img class="photo" src="assets/img/nina.png" alt=""><span class="namechip">${esc(opts.name || 'Nina Park (You)')}</span>`
        : `<div class="preview__off"><span class="bigav"><img src="assets/img/nina.png" alt=""></span></div><span class="namechip">${esc(opts.name || 'Nina Park (You)')}</span>`;
    return `<div class="preview ${pj.blur && camOn ? 'is-bg-blur' : ''}">${body}
      <div class="preview__ctrls">
        <button class="${pj.mic ? '' : 'is-off'}" data-a="pjMic" title="${pj.mic ? 'Mute' : 'Unmute'}">${ic(pj.mic ? 'mic' : 'mic-off-18')}</button>
        <button class="${camOn ? '' : 'is-off'}" data-a="pjCam" title="Camera">${ic(camOn ? 'video' : (pj.blocked ? 'video-off-18' : 'video-off-18-white'))}</button>
        ${opts.noBlur ? '' : `<button class="${pj.blur ? 'is-on' : ''}" data-a="pjBlur" title="Blur background">${ic('stars')}</button>`}
      </div></div>`;
  }
  function levelBars() {
    const hs = [8, 14, 22, 16, 26, 20, 12, 18, 10, 8, 6, 5];
    return hs.map((h, i) => `<i style="height:${h}px" class="${i < 7 ? 'on' : ''}"></i>`).join('');
  }
  V.prejoin = () => {
    const m = M();
    const pj = S.prejoin;
    const ppl = m ? inCallIds(m) : [];
    return `<div class="page prejoin">
      ${previewBox(pj)}
      <div class="joinside">
        <div class="joinside__pre">Ready to join?</div>
        <h2>${esc(m ? m.title : D.meeting.title)}</h2>
        <div class="joinside__who"><div class="stack stack--27">${ppl.slice(0, 4).map((p) => avatar(p, 'av30')).join('')}</div>${ppl.length ? esc(listNames(ppl)) + (ppl.length === 1 ? ' is' : ' are') + ' in the call' : 'Nobody is here yet'}</div>
        <label class="flabel">Microphone</label>
        <div class="field"><select data-a-change="device">${['MacBook Pro Microphone', 'AirPods Pro', 'External USB Mic'].map((d) => `<option>${d}</option>`).join('')}</select>${ic('chevron-dark')}</div>
        <div class="levels"><label class="flabel">Input level</label><div class="levels__bars" id="levels">${levelBars()}</div></div>
        <div class="grid2">
          <div><label class="flabel">Speaker</label><div class="field"><select>${['MacBook Pro Speakers', 'AirPods Pro'].map((d) => `<option>${d}</option>`).join('')}</select>${ic('chevron-dark')}</div></div>
          <div><label class="flabel">Camera</label><div class="field"><select>${['FaceTime HD Camera', 'Studio Display Camera'].map((d) => `<option>${d}</option>`).join('')}</select>${ic('chevron-dark')}</div></div>
        </div>
        <button class="btn-join" data-a="joinNow">Join now</button>
      </div></div>`;
  };

  V.waiting = () => {
    const m = M();
    const ppl = inCallIds(m);
    return `<div class="page prejoin">
      ${previewBox(S.prejoin, { name: (S.guestMode ? S.guestName : 'Nina Park') + ' (You)' })}
      <div class="waitside">
        ${ic('loading-blue')}
        <h2>Waiting for the host to let you in</h2>
        <p>${esc(P(m.host === 'me' ? 'anna' : m.host).name)} will see your request. You will join as soon as ${m.host === 'marco' ? 'he' : 'she'} admits you.</p>
        <div class="joinside__who"><div class="stack stack--27">${ppl.slice(0, 4).map((p) => avatar(p, 'av30')).join('')}</div>${ppl.length} people are in the call</div>
        <button class="btn-light btn-light--44" data-a="leaveWaiting">Leave waiting room</button>
      </div></div>`;
  };

  V.guestLink = () => `<div class="guestjoin">
      <div class="guestjoin__logo">${ic('compass')}</div>
      <div class="joincard">
        ${previewBox(S.prejoin, { name: (S.guestName || 'Guest') + ' (You)', noBlur: true })}
        <div class="joincard__side">
          <div class="joinside__pre">You are invited to</div>
          <h2>${esc(D.meeting.title)}</h2>
          <div class="joincard__host">Hosted by Anna Kovalenko · Northwind Logistics</div>
          <label class="flabel">Your name</label>
          <div class="field"><input data-fk="guestname" data-draft="guestName" value="${esc(S.guestName)}" placeholder="Enter your name"></div>
          <button class="btn-join" data-a="askToJoin" ${S.guestName.trim() ? '' : 'disabled'}>Ask to join</button>
          <div class="joincard__note">Guests only see the call. Company chats, files and tasks stay private. You will wait until the host admits you.</div>
        </div>
      </div></div><button class="guest-exit" data-a="exitGuest">Exit guest preview · back to Nina's workspace</button>`;

  /* ============================================================ CALL STAGE */
  const stageBg = () => `<div class="stage__blob stage__blob--a"><img src="assets/img/stage-vector1.svg" alt=""></div><div class="stage__blob stage__blob--b"><img src="assets/img/stage-vector2.svg" alt=""></div>`;

  function stHeader(c) {
    const chips = [];
    if (c.linked && !S.guestMode) chips.push(`<button class="chip" data-a="panel" data-id="details">${ic('task-white', 'ic16')}${esc(D.meeting.task.title)}</button>`);
    if (c.recording) chips.push(`<span class="chip chip--rec"><i class="dot"></i>Recording · <span data-timer="rec">${mmss((Date.now() - c.recStart) / 1000)}</span></span>`);
    if (c.network === 'poor') chips.push(`<span class="chip chip--warn">${ic('wifi-orange')}Unstable connection</span>`);
    return `<div class="stage__head">
      <div class="stage__title">${esc(c.title)}</div>
      <div class="stage__chips">${chips.join('')}</div>
      <div class="stage__head-right">
        <div class="vswitch"><button class="${c.layout === 'grid' ? 'is-active' : ''}" data-a="layout" data-id="grid" title="Grid">${ic('grid', 'ic16')}</button><button class="${c.layout === 'speaker' ? 'is-active' : ''}" data-a="layout" data-id="speaker" title="Speaker view">${ic('monitor', 'ic16')}</button></div>
        <button class="round-btn36 ${S.expanded ? "is-on" : ""}" data-a="fullscreen" title="${S.expanded ? "Exit full screen (Esc)" : "Full screen"}">${ic("expand", "ic16")}</button>
      </div></div>`;
  }

  function tile(c, pid, o = {}) {
    const me = pid === 'me';
    const p = P(pid);
    const st = me ? { mic: c.mic && !c.reconnecting, cam: c.cam && !c.reconnecting } : (c.st[pid] || { mic: true, cam: false });
    const video = st.cam && p.photo;
    const speaking = c.speaking === pid && st.mic;
    const badges = [];
    if (c.raised[pid]) badges.push(`<span class="tile__badge tile__badge--hand" title="Hand raised">${ic('hand-15')}</span>`);
    if (me && c.network === 'poor') badges.push(`<span class="tile__badge tile__badge--weak" title="Weak connection">${ic('wifi-14-white')}</span>`);
    if (o.pinned) badges.push(`<button class="tile__badge tile__badge--pin" data-a="unpin" title="Unpin">${ic('pin')}</button>`);
    const re = c.reactions[pid];
    const avStyle = `background:${p.color}`;
    const inner = video
      ? `<img class="tile__photo" src="${p.photo}" alt=""${me && c.blur ? ' style="filter:blur(0)"' : ''}>`
      : `<span class="tile__avatar" style="${avStyle}">${p.photo ? `<img src="${p.photo}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : p.initials}</span>`;
    const tools = (!o.noTools && !me) ? `<div class="tile__tools">${badges.length ? '' : `<button class="tile__tool" data-a="pin" data-id="${pid}" title="Pin">${ic('pin')}</button>`}</div>` : '';
    return `<div class="tile ${video ? '' : 'tile--noav'} ${speaking ? 'is-speaking' : ''} ${st.mic ? '' : 'is-muted'} ${o.cls || ''}" data-pid="${pid}" ${o.style ? `style="${o.style}"` : ''}>
      ${inner}
      ${c.poor[pid] ? `<div class="tile__poor">${ic('loading')}Poor connection</div>` : ''}
      ${o.dim ? '<div class="tile__dim"></div>' : ''}
      ${re ? `<span class="tile__reaction">${ic(re.icon)}${esc(re.text)}</span>` : ''}
      ${badges.length ? `<div class="tile__badges">${badges.join('')}</div>` : ''}
      ${tools}
      <span class="namechip"><span class="namechip__mic">${st.mic ? `${ic('mic-blue', 'when-idle')}${ic('mic-blue', 'when-speaking')}` : ic('mic-off', 'when-idle')}</span>${esc(nameOf(pid))}</span>
      <i class="tile__ring"></i>
    </div>`;
  }
  const moreTile = (n) => `<div class="tile tile--noav tile__more">+${n}</div>`;

  function stBody(c) {
    const everyone = [...c.others, 'me'];
    let main = '';
    if (c.share) {
      const presenter = c.share.by;
      const side = [presenter !== 'me' ? presenter : null, ...c.others.filter((x) => x !== presenter), 'me'].filter(Boolean);
      const shown = side.length > 4 ? side.slice(0, 3) : side;
      const sideHtml = shown.map((id) => tile(c, id, { noTools: true })).join('') + (side.length > 4 ? moreTile(side.length - 3) : '');
      main = `<div class="sharelay tiles--sm"><div class="sharelay__content">${shareContent(c)}</div><div class="sharelay__side">${sideHtml}</div></div>`;
    } else if (c.layout === 'speaker' && c.others.length) {
      const big = c.pinned && everyone.includes(c.pinned) ? c.pinned : (c.speaking && c.speaking !== 'me' ? c.speaking : c.others[0]);
      const rest = everyone.filter((x) => x !== big);
      const strip = rest.length > 4 ? rest.slice(0, 3).map((id) => tile(c, id)).join('') + moreTile(rest.length - 3) : rest.map((id) => tile(c, id)).join('');
      main = `<div class="speaker"><div class="speaker__main">${tile(c, big, { pinned: c.pinned === big })}</div><div class="speaker__strip tiles--sm">${strip}</div></div>`;
    } else {
      const per = 12;
      let ids = everyone;
      let pager = '';
      if (everyone.length > per) {
        const pages = Math.ceil(c.others.length / (per - 1));
        c.page = Math.min(c.page, pages - 1);
        ids = [...c.others.slice(c.page * (per - 1), (c.page + 1) * (per - 1)), 'me'];
        pager = `<button class="pager-btn pager-btn--prev" data-a="page" data-id="-1" ${c.page === 0 ? 'disabled' : ''}>${ic('chevron-left')}</button>
          <button class="pager-btn pager-btn--next" data-a="page" data-id="1" ${c.page >= pages - 1 ? 'disabled' : ''}>${ic('chevron-right')}</button>
          <span class="page-ind">Page ${c.page + 1} of ${pages}</span>`;
      }
      const alone = c.others.length === 0;
      const n = ids.length;
      main = `<div class="grid ${n > 4 ? 'tiles--sm' : ''}" data-n="${n}">${ids.map((id) => tile(c, id, { dim: alone && !c.inviteClosed })).join('')}</div>${pager}`;
      if (alone && !c.inviteClosed) main += inviteCard(c);
    }
    return `<div class="stage__body"><div class="stage__main">${main}</div>${c.panel ? panel(c) : ''}</div>`;
  }

  function inviteCard(c) {
    const cands = ['anna', 'sofia', 'tom', 'lina', 'dana', 'marco'].filter((id) => !c.others.includes(id)).slice(0, 3);
    const rows = cands.map((id) => {
      const p = P(id);
      const ringing = c.ringing.includes(id);
      return `<div class="invite__row">${avatar(id, 'av34')}<div class="prow__text"><span class="prow__name">${esc(p.name)}</span><span class="prow__meta">${esc(p.dept)} · ${ringing ? 'calling' : 'online'}</span></div>
        ${ringing ? `<span class="prow__aside">Ringing…</span><button class="pill-btn pill-btn--ghost" data-a="cancelRing" data-id="${id}">Cancel</button>` : `<button class="pill-btn" data-a="addPerson" data-id="${id}">Add</button>`}</div>`;
    }).join('');
    return `<div class="invite">
      <button class="panel__close" data-a="closeInvite">${ic('x-close', 'ic16')}</button>
      <div class="invite__icon">${ic('user-plus')}</div>
      <h3>You're the only one here</h3>
      <p>Add people from ${c.channel ? '#' + esc(c.channel) : 'your workspace'} or share a link.</p>
      <div class="invite__list">${rows}</div>
      <button class="wide-btn" data-a="copyLink">${ic('link', 'ic16')}Copy invite link</button>
    </div>`;
  }

  function shareContent(c) {
    const s = c.share;
    if (s.type === 'screen' && s.by === 'me') {
      return `<div class="own-share ${c.sharePaused ? 'is-paused' : ''}">
        <div class="sharing-banner">${ic('airplay-16')}${c.sharePaused ? 'Sharing is paused' : 'Everyone can see your screen'}<button class="pill-btn pill-btn--red" data-a="stopShare">Stop sharing</button></div>
        <div class="own-share__preview">
          <i style="left:0;top:0;width:420px;height:20px;background:#e6e8ee"></i><i style="left:0;top:20px;width:110px;height:216px;background:#fff"></i>
          <i style="left:130px;top:40px;width:90px;height:12px;border-radius:5px;background:#111827"></i>
          <i style="left:130px;top:68px;width:80px;height:50px;border-radius:8px;background:#dce0ff"></i><i style="left:222px;top:68px;width:80px;height:50px;border-radius:8px;background:#ffe2c7"></i><i style="left:314px;top:68px;width:80px;height:50px;border-radius:8px;background:#cfefe0"></i>
          <i style="left:130px;top:132px;width:270px;height:80px;border-radius:8px;background:#fff"></i>
        </div>
        <div class="own-share__title">${c.sharePaused ? 'Sharing is paused' : 'You\'re sharing your screen'}</div>
        <div class="own-share__sub">${esc(s.label || 'Order status · Chrome window')}</div>
        <div class="own-share__btns">
          <button class="pill-btn pill-btn--ghost" data-a="pauseShare">${c.sharePaused ? 'Resume' : 'Pause'}</button>
          <button class="pill-btn pill-btn--ghost" data-a="changeWindow">Change window</button>
          <button class="pill-btn pill-btn--red" data-a="stopShare">Stop sharing</button>
        </div></div>`;
    }
    if (s.type === 'screen') {
      return `<div class="mock-screen">
        <div class="mock-screen__bar"><i style="left:14px"></i><i style="left:32px"></i><i style="left:50px"></i><span class="mock-screen__url"></span></div>
        <div class="mock-screen__side"><i style="top:20px;width:100px;height:12px;background:#111827"></i><i style="top:46px;width:140px"></i><i style="top:70px;width:100px"></i><i style="top:94px;width:120px"></i><i style="top:118px;width:80px"></i></div>
        <h4>Order status</h4>
        <div class="mock-card" style="left:232px"><i style="top:19px;width:34px;height:34px;border-radius:9px;background:#dce0ff"></i><i style="top:63px;width:120px;height:12px;background:#c7cbd8"></i><i style="top:85px;width:80px;height:22px;background:#111827"></i></div>
        <div class="mock-card" style="left:468px"><i style="top:19px;width:34px;height:34px;border-radius:9px;background:#ffe2c7"></i><i style="top:63px;width:120px;height:12px;background:#c7cbd8"></i><i style="top:85px;width:64px;height:22px;background:#111827"></i></div>
        <div class="mock-card" style="left:704px"><i style="top:19px;width:34px;height:34px;border-radius:9px;background:#cfefe0"></i><i style="top:63px;width:120px;height:12px;background:#c7cbd8"></i><i style="top:85px;width:92px;height:22px;background:#111827"></i></div>
        <div class="mock-list">${[480, 420, 450, 370, 400, 330, 440].map((w, i) => `<i style="top:${22 + i * 34}px;width:${w}px"></i>`).join('')}</div>
        <span class="share-chip">${ic('airplay-16')}${esc(P(s.by).name)} is presenting</span>
      </div>`;
    }
    // workspace object
    const by = s.by === 'me' ? 'You are' : esc(P(s.by).name) + ' is';
    const chip = `<span class="share-chip">${ic('airplay-16')}${by} presenting ${esc(s.label)}</span>`;
    const follow = s.by !== 'me' ? (c.follow
      ? `<span class="follow-chip">Following ${esc(P(s.by).short)}<button data-a="toggleFollow">Stop following</button></span>`
      : `<span class="follow-chip">Browsing on your own<button data-a="toggleFollow">Follow ${esc(P(s.by).short)}</button></span>`)
      : `<span class="follow-chip">Everyone follows you<button data-a="stopShare">Stop presenting</button></span>`;
    let body = '';
    if (s.obj === 'table') {
      body = `<div class="obj__head">${ic('table-20')}<span class="obj__title">Supplier prices</span><span class="obj__meta">Tables · 42 rows</span></div>
        <table class="otable"><colgroup><col class="c1"><col class="c2"><col class="c3"><col class="c4"><col></colgroup>
        <thead><tr><th>SUPPLIER</th><th>SKU</th><th>UNIT PRICE</th><th>LEAD TIME</th><th>STATUS</th></tr></thead><tbody>
        ${D.suppliers.map((r, i) => `<tr><td class="name">${esc(r.name)}</td><td class="muted">${esc(r.sku)}</td>
          <td class="editable" data-a="editCell" data-id="${i}"><span class="cellv ${r.cursor && c.follow && s.by !== 'me' ? 'is-cursor' : ''} ${S.editCell === i ? 'is-me' : ''}">${S.editCell === i ? `<input data-fk="cell" data-a-enter="saveCell" data-id="${i}" value="${esc(r.price)}">` : esc(r.price)}${r.cursor && s.by !== 'me' ? `<span class="cursor-flag">${esc(r.cursor)}</span>` : ''}</span></td>
          <td>${esc(r.lead)}</td><td><span class="status status--${r.status.toLowerCase()}">${r.status}</span></td></tr>`).join('')}
        </tbody></table>`;
    } else if (s.obj === 'task') {
      body = `<div class="obj__head">${ic('task-dark-18')}<span class="obj__title">${esc(D.meeting.task.title)}</span><span class="obj__meta">Task · ${esc(D.meeting.task.status)}</span></div>
        <div class="odoc"><h2>${esc(D.meeting.task.title)}</h2><p>${esc(c.notes)}</p>
        ${c.checklist.map((x, i) => `<button class="ocheck ${x.done ? 'is-done' : ''}" data-a="check" data-id="${i}" style="width:100%"><i>${x.done ? ic('check', 'ic') : ''}</i><span>${esc(x.text)}</span></button>`).join('')}</div>`;
    } else {
      body = `<div class="obj__head">${ic('task-dark-18')}<span class="obj__title">Dock schedule</span><span class="obj__meta">Doc · Warehouse</span></div>
        <div class="odoc"><h2>Dock schedule · Week 46</h2><p>Dock 1 – Northline Pallets, Mon & Wed 08:00–10:00.</p><p>Dock 2 – Harbor Packaging, daily 11:00–12:30.</p><p>Dock 4 – free after 14:00 on Wednesday. Kestrel Freight requested a slot on Thursday.</p><p>Brightway Foils lead time is 9 days, plan the next delivery for Nov 20.</p></div>`;
    }
    return `<div class="obj">${body}</div>${chip}${follow}`;
  }

  function micIc(on, size16) { return on ? ic(size16 ? 'mic-blue' : 'mic-blue', 'mini-ic16') : ic('mic-off', 'mini-ic16'); }
  function camIc(on) { return on ? ic('video-16', 'mini-ic16') : ic('video-off-16', 'mini-ic16'); }

  function panel(c) {
    const close = `<button class="panel__close" data-a="panel" data-id="${c.panel}">${ic('x-close', 'ic16')}</button>`;
    if (c.panel === 'people') return peoplePanel(c, close);
    if (c.panel === 'chat') {
      const msgs = c.messages.map((m) => {
        if (m.kind === 'task') return `<div class="taskcard">${ic('task-18')}<div class="prow__text"><span class="prow__name" style="font-size:13px">${esc(D.meeting.task.title)}</span><span class="prow__meta">Task · ${esc(D.meeting.task.status)}</span></div><button class="pill-btn pill-btn--ghost" style="min-width:0" data-a="panel" data-id="details">Open</button></div>`;
        const mine = m.from === 'me';
        return `<div class="cmsg ${mine ? 'cmsg--me' : ''}"><div class="cmsg__meta">${mine ? 'You' : esc(P(m.from).name)} · ${m.time}</div><div class="cmsg__bubble">${esc(m.text)}</div></div>`;
      }).join('');
      return `<aside class="panel"><div class="panel__head"><span class="panel__title">Chat</span>${close}</div>
        <div class="panel__sub2">${c.channel ? `Messages stay in #${esc(c.channel)}` : 'Messages are visible to everyone in the call'}</div>
        <div class="panel__scroll" id="chatScroll"><div class="cmsgs">${msgs}</div></div>
        <div class="composer"><input data-fk="callchat" data-draft="callchat" placeholder="Message everyone" value="${esc(S.drafts.callchat || '')}"><button class="send-btn" data-a="sendCallChat">${ic('send')}</button></div></aside>`;
    }
    // details
    const t = D.meeting.task;
    const taskBlock = c.linked ? `<div class="dtask">
        <div class="dtask__title">${ic('task-18')}${esc(t.title)}</div>
        <div class="dtags"><span class="dtag dtag--blue">${esc(t.status)}</span><span class="dtag">${esc(t.due)}</span><span class="dtag dtag--av"><img src="${P(t.assignee).photo}" alt="">${esc(P(t.assignee).short)}</span></div>
        <div class="dchecks">${c.checklist.map((x, i) => `<button class="dcheck ${x.done ? 'is-done' : ''}" data-a="check" data-id="${i}"><i>${ic('check')}</i><span>${esc(x.text)}</span></button>`).join('')}</div>
        <div class="dbtns"><button class="pill-btn" data-a="openTask">Open task</button><button class="pill-btn pill-btn--ghost" data-a="unlink">Unlink</button></div></div>`
      : `<div class="dempty">No task linked to this call<button class="pill-btn" data-a="relink">Link task</button></div>`;
    return `<aside class="panel"><div class="panel__head"><span class="panel__title">Details</span>${close}</div>
      <div class="panel__scroll"><div class="dsec">
        <div class="panel__label">LINKED TASK</div>${taskBlock}
        <div class="panel__label" style="margin-top:10px">CALL LINK</div>
        <div class="dlink">${esc(D.meeting.link)}<button class="pill-btn pill-btn--ghost" data-a="copyLink">Copy</button></div>
        <div class="panel__label" style="margin-top:14px">SHARED NOTES</div>
        <textarea class="dnotes" data-fk="notes" data-draft="notes">${esc(c.notes)}</textarea>
        <div class="dhint" id="notesHint">${c.linked ? 'Notes are saved to the task automatically.' : 'Link a task to keep these notes after the call.'}</div>
      </div></div></aside>`;
  }

  function personRow(c, id, host) {
    const p = P(id);
    const me = id === 'me';
    const st = me ? { mic: c.mic, cam: c.cam } : c.st[id];
    const roles = [];
    if (c.host === id) roles.push('Host');
    if (c.cohosts && c.cohosts[id]) roles.push('Co-host');
    if (p.guest && !me) roles.push('Guest');
    if (!st.cam && !roles.length && !me) roles.push('Camera off');
    if (c.raised[id]) roles.push('Hand raised');
    const meta = roles.join(' · ');
    const menuBtn = host && !me ? `<button class="rowmenu-btn ${c.rowMenu === id ? 'is-open' : ''}" data-a="rowMenu" data-id="${id}" data-keep>${ic('smile-14')}</button>` : '';
    return `<div class="prow ${host ? 'prow--h50' : ''}" data-row="${id}">${avatar(id, 'av34')}
      <div class="prow__text"><span class="prow__name">${esc(nameOf(id))}</span>${meta ? `<span class="prow__meta">${esc(meta)}</span>` : ''}</div>
      <div class="prow__icons">${micIc(st.mic)}${camIc(st.cam)}</div>${menuBtn}</div>`;
  }

  function inviteRows(c) {
    const cand = c.invitable.filter((id) => !c.others.includes(id));
    if (!cand.length) return '';
    return `<div class="panel__divider"></div><div class="panel__label">${c.channel ? `FROM #${esc(c.channel).toUpperCase()}, NOT IN THE CALL` : 'SUGGESTED'}</div>` + cand.map((id) => {
      const p = P(id);
      const ringing = c.ringing.includes(id);
      return `<div class="prow prow--tall">${avatar(id, 'av34')}<div class="prow__text"><span class="prow__name">${esc(p.name)}</span><span class="prow__meta">${esc(p.dept)} · ${ringing ? 'calling' : 'online'}</span></div>
        ${ringing ? `<span class="prow__aside">Ringing…</span><button class="pill-btn pill-btn--ghost" data-a="cancelRing" data-id="${id}">Cancel</button>` : `<button class="pill-btn" data-a="addPerson" data-id="${id}">Add</button>`}</div>`;
    }).join('') + '<div class="panel__hint">Added people get a call notification in Tandem.</div>';
  }

  function peoplePanel(c, close) {
    const host = isHost(c) && !S.guestMode;
    const ids = ['me', ...c.others];
    const ordered = host ? ids : [...c.others.filter((x) => x === c.host), ...c.others.filter((x) => x !== c.host), 'me'];
    let body = '';
    if (host) {
      const allMuted = c.others.every((id) => !c.st[id].mic);
      body += `<div class="hostbar"><button data-a="muteAll" ${allMuted ? 'disabled style="opacity:.5"' : ''}>${ic('mic-off-14')}Mute all</button><button class="${c.locked ? 'is-on' : ''}" data-a="lockCall">${ic('lock')}${c.locked ? 'Locked' : 'Lock call'}</button></div>`;
      if (c.waiting.length) {
        body += `<div class="panel__label" style="margin-top:14px">WAITING TO JOIN · ${c.waiting.length}</div>` + c.waiting.map((id) => `<div class="prow">${avatar(id, 'av34')}<div class="prow__text"><span class="prow__name">${esc(P(id).name)}</span><span class="prow__meta">Guest · ${esc(P(id).dept)}</span></div>
          <button class="pill-btn" style="min-width:70px" data-a="admit" data-id="${id}">Admit</button><button class="pill-btn pill-btn--ghost" style="min-width:65px" data-a="deny" data-id="${id}">Deny</button></div>`).join('');
      }
      body += `<div class="panel__label" style="margin-top:${c.waiting.length ? 6 : 14}px">IN THE CALL · ${ids.length}</div>`;
    } else {
      body += '<div class="panel__label">IN THE CALL</div>';
    }
    body += ordered.map((id) => personRow(c, id, host)).join('');
    if (!S.guestMode) body += inviteRows(c);
    let menu = '';
    if (host && c.rowMenu) {
      const st = c.st[c.rowMenu] || {};
      const idx = ordered.indexOf(c.rowMenu);
      const top = (c.waiting.length ? 146 + 52 * c.waiting.length + 44 : 124) + idx * 50 + 46;
      menu = `<div class="rowmenu" style="top:${Math.min(top, 470)}px" data-keep>
        <button class="dpop__item" data-a="rmMute" data-id="${c.rowMenu}"><span class="dpop__ic">${ic('mic-off-18')}</span><span class="dpop__t">${st.mic ? 'Mute' : 'Ask to unmute'}</span></button>
        <button class="dpop__item" data-a="rmCam" data-id="${c.rowMenu}"><span class="dpop__ic">${ic('video')}</span><span class="dpop__t">Ask to turn on camera</span></button>
        <button class="dpop__item" data-a="pin" data-id="${c.rowMenu}"><span class="dpop__ic">${ic('pin-18')}</span><span class="dpop__t">${c.pinned === c.rowMenu ? 'Unpin' : 'Pin for me'}</span></button>
        <button class="dpop__item" data-a="rmCohost" data-id="${c.rowMenu}"><span class="dpop__ic">${ic('settings-white')}</span><span class="dpop__t">${c.cohosts && c.cohosts[c.rowMenu] ? 'Remove co-host' : 'Make co-host'}</span></button>
        <button class="dpop__item" data-a="rmRemove" data-id="${c.rowMenu}"><span class="dpop__ic">${ic('hangup')}</span><span class="dpop__t">Remove from call</span></button></div>`;
    }
    return `<aside class="panel" style="position:relative"><div class="panel__head"><span class="panel__title">People</span>${host ? '' : `<span class="panel__sub">${ids.length} in the call</span>`}${close}</div>
      <div class="panel__scroll">${body}</div>
      ${S.guestMode ? '' : `<div class="panel__foot"><button class="wide-btn" data-a="copyLink">${ic('link', 'ic16')}Invite with link</button></div>`}
      ${menu}</aside>`;
  }

  function controls(c, mode = 'full') {
    const pop = c.pop;
    if (mode === 'calling' || mode === 'noanswer') {
      return `<div class="controls"><div class="controls__center">
        ${mode === 'calling' ? `<button class="cbtn cbtn--split ${c.mic ? '' : 'cbtn--off'}" data-a="toggleMic">${ic(c.mic ? 'mic' : 'mic-off-18', 'ic18')}${ic('chevron', 'chev')}</button>
        <button class="cbtn cbtn--split ${c.cam ? '' : 'cbtn--off'}" data-a="toggleCam">${ic(c.cam ? 'video' : 'video-off-18-white', 'ic18')}${ic('chevron', 'chev')}</button>
        <button class="cbtn cbtn--leave cbtn--wide" data-a="cancelCalling">${ic('hangup', 'ic18')}Cancel call</button>`
        : `<button class="cbtn cbtn--leave" data-a="closeNoAnswer">${ic('hangup', 'ic18')}Leave</button>`}
      </div></div>`;
    }
    const sharingMe = c.share && c.share.by === 'me';
    const popHtml = pop ? dPopover(c, pop) : '';
    return `<div class="controls">
      <button class="cbtn ${c.cc ? 'is-on' : ''}" data-a="toggleCC" title="Captions">${'<span class="cc-ic">CC</span>'}</button>
      <div class="controls__center">
        <button class="cbtn cbtn--split ${c.mic ? '' : 'cbtn--off'} ${pop === 'mic' ? 'is-open' : ''}" data-a="toggleMic" data-split="mic" title="${c.mic ? 'Mute (M)' : 'Unmute (M)'}" data-keep>${ic(c.mic ? 'mic' : 'mic-off-18', 'ic18')}${ic('chevron', 'chev')}</button>
        <button class="cbtn cbtn--split ${c.cam ? '' : 'cbtn--off'} ${pop === 'cam' ? 'is-open' : ''}" data-a="toggleCam" data-split="cam" title="Camera (V)" data-keep>${ic(c.cam ? 'video' : 'video-off-18-white', 'ic18')}${ic('chevron', 'chev')}</button>
        <button class="cbtn cbtn--split ${sharingMe || pop === 'share' ? 'is-on' : ''} ${pop === 'share' ? 'is-open' : ''}" data-a="togglePop" data-id="share" title="Share" data-keep>${ic('airplay', 'ic18')}${ic('chevron', 'chev')}</button>
        <button class="cbtn ${c.hand ? 'is-on' : ''}" style="${c.hand ? 'background:var(--blue)' : ''}" data-a="toggleHand" title="Raise hand (H)">${ic('hand', 'ic18')}</button>
        <button class="cbtn ${pop === 'reactions' ? 'is-on' : ''}" data-a="togglePop" data-id="reactions" title="Reactions" data-keep>${ic('smile', 'ic18')}</button>
        <button class="cbtn ${pop === 'more' ? 'is-on' : ''}" data-a="togglePop" data-id="more" title="More" data-keep>${ic('dots', 'ic18')}</button>
        <button class="cbtn cbtn--leave" data-a="leave">${ic('hangup', 'ic18')}Leave</button>
        ${popHtml}
      </div>
      <div class="controls__right">
        <button class="cbtn ${c.panel === 'people' ? 'is-on' : ''}" data-a="panel" data-id="people" title="People">${ic('users', 'ic18')}<span class="badge" style="${c.others.length + 1 > 9 ? 'width:26px;left:22px' : ''}">${c.others.length + 1}</span>${c.waiting.length && isHost(c) ? '' : ''}</button>
        <button class="cbtn ${c.panel === 'chat' ? 'is-on' : ''}" data-a="panel" data-id="chat" title="Chat">${ic('chat', 'ic18')}${c.unread ? `<span class="badge" data-badge="chat">${c.unread}</span>` : ''}</button>
        ${S.guestMode ? '' : `<button class="cbtn ${c.panel === 'details' ? 'is-on' : ''}" data-a="panel" data-id="details" title="Details">${ic('info', 'ic18')}</button>`}
      </div></div>`;
  }

  function dPopover(c, pop) {
    if (pop === 'share') {
      return `<div class="dpop" style="left:108px;bottom:56px;width:372px" data-keep>
        <button class="dpop__item" data-a="shareScreen"><span class="dpop__ic">${ic('airplay')}</span><span class="dpop__text"><span class="dpop__t">Screen or window</span><span class="dpop__s">Anything on your computer</span></span></button>
        ${S.guestMode ? '' : `<div class="dpop__div"></div><div class="dpop__label">FROM THIS WORKSPACE</div>
        <button class="dpop__item" data-a="shareObj" data-id="task"><span class="dpop__ic">${ic('task-18')}</span><span class="dpop__text"><span class="dpop__t">Order status redesign</span><span class="dpop__s">Task · linked to this call</span></span>${c.linked ? '<span class="dpop__tag">Linked</span>' : ''}</button>
        <button class="dpop__item" data-a="shareObj" data-id="table"><span class="dpop__ic">${ic('table')}</span><span class="dpop__text"><span class="dpop__t">Supplier prices</span><span class="dpop__s">Table · opened 12 min ago</span></span></button>
        <button class="dpop__item" data-a="shareObj" data-id="doc"><span class="dpop__ic">${ic('file-white')}</span><span class="dpop__text"><span class="dpop__t">Dock schedule</span><span class="dpop__s">Doc · Warehouse</span></span></button>
        <div class="dpop__foot">${ic('info-14')}Everyone sees the live object, not a screenshot.</div>`}
      </div>`;
    }
    if (pop === 'reactions') {
      return `<div class="dpop" style="left:165px;bottom:56px;width:330px;padding:8px" data-keep>
        <div class="reacts">${[['r-thumbs', 'Nice'], ['r-heart', 'Love it'], ['r-star', 'Great'], ['r-smile', 'Haha']].map(([n, t]) => `<button data-a="react" data-id="${n}" data-t="${t}" title="${t}">${ic(n)}</button>`).join('')}</div>
        <div class="dpop__div" style="margin:10px 12px 9px"></div>
        <button class="dpop__item ${c.hand ? 'is-on' : ''}" data-a="toggleHand"><span class="dpop__ic">${ic('hand')}</span><span class="dpop__text"><span class="dpop__t">${c.hand ? 'Lower hand' : 'Raise hand'}</span><span class="dpop__s">Others see a hand on your tile</span></span><span class="dpop__tag dpop__tag--soft">H</span></button>
      </div>`;
    }
    if (pop === 'more') {
      const canRec = !S.guestMode;
      return `<div class="dpop" style="left:226px;bottom:56px;width:320px" data-keep>
        ${canRec ? `<button class="dpop__item" data-a="toggleRec"><span class="dpop__ic">${ic('recording')}</span><span class="dpop__text"><span class="dpop__t">${c.recording ? 'Stop recording' : 'Start recording'}</span><span class="dpop__s">Everyone will be notified</span></span></button>` : ''}
        ${S.guestMode ? '' : `<button class="dpop__item" data-a="togglePop" data-id="share" data-keep><span class="dpop__ic">${ic('table')}</span><span class="dpop__text"><span class="dpop__t">Share a workspace object</span><span class="dpop__s">Table, task or document</span></span></button>`}
        <button class="dpop__item" data-a="togglePop" data-id="settings" data-keep><span class="dpop__ic">${ic('settings-white')}</span><span class="dpop__text"><span class="dpop__t">Call settings</span><span class="dpop__s">Devices, background, noise</span></span></button>
        <div class="dpop__div" style="margin:4px 12px 7px"></div>
        <button class="dpop__item dpop__item--s" data-a="report"><span class="dpop__ic">${ic('info')}</span><span class="dpop__t">Report a problem</span></button>
      </div>`;
    }
    if (pop === 'settings') {
      return `<div class="dpop" style="left:206px;bottom:56px;width:340px" data-keep>
        <div class="dpop__label" style="padding-top:8px">CALL SETTINGS</div>
        <button class="dpop__item ${c.blur ? 'is-on' : ''}" data-a="toggleBlur"><span class="dpop__ic">${ic('stars')}</span><span class="dpop__text"><span class="dpop__t">Blur my background</span><span class="dpop__s">${c.blur ? 'On' : 'Off'}</span></span></button>
        <button class="dpop__item ${c.noise !== false ? 'is-on' : ''}" data-a="toggleNoise"><span class="dpop__ic">${ic('mic')}</span><span class="dpop__text"><span class="dpop__t">Noise suppression</span><span class="dpop__s">${c.noise !== false ? 'On' : 'Off'}</span></span></button>
        <button class="dpop__item" data-a="togglePop" data-id="mic" data-keep><span class="dpop__ic">${ic('settings-white')}</span><span class="dpop__text"><span class="dpop__t">Devices</span><span class="dpop__s">${esc(c.micDev || 'MacBook Pro Microphone')}</span></span></button>
      </div>`;
    }
    if (pop === 'mic' || pop === 'cam') {
      const list = pop === 'mic' ? ['MacBook Pro Microphone', 'AirPods Pro', 'External USB Mic'] : ['FaceTime HD Camera', 'Studio Display Camera'];
      const cur = pop === 'mic' ? (c.micDev || list[0]) : (c.camDev || list[0]);
      return `<div class="dpop" style="left:${pop === 'mic' ? -60 : 24}px;bottom:56px;width:300px" data-keep>
        <div class="dpop__label" style="padding-top:8px">${pop === 'mic' ? 'MICROPHONE' : 'CAMERA'}</div>
        ${list.map((d) => `<button class="dpop__item dpop__item--s" data-a="pickDev" data-kind="${pop}" data-id="${esc(d)}"><span class="dpop__t" style="padding-left:6px">${esc(d)}</span>${d === cur ? ic('check', 'dpop__check') : ''}</button>`).join('')}
        ${pop === 'cam' ? `<div class="dpop__div"></div><button class="dpop__item dpop__item--s ${c.blur ? 'is-on' : ''}" data-a="toggleBlur"><span class="dpop__t" style="padding-left:6px">Blur background</span>${c.blur ? ic('check', 'dpop__check') : ''}</button>` : ''}
      </div>`;
    }
    return '';
  }

  function stageOverlays(c) {
    let h = '';
    if (c.network === 'poor' && c.netBanner) {
      h += `<div class="stage-banner">${ic('wifi-orange')}Your connection is unstable. Video quality is reduced.${c.cam ? '<button class="pill-btn" data-a="netCamOff">Turn off my video</button>' : '<button class="pill-btn pill-btn--ghost" data-a="netDismiss">Dismiss</button>'}</div>`;
    } else if (S.guestMode && !c.guestNoticeClosed) {
      h += `<div class="stage-banner stage-banner--guest" data-a="closeGuestNotice">${ic('info-16')}You joined as a guest. Company chats, files and tasks are hidden.</div>`;
    }
    if (c.toasts.length) {
      h += `<div class="stage-toasts">${c.toasts.map((t) => `<div class="stoast ${t.sub ? 'stoast--2' : 'is-single'}">
        <span class="stoast__ic">${t.av ? avatar(t.av, '').replace('<span class=""', '<span style="width:34px;height:34px;display:grid;place-items:center;font-size:11px;font-weight:600"') : ic(t.icon)}</span>
        <span class="stoast__text"><span class="stoast__t">${esc(t.title)}</span>${t.sub ? `<span class="stoast__s">${esc(t.sub)}</span>` : ''}</span>
        ${t.action ? `<button class="pill-btn" data-a="${t.action.a}" data-id="${t.action.id || ''}" data-tid="${t.id}">${esc(t.action.label)}</button>` : ''}</div>`).join('')}</div>`;
    }
    if (c.cc) {
      const lines = [['anna', 'Let\'s start with the status labels on the order page.'], ['sofia', 'I noted the comments from the pricing table.'], ['marco', 'Brightway Foils have a nine day lead time right now.'], ['anna', 'Can we show the delivery date next to each status?'], ['sofia', 'Yes, I\'ll add it to the task checklist.']];
      const speaker = c.speaking && c.speaking !== 'me' ? c.speaking : 'anna';
      const l = lines.filter((x) => x[0] === speaker)[c.captionIdx % 2] || lines[c.captionIdx % lines.length];
      h += `<div class="captions" id="captions"><b>${esc(P(l[0]).short)}</b>${esc(l[1])}</div>`;
    }
    if (c.reconnecting) {
      h += `<div class="stage-overlay"><div class="reconnect">${ic('loading-36')}<h3>Reconnecting…</h3>
        <p>We lost the connection a few seconds ago. Your microphone and camera are paused until you are back.</p>
        <div class="reconnect__btns"><button class="btn-dim" data-a="leaveNow">Leave call</button><button class="btn-white" data-a="retry">${c.retrying ? 'Trying…' : 'Retry now'}</button></div></div></div>`;
    }
    return h;
  }

  V.call = () => {
    const c = M();
    return `<div class="stage" id="stage">${stageBg()}${stHeader(c)}${stBody(c)}${controls(c)}${stageOverlays(c)}</div>`;
  };

  V.calling = () => {
    const k = S.calling;
    const p = P(k.person);
    const missed = k.state === 'missed';
    const meTile = tile({ ...k.fake }, 'me', { noTools: true, cls: 'selftile' });
    return `<div class="stage">${stageBg()}
      <div class="stage__head"><div class="stage__title">Call with ${esc(p.name)}</div></div>
      <div class="calling ${missed ? 'is-missed' : ''}">
        <span class="bigav" style="background:${p.color}">${p.initials}</span>
        <h3>${missed ? esc(p.short) + ' did not answer' : 'Calling ' + esc(p.name) + '…'}</h3>
        <p>${missed ? `No answer after 30 seconds. ${k.person === 'marco' ? 'He' : 'They'} will see a missed call in your chat.` : `Ringing on every device ${k.person === 'marco' ? 'he is' : 'they are'} signed in to`}</p>
        ${missed ? `<div class="calling__btns"><button class="btn-white" data-a="tryAgain">Try again</button><button class="btn-dim" data-a="messagePerson">Message ${esc(p.short)}</button></div>` : ''}
      </div>
      ${meTile}
      ${controls(k.fake, missed ? 'noanswer' : 'calling')}
    </div>`;
  };

  V.summary = () => {
    const s = S.summary;
    const ppl = s.people;
    const m = M();
    const canRejoin = m && m.id === s.id && !S.inCall && m.others.length > 0 && !S.guestMode;
    return `<div class="page page--scroll">
      <div class="summary">
        <span class="badge-g">${ic('check-circle')}Call ended</span>
        <h2>${esc(s.title)}</h2>
        <div class="summary__sub">Wed, Nov 11${s.channel ? ' · ' + esc(s.channel) : ''}</div>
        <div class="stats">
          <div class="stat"><span>Duration</span><b>${s.duration}</b></div>
          <div class="stat"><span>People</span><b>${ppl.length}</b></div>
          <div class="stat"><span>Recording</span><b>${s.recorded ? (s.recReady ? '<a href="#" data-a="playRec" style="color:var(--blue);text-decoration:none">Ready · Play</a>' : 'Processing…') : 'Not recorded'}</b></div>
        </div>
        <div class="summary__ppl"><div class="stack">${ppl.slice(0, 6).map((p) => avatar(p, 'av36s')).join('')}</div>${esc(listNames(ppl.filter((x) => x !== 'me'), 3))}</div>
        ${s.linked ? `<div class="staskcard">${ic('task-dark-18')}<div><b>${esc(D.meeting.task.title)}</b><span>Notes from the call were saved to this task</span></div><button class="btn-light" data-a="openTaskPage">Open task</button></div>` : ''}
        <div class="summary__btns">
          ${s.channel ? `<button class="btn-blue btn-blue--44 ${s.posted ? 'is-done' : ''}" data-a="postSummary" ${s.posted ? 'disabled style="opacity:1"' : ''}>${s.posted ? 'Posted to ' + esc(s.channel) : 'Post summary to ' + esc(s.channel)}</button>` : ''}
          <button class="btn-light btn-light--44" data-a="rejoin" ${canRejoin ? '' : 'disabled'}>Rejoin call</button>
          <button class="btn-light btn-light--44" data-a="nav" data-id="calls">Back to Calls</button>
        </div>
        <div class="summary__div"></div>
        <div class="rating"><span>How was the call quality?</span>${[1, 2, 3, 4, 5].map((n) => `<button class="${S.rating === n ? 'is-on' : ''}" data-a="rate" data-id="${n}">${n}</button>`).join('')}${S.rating ? '<span class="rating__thanks">Thanks for the feedback</span>' : ''}</div>
      </div></div>`;
  };

  V.ended = () => {
    const e = S.ended;
    return `<div class="stage">${stageBg()}
      <div class="ended"><span class="ended__ic">${ic('hangup-36')}</span>
        <h3>${esc(e.heading)}</h3><p>${esc(e.text)}</p>
        <div class="ended__btns">${e.guest ? '<button class="btn-white" data-a="guestRestart">Back to invite</button>' : '<button class="btn-white" data-a="openChat" data-id="design-team">Back to chat</button><button class="btn-dim" data-a="viewSummary">View summary</button>'}</div></div></div>`;
  };

  /* --------------------------------------------------------- overlays */
  function overlays() {
    let h = '';
    const m = M();
    // modal
    if (S.modal === 'start') h += startModal();
    if (S.modal === 'schedule') h += scheduleModal();
    if (S.leaveDialog && m) {
      h += `<div class="scrim" data-a="closeLeave"><div class="ddialog" data-keep>
        <h3>Leave the call?</h3><p>You are the host. If you leave, the call continues and ${esc(P(m.others[0] || 'anna').short)} becomes the host.</p>
        <div class="ddialog__btns"><button class="btn-white" data-a="leaveNow">Leave call</button><button class="btn-dim" data-a="endForAll">End for everyone</button></div>
        <button class="ddialog__cancel" data-a="closeLeave">Cancel</button></div></div>`;
    }
    if (S.incoming) {
      const i = S.incoming;
      h += `<div class="incoming"><span class="incoming__av"><img src="${P(i.from).photo || ''}" alt=""></span>
        <div class="incoming__t">${esc(P(i.from).name)} is calling</div><div class="incoming__s">${esc(i.sub)}</div>
        <div class="incoming__btns"><button class="btn-accept" data-a="acceptIncoming">${ic('phone-call')}Accept</button><button class="btn-decline" data-a="declineIncoming">${ic('hangup')}Decline</button></div></div>`;
    }
    if (S.inCall && S.route !== 'call' && !S.miniHidden) {
      const c = m;
      const focus = c.share && c.share.by !== 'me' ? c.share.by : (c.speaking && c.speaking !== 'me' ? c.speaking : (c.pinned || c.others[0] || 'me'));
      h += `<div class="mini"><i class="mini__dot"></i><div class="mini__title">${esc(c.short)} · <span data-timer="meeting">${mmss(elapsed(c))}</span></div>
        <button class="mini__expand" data-a="returnToCall" title="Back to the call">${ic('expand')}</button>
        ${tile(c, focus, { noTools: true })}
        <div class="mini__ctrls"><button class="${c.mic ? '' : 'is-off'}" data-a="toggleMic">${ic(c.mic ? 'mic' : 'mic-off-18')}</button>
          <button class="${c.cam ? '' : 'is-off'}" data-a="toggleCam">${ic(c.cam ? 'video' : 'video-off-18-white')}</button>
          <button data-a="miniChat">${ic('chat')}</button>
          <button class="is-red" data-a="leave">${ic('hangup')}</button></div></div>`;
    }
    if (S.pop === 'demo') h += demoMenu();
    if (S.pop === 'bell') h += bellMenu();
    return h;
  }

  function topbarExtra() {
    if (!(S.inCall && S.route !== 'call')) return '';
    const m = M();
    let h = `<button class="callpill" data-a="togglePill" data-keep title="You are in a call">${ic('video')}Call${ic('chevron-down-white', 'chev')}</button>`;
    if (S.pop === 'pill') {
      h += `<div class="lpop pillmenu" data-keep>
        <div class="incall-note"><i></i><div style="flex:1"><b>${esc(m.short)} · <span data-timer="meeting">${mmss(elapsed(m))}</span></b><span>${m.others.length + 1} people · ${m.mic ? 'mic on' : 'muted'}</span></div></div>
        <button class="lpop__item" data-a="returnToCall"><span class="lpop__ic">${ic('expand')}</span><span><div class="lpop__t">Return to call</div></span></button>
        <button class="lpop__item" data-a="toggleMini"><span class="lpop__ic">${ic('monitor')}</span><span><div class="lpop__t">${S.miniHidden ? 'Show mini window' : 'Hide mini window'}</div></span></button>
        <button class="lpop__item" data-a="toggleMic"><span class="lpop__ic">${ic(m.mic ? 'mic' : 'mic-off-18')}</span><span><div class="lpop__t">${m.mic ? 'Mute microphone' : 'Unmute microphone'}</div></span></button>
        <div class="lpop__div"></div>
        <button class="lpop__item" data-a="leave"><span class="lpop__ic" style="background:rgba(216,58,52,.12)">${ic('hangup')}</span><span><div class="lpop__t" style="color:var(--red)">Leave call</div></span></button>
      </div>`;
    }
    return h;
  }

  function demoMenu() {
    const inCall = S.inCall;
    const it = (a, t, icn, kbd = '') => `<button class="lpop__item" data-a="${a}"><span class="lpop__ic">${ic(icn)}</span><span class="lpop__t">${t}</span>${kbd ? `<span class="kbd">${kbd}</span>` : ''}</button>`;
    const c = M();
    return `<div class="lpop demomenu" data-keep>
      <div class="demomenu__label">SIGNED IN AS</div>
      <div style="padding:2px 12px 10px;font-size:13px"><b>Nina Park</b> · nina@northwind.com</div>
      <div class="lpop__div"></div>
      <div class="demomenu__label">SIMULATE EVENTS ${inCall ? '(IN THIS CALL)' : ''}</div>
      ${inCall ? `
        ${it('demoShareScreen', 'Marco shares his screen', 'airplay-16')}
        ${it('demoShareTable', 'Marco presents a table', 'table-dark')}
        ${it('demoEvents', 'Many events at once', 'users-16')}
        ${it('demoNetwork', c.network === 'poor' ? 'Connection is back to normal' : 'My connection is unstable', 'wifi-orange')}
        ${it('demoReconnect', 'Connection drops', 'loading-blue')}
        ${it('demoLarge', c.others.length > 10 ? 'Back to a small call' : '16 people join', 'users-16')}
        ${it('demoHost', isHost(c) ? 'Make Anna the host again' : 'Make me the host', 'settings-white')}
        ${it('demoWaiting', 'Guest asks to join', 'user-plus')}
        ${it('demoAlone', 'Everyone else leaves', 'hangup')}
        ${it('demoHostEnds', 'Host ends the call', 'hangup')}`
    : `
        ${it('demoIncoming', 'Incoming call from Anna', 'phone-call')}
        ${it('demoGuest', 'Open invite link as a guest', 'link-dark')}
        ${it('demoCamBlocked', S.prejoin.blocked ? 'Allow camera in browser' : 'Block camera in browser', 'video-dark')}
        ${it('demoCallMarco', 'Call Marco (no answer)', 'video-dark')}`}
      <div class="lpop__div"></div>
      ${it('demoReset', 'Restart prototype', 'compass')}
      <div style="padding:8px 12px 6px;font-size:11px;color:#5b6472;line-height:1.5">Shortcuts in a call: <b>M</b> mute · <b>V</b> camera · <b>H</b> hand · <b>Esc</b> close</div>
    </div>`;
  }
  function bellMenu() {
    return `<div class="lpop notifs" data-keep>
      <div class="demomenu__label">NOTIFICATIONS</div>
      <button class="notif" data-a="goPrejoin" style="width:100%;text-align:left">${avatar('anna', 'av36r')}<div><b>Anna started a call in #design-team</b><span>${M() ? 'Design review: order status · tap to join' : 'Ended'}</span></div></button>
      <button class="notif" data-a="openChat" data-id="marco" style="width:100%;text-align:left">${avatar('marco', 'av36r')}<div><b>Marco sent the supplier table</b><span>09:12</span></div></button>
      <button class="notif" data-a="nav" data-id="calendar" style="width:100%;text-align:left"><span class="av36r" style="background:rgba(43,92,250,.1)">${ic('video-blue')}</span><div><b>Supplier sync starts at 14:00</b><span>Reminder · 5 min before</span></div></button>
    </div>`;
  }

  /* ---------------------------------------------------------- modals */
  function pchip(id, a) { const p = P(id); return `<span class="pchip">${avatar(id, 'av20')}${esc(p.name)}<button data-a="${a}" data-id="${id}" title="Remove">${ic('x-12')}</button></span>`; }
  function suggestions(sel, q, a) {
    if (!q) return '';
    const list = Object.values(D.people).filter((p) => !sel.includes(p.id) && p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
    if (!list.length) return '';
    return `<div class="suggest">${list.map((p) => `<button data-a="${a}" data-id="${p.id}">${avatar(p.id, 'av20')}${esc(p.name)}<span style="color:#5b6472;margin-left:auto">${esc(p.dept)}</span></button>`).join('')}</div>`;
  }
  function startModal() {
    const d = S.modalData;
    const recent = ['dana', 'tom', 'lina', 'marco', 'sofia', 'anna'].filter((x) => !d.to.includes(x)).slice(0, 3);
    return `<div class="lscrim" data-a="closeModal"><div class="lmodal" style="width:540px" data-keep>
      <h3>Start a call</h3><div class="lmodal__sub">Call one person, a few people, or a whole channel</div>
      <button class="lmodal__close" data-a="closeModal">${ic('x-close-dark')}</button>
      <label class="flabel" style="margin-top:28px">To</label>
      <div style="position:relative"><div class="tofield">${d.to.map((id) => pchip(id, 'toRemove')).join('')}<input data-fk="toq" data-draft="toq" data-live="1" placeholder="${d.to.length ? '' : 'Type a name or #channel'}" value="${esc(S.drafts.toq || '')}"></div>${suggestions(d.to, S.drafts.toq, 'toAdd')}</div>
      <div class="lmodal__label2">RECENT</div>
      ${recent.map((id) => `<div class="lrow">${avatar(id, 'av36r')}<div><div class="lrow__name">${esc(P(id).name)}</div><div class="lrow__sub">${esc(P(id).dept)} · ${id === 'lina' ? 'away' : 'online'}</div></div><button class="btn-light" data-a="toAdd" data-id="${id}">Add</button></div>`).join('')}
      <div class="lmodal__foot" style="margin-top:24px"><button class="btn-light btn-light--44" data-a="copyLink">Copy invite link</button><span class="spacer"></span>
        <button class="btn-light btn-light--44" data-a="closeModal">Cancel</button><button class="btn-blue btn-blue--44" data-a="startCallNow">${d.to.length ? 'Start call' : 'Open empty room'}</button></div>
    </div></div>`;
  }
  function scheduleModal() {
    const d = S.modalData;
    const days = ['Mon, Nov 9', 'Tue, Nov 10', 'Wed, Nov 11', 'Thu, Nov 12', 'Fri, Nov 13'];
    const times = []; for (let h = 9; h <= 17; h++) { times.push(h + ':00'); if (h < 17) times.push(h + ':30'); }
    const sel = (key, opts, cur) => `<select data-model="${key}">${opts.map((o) => `<option ${o === cur ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    return `<div class="lscrim" data-a="closeModal"><div class="lmodal" style="width:620px" data-keep>
      <h3>Schedule a call</h3><button class="lmodal__close" data-a="closeModal">${ic('x-close-dark')}</button>
      <label class="flabel" style="margin-top:30px">Title</label>
      <div class="field"><input data-fk="stitle" data-model="title" value="${esc(d.title)}" placeholder="Call title"></div>
      <div class="grid3">
        <div><label class="flabel">Date</label><div class="field">${sel('date', days, d.date)}${ic('chevron-dark')}</div></div>
        <div><label class="flabel">Time</label><div class="field">${sel('time', times, d.time)}${ic('chevron-dark')}</div></div>
        <div><label class="flabel">Duration</label><div class="field">${sel('dur', ['15 min', '30 min', '45 min', '60 min'], d.dur)}${ic('chevron-dark')}</div></div>
      </div>
      <label class="flabel" style="margin-top:10px">Participants</label>
      <div style="position:relative"><div class="tofield">${d.people.map((id) => pchip(id, 'spRemove')).join('')}<input data-fk="spq" data-draft="spq" data-live="1" placeholder="Add people" value="${esc(S.drafts.spq || '')}"></div>${suggestions(d.people, S.drafts.spq, 'spAdd')}</div>
      <div class="grid2" style="margin-top:6px">
        <div><label class="flabel">Link to</label><div class="field">${sel('link', ['Task: Order status redesign', 'Table: Supplier prices', 'Doc: Dock schedule', 'Nothing'], d.link)}${ic('chevron-dark')}</div></div>
        <div><label class="flabel">Repeat</label><div class="field">${sel('repeat', ['Does not repeat', 'Every weekday', 'Every week', 'Every 2 weeks'], d.repeat)}${ic('chevron-dark')}</div></div>
      </div>
      <label class="flabel" style="margin-top:10px">Agenda</label>
      <textarea class="agenda" data-fk="agenda" data-model="agenda" placeholder="Add notes or an agenda">${esc(d.agenda)}</textarea>
      <div class="lmodal__note">${ic('link-dark')}A call link is created automatically and added to the invite.</div>
      <div class="lmodal__foot" style="margin-top:40px"><span style="font-size:13px;color:#5b6472;align-self:flex-end;padding-bottom:4px">Reminder: 5 min before</span><span class="spacer"></span>
        <button class="btn-light btn-light--44" data-a="closeModal">Cancel</button><button class="btn-blue btn-blue--44" data-a="doSchedule" ${d.title.trim() ? '' : 'disabled'}>Schedule</button></div>
    </div></div>`;
  }

  /* =============================================================== RENDER */
  const NAV_OF = { chat: 'chat', calls: 'calls', call: 'calls', prejoin: 'calls', calling: 'calls', summary: 'calls', ended: 'calls', waiting: 'calls', calendar: 'calendar', tasks: 'tasks', tables: 'tables', wiki: 'wiki', docs: 'docs', settings: 'settings', home: 'home' };

  function render() {
    const active = document.activeElement;
    const fk = active && active.dataset ? active.dataset.fk : null;
    const sel = fk && 'selectionStart' in active ? [active.selectionStart, active.selectionEnd] : null;
    const chatScroll = $('#chatScroll');
    const chatAtBottom = chatScroll ? chatScroll.scrollTop + chatScroll.clientHeight >= chatScroll.scrollHeight - 30 : true;

    const app = $('#app');
    app.classList.toggle('is-bare', S.route === 'guestLink');
    app.classList.toggle('is-guest', S.guestMode && S.route !== 'guestLink');
    if (S.route !== "call") S.expanded = false;
    app.classList.toggle("is-expanded", !!S.expanded);
    const navKey = NAV_OF[S.route] || S.route;
    $$('.nav__item').forEach((b) => b.classList.toggle('is-active', b.dataset.nav === navKey && navKey !== 'home'));
    $$('.nav__live').forEach((x) => x.remove());
    if (S.inCall && S.route !== 'call') { const b = $('.nav__item[data-nav="calls"]'); if (b) b.insertAdjacentHTML('beforeend', '<i class="nav__live"></i>'); }

    $('#view').innerHTML = (V[S.route] || V.home)();
    $('#topbar-extra').innerHTML = topbarExtra();
    $('#overlay-root').innerHTML = overlays();

    if (fk) {
      const el = $(`[data-fk="${fk}"]`);
      if (el) { el.focus(); if (sel && el.setSelectionRange) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* noop */ } }
    }
    const cs = $('#chatScroll'); if (cs && chatAtBottom) cs.scrollTop = cs.scrollHeight;
    const cb = $('#convBody'); if (cb) cb.scrollTop = cb.scrollHeight;
  }

  /* ============================================================== ACTIONS */
  const A = {};
  function go(route) { S.route = route; S.pop = null; if (M()) { M().pop = null; } }

  A.nav = (el) => {
    const r = el.dataset.id;
    if (S.inCall && S.route === 'call' && r !== 'calls') minimize();
    if (r === 'calls' && S.inCall && S.route === 'call') { minimize(); }
    go(r);
  };
  function minimize() { S.miniHidden = false; }
  A.returnToCall = () => { go('call'); };
  A.toggleMini = () => { S.miniHidden = !S.miniHidden; S.pop = null; };
  A.togglePill = () => { S.pop = S.pop === 'pill' ? null : 'pill'; };
  A.miniChat = () => { go('call'); M().panel = 'chat'; M().unread = 0; };

  A.openChat = (el) => { S.chatId = el.dataset.id; S.unreadChats[S.chatId] = 0; go('chat'); };
  A.toggleChatCall = () => { S.pop = S.pop === 'chatCall' ? null : 'chatCall'; };
  A.sendChat = () => {
    const key = 'chat-' + S.chatId; const text = (S.drafts[key] || '').trim(); if (!text) return false;
    (S.history[S.chatId] = S.history[S.chatId] || []).push({ from: 'me', time: nowHM(), lines: [text] });
    S.drafts[key] = '';
    if (S.chatId === 'sofia' && !S.inCall) setTimeout(() => { S.history.sofia.push({ from: 'sofia', time: nowHM(), lines: ['Sure, give me two minutes.'] }); if (S.route === 'chat' && S.chatId === 'sofia') render(); else { S.unreadChats.sofia = (S.unreadChats.sofia || 0) + 1; render(); } }, 2500);
  };
  A.react = (el) => {
    if (el.dataset.t) return A.reactCall(el);
    const h = S.history[S.chatId][+el.dataset.id];
    h.reacted = !h.reacted; h.reaction += h.reacted ? 1 : -1;
  };
  A.dmNotNow = (el) => { (S.dismissedAdd = S.dismissedAdd || {})[el.dataset.id] = true; };
  A.dmAddToCall = (el) => { const id = el.dataset.id; ring(id); toast(`Calling ${P(id).short} into ${M().short}`); };

  A.goPrejoin = () => { if (S.inCall) { go('call'); return; } if (!M()) { toast('This call has ended'); return; } S.prejoin.cam = !S.prejoin.blocked && S.prejoin.cam; go('prejoin'); startLevels(); };
  A.pjMic = () => { S.prejoin.mic = !S.prejoin.mic; };
  A.pjCam = () => { if (S.prejoin.blocked) { toast('Camera access is blocked in your browser'); return false; } S.prejoin.cam = !S.prejoin.cam; };
  A.pjBlur = () => { S.prejoin.blur = !S.prejoin.blur; };
  A.howAllow = () => toast('Click the camera icon in the address bar → Allow, then refresh the page');
  A.joinNow = () => joinMeeting();

  function joinMeeting() {
    const m = M();
    m.mic = S.prejoin.mic;
    m.cam = S.prejoin.cam && !S.prejoin.blocked;
    m.blur = S.prejoin.blur;
    m.toasts = [];
    S.inCall = true; S.miniHidden = false;
    m.joinedAt = Date.now();
    m.participantsSeen.add('me');
    go('call');
    if (m.others.length && !m.welcomed) {
      m.welcomed = true;
      if (m.recording) stoast({ icon: 'recording', title: 'This call is being recorded', sub: 'Recording started by ' + P(m.host === 'me' ? 'anna' : m.host).short, ttl: 5000 });
      schedule(12000, () => incomingCallChat('anna', 'Can you share the table?'));
    }
  }
  function incomingCallChat(from, text) {
    const m = C(); if (!m || !m.others.includes(from)) return;
    m.messages.push({ id: uid(), from, time: nowHM(), text });
    if (m.panel !== 'chat' || S.route !== 'call') {
      m.unread++;
      stoast({ icon: 'chat-16', title: `${P(from).short}: ${text}`, sub: 'New message in chat', action: { label: 'Reply', a: 'replyChat' } });
    }
    render();
  }
  A.replyChat = () => { const m = M(); m.panel = 'chat'; m.unread = 0; dismissToast(); go('call'); setTimeout(() => { const i = $('[data-fk="callchat"]'); i && i.focus(); }, 30); };
  function dismissToast(el) { if (el && el.dataset.tid) M().toasts = M().toasts.filter((t) => t.id !== el.dataset.tid); }

  /* in-call */
  A.toggleMic = (el, ev) => {
    const m = C(); if (!m) { S.calling.fake.mic = !S.calling.fake.mic; return; }
    if (el && el.dataset.split && ev && splitChevron(el, ev)) { m.pop = m.pop === el.dataset.split ? null : el.dataset.split; return; }
    m.pop = null;
    if (m.reconnecting) return false;
    m.mic = !m.mic; if (!m.mic && m.speaking === 'me') m.speaking = null;
    if (S.route !== 'call') toast(m.mic ? 'Microphone on' : 'Microphone muted');
  };
  A.toggleCam = (el, ev) => {
    const m = C(); if (!m) { S.calling.fake.cam = !S.calling.fake.cam; return; }
    if (el && el.dataset.split && ev && splitChevron(el, ev)) { m.pop = m.pop === el.dataset.split ? null : el.dataset.split; return; }
    m.pop = null;
    if (m.reconnecting) return false;
    m.cam = !m.cam;
  };
  function splitChevron(el, ev) { const r = el.getBoundingClientRect(); return ev.clientX - r.left > 38; }
  A.pickDev = (el) => { const m = M(); if (el.dataset.kind === 'mic') m.micDev = el.dataset.id; else m.camDev = el.dataset.id; m.pop = null; stoast({ icon: el.dataset.kind === 'mic' ? 'mic' : 'video', title: 'Switched to ' + el.dataset.id, single: true, ttl: 2500 }); };
  A.toggleBlur = () => { const m = M(); m.blur = !m.blur; };
  A.toggleNoise = () => { const m = M(); m.noise = m.noise === false; };
  A.togglePop = (el) => { const m = M(); const id = el.dataset.id; m.pop = m.pop === id ? null : id; };
  A.toggleCC = () => { const m = M(); m.cc = !m.cc; };
  A.toggleHand = () => {
    const m = M(); m.hand = !m.hand; m.pop = null;
    if (m.hand) m.raised.me = true; else delete m.raised.me;
    if (m.hand) schedule(9000, () => { const c = C(); if (c && c.hand) { stoast({ av: 'anna', title: 'Anna: Go ahead, Nina', single: true, ttl: 4000 }); render(); } });
  };
  A.reactCall = (el) => {
    const m = M(); m.pop = null;
    const icn = el.dataset.id === 'r-thumbs' ? 'thumbs-up' : el.dataset.id;
    m.reactions.me = { icon: icn, text: el.dataset.t };
    floatReaction(el.dataset.id);
    const k = Date.now(); m.reactions.me.k = k;
    schedule(4000, () => { const c = M(); if (c && c.reactions.me && c.reactions.me.k === k) { delete c.reactions.me; render(); } });
  };
  function floatReaction(n) {
    const st = $('#stage'); if (!st) return;
    for (let i = 0; i < 3; i++) {
      const f = document.createElement('div'); f.className = 'float-reaction';
      f.style.left = (st.clientWidth / 2 - 22 + (Math.random() * 160 - 80)) + 'px';
      f.style.animationDelay = (i * 0.18) + 's';
      f.innerHTML = ic(n);
      st.appendChild(f); setTimeout(() => f.remove(), 2800);
    }
  }
  A.layout = (el) => { const m = M(); m.layout = el.dataset.id; if (m.layout === 'grid') m.pinned = null; };
  A.pin = (el) => { const m = M(); const id = el.dataset.id; m.rowMenu = null; if (m.pinned === id) { m.pinned = null; m.layout = 'grid'; return; } m.pinned = id; m.layout = 'speaker'; stoast({ icon: 'pin', title: `${P(id).name} is pinned for you`, single: true, ttl: 2500 }); };
  A.unpin = () => { const m = M(); m.pinned = null; };
  A.page = (el) => { const m = M(); m.page = Math.max(0, m.page + +el.dataset.id); };
  A.fullscreen = () => {
    S.expanded = !S.expanded;
    try {
      if (S.expanded && !document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
      if (!S.expanded && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (e) { /* browser blocked real full screen – the in-app expanded view still works */ }
  };
  A.panel = (el) => {
    const m = M(); const id = el.dataset.id;
    m.panel = m.panel === id ? null : id; m.rowMenu = null;
    if (m.panel === 'chat') m.unread = 0;
    if (el.dataset.tid) dismissToast(el);
    if (S.route !== 'call') go('call');
  };
  A.sendCallChat = () => {
    const m = M(); const text = (S.drafts.callchat || '').trim(); if (!text) return false;
    m.messages.push({ id: uid(), from: 'me', time: nowHM(), text }); S.drafts.callchat = '';
    if (/table|share/i.test(text)) schedule(3000, () => incomingCallChat('marco', 'Thanks! Looking at the lead times now.'));
    else schedule(3500, () => incomingCallChat('sofia', 'Noted 👍'));
  };
  A.check = (el) => { const m = M(); const x = m.checklist[+el.dataset.id]; x.done = !x.done; };
  A.unlink = () => { const m = M(); m.linked = false; stoast({ icon: 'task-white', title: 'Task unlinked from this call', single: true, ttl: 2500 }); };
  A.relink = () => { const m = M(); m.linked = true; };
  A.openTask = () => { minimize(); go('tasks'); };
  A.openTaskPage = () => go('tasks');
  A.taskCard = (el) => { if (el.dataset.id === 'Order status redesign' && S.inCall) { go('call'); M().panel = 'details'; } else toast(el.dataset.id + ' · opened'); };
  A.copyLink = (el) => copyLink(el && el.dataset.link);

  A.addPerson = (el) => ring(el.dataset.id);
  function ring(id) {
    const m = M(); if (m.ringing.includes(id) || m.others.includes(id)) return;
    m.ringing.push(id);
    const k = uid(); m.ringKey = m.ringKey || {}; m.ringKey[id] = k;
    schedule(id === 'dana' ? 9000 : 3200, () => {
      const c = M(); if (!c || !c.ringing.includes(id) || c.ringKey[id] !== k) return;
      c.ringing = c.ringing.filter((x) => x !== id);
      if (id === 'dana') { stoast({ av: id, title: `${P(id).short} did not answer`, single: true, ttl: 3500 }); render(); return; }
      personJoins(id);
    });
  }
  function personJoins(id, quiet) {
    const m = M(); if (m.others.includes(id)) return;
    m.others.push(id); m.st[id] = defaultSt(id); m.participantsSeen.add(id);
    if (m.others.length === 1) m.inviteClosed = false;
    if (!quiet && S.inCall) stoast({ icon: 'users-16', title: `${P(id).name} joined the call`, single: true, ttl: 4000 });
    render();
  }
  A.cancelRing = (el) => { const m = M(); m.ringing = m.ringing.filter((x) => x !== el.dataset.id); };
  A.closeInvite = () => { M().inviteClosed = true; };

  // host
  A.rowMenu = (el) => { const m = M(); m.rowMenu = m.rowMenu === el.dataset.id ? null : el.dataset.id; };
  A.rmMute = (el) => { const m = M(); const s = m.st[el.dataset.id]; m.rowMenu = null; if (s.mic) { s.mic = false; stoast({ icon: 'mic-off', title: `${P(el.dataset.id).short} was muted`, single: true, ttl: 2500 }); } else stoast({ icon: 'mic', title: `Asked ${P(el.dataset.id).short} to unmute`, single: true, ttl: 2500 }); };
  A.rmCam = (el) => { const m = M(); m.rowMenu = null; const id = el.dataset.id; stoast({ icon: 'video', title: `Asked ${P(id).short} to turn on the camera`, single: true, ttl: 2500 }); };
  A.rmCohost = (el) => { const m = M(); m.rowMenu = null; m.cohosts = m.cohosts || {}; m.cohosts[el.dataset.id] = !m.cohosts[el.dataset.id]; };
  A.rmRemove = (el) => { const m = M(); const id = el.dataset.id; m.rowMenu = null; removePerson(id); stoast({ icon: 'hangup', title: `${P(id).short} was removed from the call`, single: true, ttl: 3000 }); };
  function removePerson(id) { const m = M(); m.others = m.others.filter((x) => x !== id); delete m.raised[id]; delete m.reactions[id]; if (m.pinned === id) m.pinned = null; if (m.speaking === id) m.speaking = null; if (m.share && m.share.by === id) m.share = null; }
  A.muteAll = () => { const m = M(); m.others.forEach((id) => { m.st[id].mic = false; }); m.speaking = null; stoast({ icon: 'mic-off', title: 'Everyone else is muted', sub: 'They can unmute themselves', ttl: 3000 }); };
  A.lockCall = () => { const m = M(); m.locked = !m.locked; stoast({ icon: 'lock', title: m.locked ? 'Call locked' : 'Call unlocked', sub: m.locked ? 'New people wait until you admit them' : 'People with the link can join', ttl: 3000 }); };
  A.admit = (el) => { const m = M(); const id = el.dataset.id; m.waiting = m.waiting.filter((x) => x !== id); dismissToast(el); personJoins(id); };
  A.deny = (el) => { const m = M(); m.waiting = m.waiting.filter((x) => x !== el.dataset.id); dismissToast(el); };
  A.viewPeople = (el) => { const m = M(); m.panel = 'people'; dismissToast(el); };

  // sharing
  A.shareScreen = () => { const m = M(); m.pop = null; if (m.share && m.share.by !== 'me') { stoast({ icon: 'airplay-16', title: `${P(m.share.by).short} is presenting`, sub: 'Ask them to stop before you share', ttl: 3000 }); return; } m.share = { type: 'screen', by: 'me', label: 'Order status · Chrome window' }; m.sharePaused = false; m.layout = 'grid'; };
  A.shareObj = (el) => {
    const m = M(); m.pop = null; const o = el.dataset.id;
    if (m.share && m.share.by !== 'me') { stoast({ icon: 'airplay-16', title: `${P(m.share.by).short} is presenting`, sub: 'Ask them to stop before you share', ttl: 3000 }); return; }
    const label = { table: 'Table: Supplier prices', task: 'Task: Order status redesign', doc: 'Doc: Dock schedule' }[o];
    m.share = { type: 'object', obj: o, by: 'me', label };
  };
  A.stopShare = () => { const m = M(); m.share = null; m.sharePaused = false; };
  A.pauseShare = () => { const m = M(); m.sharePaused = !m.sharePaused; };
  A.changeWindow = () => { const m = M(); const opts = ['Order status · Chrome window', 'Supplier prices · Tandem', 'Entire screen · Display 1']; const i = (opts.indexOf(m.share.label) + 1) % opts.length; m.share.label = opts[i]; };
  A.toggleFollow = () => { const m = M(); m.follow = !m.follow; };
  A.editCell = (el) => { if (S.editCell === +el.dataset.id) return false; S.editCell = +el.dataset.id; setTimeout(() => { const i = $('[data-fk="cell"]'); if (i) { i.focus(); i.select(); } }, 10); };

  // recording / misc
  A.toggleRec = () => { const m = M(); m.pop = null; m.recording = !m.recording; if (m.recording) m.recStart = Date.now(); stoast({ icon: 'recording', title: m.recording ? 'Recording started' : 'Recording stopped', sub: m.recording ? 'Everyone in the call was notified' : 'It will appear in Calls → Recordings', ttl: 3500 }); };
  A.report = () => { const m = M(); m.pop = null; stoast({ icon: 'info-16', title: 'Thanks, we sent a diagnostics report', single: true, ttl: 3000 }); };
  A.closeGuestNotice = () => { M().guestNoticeClosed = true; };

  // network
  A.netCamOff = () => { const m = M(); m.cam = false; m.netBanner = false; stoast({ icon: 'video', title: 'Video turned off to keep audio stable', single: true, ttl: 3000 }); };
  A.netDismiss = () => { M().netBanner = false; };
  A.retry = () => { const m = M(); m.retrying = true; schedule(1500, () => reconnectDone()); };
  function reconnectDone() { const m = C(); if (!m || !m.reconnecting) return; m.reconnecting = false; m.retrying = false; stoast({ icon: 'wifi-14-white', title: 'You are back in the call', single: true, ttl: 3000 }); render(); }

  // leaving
  A.leave = () => {
    const m = C(); if (!m) return;
    m.pop = null; S.pop = null;
    if (isHost(m) && m.others.length > 1) { S.leaveDialog = true; return; }
    leaveMeeting(false);
  };
  A.closeLeave = () => { S.leaveDialog = false; };
  A.leaveNow = () => leaveMeeting(false);
  A.endForAll = () => leaveMeeting(true);
  function leaveMeeting(endAll) {
    const m = M();
    S.leaveDialog = false;
    const people = Array.from(m.participantsSeen);
    const dur = mmss(elapsed(m));
    S.inCall = false;
    if (S.guestMode) {
      S.ended = { heading: 'You left the call', text: 'Thanks for joining Northwind Logistics. You can use the invite link again to rejoin.', guest: true };
      S.guestMode = false; S.meeting = null; resetLive();
      go('ended'); return;
    }
    S.summary = { id: m.id, title: m.title, channel: m.channel, duration: dur, people: people.includes('me') ? [...people.filter((x) => x !== 'me'), 'me'] : people, recorded: m.recording || m.wasRecorded, linked: m.linked, posted: false };
    if (S.summary.recorded) schedule(6000, () => { if (S.summary) { S.summary.recReady = true; if (S.route === 'summary') render(); } });
    if (isHost(m) && !endAll && m.others.length) m.host = m.others[0];
    if (endAll || !m.others.length || (m.id !== "dr" && m.others.length < 2)) {
      S.meeting = null;
      S.history[m.channel || 'design-team'] && m.channel && S.history[m.channel].push({ from: 'me', kind: 'call', time: nowHM(), text: `Call ended · ${dur}`, icon: 'video-dark' });
    } else {
      m.panel = null; m.pop = null; m.share = m.share && m.share.by === 'me' ? null : m.share; m.hand = false; delete m.raised.me; delete m.reactions.me; m.toasts = [];
    }
    go('summary');
  }
  function resetLive() {
    S.meeting = newMeeting({ elapsed: 372, recording: true, recElapsed: 168, others: ['anna', 'marco', 'sofia'], unread: 2, messages: [...D.chatMessages.map((x) => ({ ...x, id: uid() })), { kind: "task", id: "task" }], host: 'anna' });
  }
  A.postSummary = () => {
    const s = S.summary; s.posted = true;
    (S.history[s.channel] = S.history[s.channel] || []).push({ from: 'me', time: nowHM(), lines: [`Summary of “${s.title}” · ${s.duration} · ${s.people.length} people.`, s.linked ? 'Notes were saved to the task Order status redesign.' : 'No task was linked.'] });
    toast('Summary posted to #' + s.channel);
  };
  A.rejoin = () => A.goPrejoin();
  A.rate = (el) => { S.rating = +el.dataset.id; };
  A.viewSummary = () => go('summary');
  A.playRec = () => { toast('Opening the recording player…'); return false; };

  // calls page
  A.callsTab = (el) => { S.callsTab = el.dataset.id; };
  A.selectCall = (el) => { S.callsSelected = el.dataset.id; };
  A.toggleCallsNew = () => { S.pop = S.pop === 'callsNew' ? null : 'callsNew'; };
  A.joinScheduled = (el) => {
    const id = el.dataset.id;
    if (M() && M().id === id) return A.goPrejoin();
    if (S.inCall) { toast('Leave your current call first'); return false; }
    const row = S.calls.find((r) => r.id === id) || {};
    const ev = S.events.find((e) => e.callId === id) || {};
    const ppl = (row.people || ev.people || []).filter((x) => x !== 'me');
    S.meeting = newMeeting({ id, title: row.title || ev.title, short: row.title || ev.title, channel: row.chat && !D.people[row.chat] ? row.chat : null, others: [], host: 'me', linked: false, invitable: ppl });
    S.meeting.pendingJoin = ppl.slice(0, 2);
    S.pop = null; go('prejoin'); startLevels();
  };
  A.callAgain = (el) => { const r = S.callHistory.find((x) => x.title === el.dataset.id); openStart(r ? r.people : []); };
  function openStart(to) { if (S.inCall) { toast('Leave your current call first'); return; } S.modal = 'start'; S.modalData = { to: to || ['marco', 'sofia'] }; S.drafts.toq = ''; S.pop = null; }
  A.openStart = () => openStart();
  A.toAdd = (el) => { const d = S.modalData; if (!d.to.includes(el.dataset.id)) d.to.push(el.dataset.id); S.drafts.toq = ''; };
  A.toRemove = (el) => { const d = S.modalData; d.to = d.to.filter((x) => x !== el.dataset.id); };
  A.closeModal = () => { S.modal = null; };
  A.startCallNow = () => {
    const to = S.modalData.to;
    S.modal = null;
    if (to.length === 1) return startCalling(to[0]);
    const title = to.length ? 'Call with ' + listNames(to) : 'New call';
    S.meeting = newMeeting({ id: 'adhoc-' + uid(), title, short: to.length ? 'Call' : 'New call', channel: null, others: [], host: 'me', linked: false, invitable: to.length ? to : ['anna', 'marco', 'sofia'] });
    S.prejoin.cam = S.prejoin.cam && !S.prejoin.blocked;
    joinMeeting();
    to.forEach((id) => ring(id));
  };
  A.startChannelCall = () => {
    S.pop = null;
    const chat = D.chats.find((c) => c.id === S.chatId);
    S.meeting = newMeeting({ id: 'ch-' + uid(), title: '#' + chat.name + ' call', short: chat.name, channel: chat.name, others: [], host: 'me', linked: false, invitable: ['anna', 'marco', 'sofia', 'tom', 'lina'].slice(0, 5) });
    joinMeeting();
    ['anna', 'sofia'].forEach((id) => ring(id));
  };

  // scheduling
  A.openSchedule = () => {
    const chat = D.chats.find((c) => c.id === S.chatId);
    const ppl = S.route === 'chat' && chat && chat.kind === 'dm' ? [chat.person] : ['anna', 'marco'];
    S.modal = 'schedule'; S.pop = null; S.drafts.spq = '';
    S.modalData = { title: 'Design review: order status', date: 'Thu, Nov 12', time: '15:00', dur: '45 min', people: ppl, link: 'Task: Order status redesign', repeat: 'Does not repeat', agenda: '' };
  };
  A.spAdd = (el) => { const d = S.modalData; if (!d.people.includes(el.dataset.id)) d.people.push(el.dataset.id); S.drafts.spq = ''; };
  A.spRemove = (el) => { const d = S.modalData; d.people = d.people.filter((x) => x !== el.dataset.id); };
  A.doSchedule = () => {
    const d = S.modalData; if (!d.title.trim()) return false;
    const dayIdx = ['Mon, Nov 9', 'Tue, Nov 10', 'Wed, Nov 11', 'Thu, Nov 12', 'Fri, Nov 13'].indexOf(d.date);
    const [hh, mm] = d.time.split(':').map(Number);
    const durMin = parseInt(d.dur, 10);
    const end = hh * 60 + mm + durMin;
    const endS = Math.floor(end / 60) + ':' + pad(end % 60);
    const id = 'sch-' + uid();
    const ev = { id: 'ev-' + id, day: dayIdx, start: hh + mm / 60, dur: durMin / 60, title: d.title, sub: d.time, call: true, callId: id, when: `${d.date} · ${d.time} – ${endS}`, badge: dayIdx === 2 ? 'Today' : dayIdx === 3 ? 'Tomorrow' : d.date.split(',')[0], link: d.link !== 'Nothing' ? d.link : null, linkIcon: d.link.startsWith('Table') ? 'table-dark' : 'task-dark', people: [...d.people, 'me'], chat: 'design-team', isNew: true };
    S.events.push(ev);
    const group = dayIdx === 2 ? 'TODAY' : dayIdx === 3 ? 'TOMORROW' : d.date.toUpperCase();
    const row = { id, group, time: `${d.time} – ${endS}`, title: d.title, sub: `${d.people.length ? P(d.people[0]).short.toLowerCase() : 'you'} · ${d.people.length + 1} people`, people: [...d.people, 'me'], chat: 'design-team', when: `${d.date}`, link: ev.link, linkIcon: ev.linkIcon };
    const order = ['TODAY', 'TOMORROW'];
    const gi = (g) => (order.indexOf(g) === -1 ? 9 : order.indexOf(g));
    let pos = S.calls.findIndex((r) => gi(r.group) > gi(group) || (r.group === group && !r.live && r.time > row.time));
    if (pos === -1) pos = S.calls.length;
    S.calls.splice(pos, 0, row);
    S.modal = null;
    S.calSelected = ev.id;
    toast(`Call scheduled · invite sent to ${d.people.length} ${d.people.length === 1 ? 'person' : 'people'}`);
    setTimeout(() => { ev.isNew = false; }, 600);
  };

  // calendar
  A.calEvent = (el) => {
    const ev = S.events.find((e) => e.id === el.dataset.id);
    if (!ev.call) { S.calSelected = ev.id; S.pop = null; toast(ev.title + ' · ' + (ev.sub || 'no call attached')); return; }
    if (S.pop === 'calEvent' && S.calSelected === ev.id) { S.pop = null; S.calSelected = null; return; }
    S.calSelected = ev.id; S.pop = 'calEvent';
  };
  A.closePop = () => { S.pop = null; S.calSelected = null; };

  // 1:1 calling
  A.callPerson = (el) => { if (S.inCall) return false; startCalling(el.dataset.id); };
  function startCalling(id) {
    S.calling = { person: id, state: 'ringing', attempt: (S.calling && S.calling.person === id ? S.calling.attempt : 0) + 1, fake: { mic: true, cam: true, st: {}, raised: {}, reactions: {}, poor: {}, others: [], network: 'good' } };
    go('calling');
    const k = S.calling;
    schedule(k.attempt > 1 ? 3500 : 6000, () => {
      if (S.calling !== k || S.route !== 'calling') return;
      if (k.attempt > 1) {
        S.meeting = newMeeting({ id: 'dm-' + uid(), title: 'Call with ' + P(id).name, short: P(id).short, channel: null, others: [], host: 'me', linked: false, invitable: ['anna', 'sofia', 'tom'] });
        S.prejoin.mic = k.fake.mic; S.prejoin.cam = k.fake.cam;
        joinMeeting();
        personJoins(id, true);
        stoast({ icon: 'phone-call', title: `${P(id).short} picked up`, single: true, ttl: 3000 });
        S.calling = null; render();
      } else {
        k.state = 'missed';
        (S.history[id] = S.history[id] || []).push({ from: 'me', kind: 'call', time: nowHM(), text: `Missed call · ${P(id).short} did not answer`, icon: 'video-dark' });
        render();
      }
    });
  }
  A.cancelCalling = () => { const id = S.calling.person; S.calling = null; S.chatId = D.chats.find((c) => c.person === id) ? D.chats.find((c) => c.person === id).id : S.chatId; go('chat'); toast('Call cancelled'); };
  A.tryAgain = () => startCalling(S.calling.person);
  A.messagePerson = () => { const id = S.calling.person; const ch = D.chats.find((c) => c.person === id); S.calling = null; if (ch) { S.chatId = ch.id; } go('chat'); setTimeout(() => { const i = $(`[data-fk="chat-${S.chatId}"]`); i && i.focus(); }, 30); };
  A.closeNoAnswer = () => A.cancelCalling();

  // incoming
  A.acceptIncoming = () => {
    const i = S.incoming; S.incoming = null;
    if (S.inCall) leaveMeeting(false);
    S.meeting = newMeeting({ id: 'in-' + uid(), title: 'Call with ' + P(i.from).name, short: P(i.from).short, channel: 'design-team', others: [i.from], host: i.from, linked: true });
    S.prejoin.cam = S.prejoin.cam && !S.prejoin.blocked;
    joinMeeting();
  };
  A.declineIncoming = () => { const i = S.incoming; S.incoming = null; (S.history['design-team']).push({ from: i.from, kind: 'call', time: nowHM(), text: 'You declined a call from ' + P(i.from).short, icon: 'video-dark' }); toast('Call declined · Anna will see it in the chat'); };

  // guest flow
  A.askToJoin = () => {
    if (!S.guestName.trim()) return false;
    S.guestMode = true; S.prejoin.blur = false;
    go('waiting');
    const k = uid(); S.guestKey = k;
    schedule(4500, () => {
      if (S.guestKey !== k || S.route !== 'waiting') return;
      const m = M();
      m.host = 'anna';
      joinMeeting();
      stoast({ av: 'anna', title: 'Anna Kovalenko admitted you', single: true, ttl: 3500 });
      render();
    });
  };
  A.leaveWaiting = () => { S.guestKey = null; go('guestLink'); };
  A.exitGuest = () => { S.guestMode = false; S.guestKey = null; S.inCall = false; if (!M()) resetLive(); S.prejoin = { mic: true, cam: true, blur: false, blocked: false }; S.chatId = "design-team"; go("chat"); };
  A.guestRestart = () => { S.guestMode = false; go('guestLink'); };

  // header / shell
  A.openProfile = () => { S.pop = S.pop === 'demo' ? null : 'demo'; };
  A.openBell = () => { S.pop = S.pop === 'bell' ? null : 'bell'; };

  /* -------------------------------------------------------- demo actions */
  A.demoShareScreen = () => { const m = M(); S.pop = null; if (!m.others.includes('marco')) personJoins('marco', true); m.share = { type: 'screen', by: 'marco' }; m.st.marco.mic = true; m.speaking = 'marco'; go('call'); };
  A.demoShareTable = () => { const m = M(); S.pop = null; if (!m.others.includes('marco')) personJoins('marco', true); m.share = { type: 'object', obj: 'table', by: 'marco', label: 'Table: Supplier prices' }; m.follow = true; m.st.marco.mic = true; m.speaking = 'marco'; go('call'); };
  A.demoEvents = () => {
    const m = M(); S.pop = null; go('call');
    ['marco', 'sofia'].forEach((id) => { if (!m.others.includes(id)) personJoins(id, true); });
    m.raised.marco = true; m.raised.lina = true;
    const hands = Object.keys(m.raised).filter((x) => x !== 'me' && (m.others.includes(x) || x === 'lina'));
    m.reactions.sofia = { icon: 'thumbs-up', text: 'Nice' };
    schedule(5000, () => { const c = M(); if (c) { delete c.reactions.sofia; render(); } });
    if (!m.others.includes('lina')) { m.others.push('lina'); m.st.lina = defaultSt('lina'); m.participantsSeen.add('lina'); }
    stoast({ icon: 'hand-16', title: `${hands.map((h) => P(h).name).join(' and ')}`, sub: hands.length > 1 ? 'raised their hands' : 'raised a hand', action: { label: 'View', a: 'viewPeople' }, ttl: 9000 });
    stoast({ icon: 'chat-16', title: 'Anna: Can you share the table?', sub: 'New message in chat', action: { label: 'Reply', a: 'replyChat' }, ttl: 9000 });
    m.messages.push({ id: uid(), from: 'anna', time: nowHM(), text: 'Can you share the table?' }); if (m.panel !== 'chat') m.unread++;
    if (!m.others.includes('tom')) { m.others.push('tom'); m.st.tom = defaultSt('tom'); m.participantsSeen.add('tom'); }
    stoast({ icon: 'users-16', title: 'Tom Wade joined the call', single: true, ttl: 9000 });
  };
  A.demoNetwork = () => {
    const m = M(); S.pop = null; go('call');
    if (m.network === 'poor') { m.network = 'good'; m.netBanner = false; m.poor = {}; stoast({ icon: 'wifi-14-white', title: 'Connection is stable again', single: true, ttl: 3000 }); return; }
    m.network = 'poor'; m.netBanner = true;
    if (m.others.includes('marco')) m.poor.marco = true;
  };
  A.demoReconnect = () => { const m = M(); S.pop = null; go('call'); m.pop = null; m.reconnecting = true; m.retrying = false; const k = uid(); m.recoKey = k; schedule(9000, () => { const c = C(); if (c && c.recoKey === k) reconnectDone(); }); };
  A.demoLarge = () => {
    const m = M(); S.pop = null; go('call');
    const big = ['anna', 'marco', 'sofia', 'tom', 'lina', 'dana', 'oleh', 'priya', 'eli', 'yara', 'kate', 'ivan', 'mila', 'noah', 'zoe'];
    if (m.others.length > 10) { m.others = m.others.filter((x) => ['anna', 'marco', 'sofia'].includes(x)); m.page = 0; return; }
    big.forEach((id) => { if (!m.others.includes(id)) { m.others.push(id); m.st[id] = defaultSt(id); m.participantsSeen.add(id); } });
    m.others.sort((a, b) => big.indexOf(a) - big.indexOf(b));
    ['lina', 'dana', 'oleh', 'priya', 'yara', 'kate', 'ivan', 'mila', 'noah', 'zoe'].forEach((id) => { m.st[id].mic = true; });
    m.st.tom.mic = false; m.st.eli.mic = false;
    m.layout = 'grid'; m.page = 0; m.panel = null;
  };
  A.demoHost = () => { const m = M(); S.pop = null; m.host = isHost(m) ? 'anna' : 'me'; m.panel = 'people'; go('call'); if (isHost(m) && !m.waiting.length) m.waiting = ['priya']; };
  A.demoWaiting = () => {
    const m = M(); S.pop = null; go('call');
    if (!m.waiting.includes('priya') && !m.others.includes('priya')) m.waiting.push('priya');
    if (isHost(m)) stoast({ av: 'priya', title: 'Priya Shah is waiting to join', sub: 'Guest · Brightway', action: { label: 'Admit', a: 'admit', id: 'priya' }, ttl: 9000 });
    else { stoast({ av: 'priya', title: 'Priya Shah is waiting to join', sub: 'Anna will admit her', ttl: 4000 }); schedule(3500, () => { const c = M(); if (c && c.waiting.includes('priya')) { c.waiting = c.waiting.filter((x) => x !== 'priya'); personJoins('priya'); } }); }
  };
  A.demoAlone = () => { const m = M(); S.pop = null; go('call'); m.others = []; m.share = null; m.raised = {}; m.reactions = {}; m.pinned = null; m.speaking = null; m.inviteClosed = false; m.layout = 'grid'; m.panel = null; };
  A.demoHostEnds = () => {
    const m = M(); S.pop = null;
    const hostName = P(m.host === 'me' ? 'anna' : m.host).name;
    S.summary = { id: m.id, title: m.title, channel: m.channel, duration: mmss(elapsed(m)), people: [...Array.from(m.participantsSeen).filter((x) => x !== 'me'), 'me'], recorded: m.recording, linked: m.linked, posted: false };
    if (S.summary.recorded) schedule(6000, () => { if (S.summary) S.summary.recReady = true; });
    S.inCall = false; S.meeting = null;
    S.ended = { heading: 'The host ended the call', text: `${hostName} ended ${m.title} for everyone.` };
    go('ended');
  };
  A.demoIncoming = () => { S.pop = null; S.incoming = { from: 'anna', sub: 'design-team · Call' }; };
  A.demoGuest = () => { S.pop = null; if (S.inCall) leaveMeeting(false); if (!M()) resetLive(); S.guestName = 'Alex from Brightway'; S.prejoin = { mic: true, cam: true, blur: false, blocked: false }; go('guestLink'); };
  A.demoCamBlocked = () => { S.pop = null; S.prejoin.blocked = !S.prejoin.blocked; if (S.prejoin.blocked) S.prejoin.cam = false; else S.prejoin.cam = true; if (!S.inCall && M()) { go('prejoin'); startLevels(); } };
  A.demoCallMarco = () => { S.pop = null; startCalling('marco'); };
  A.demoReset = () => { location.reload(); return false; };

  /* ============================================================== EVENTS */
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-a]');
    const inPop = ev.target.closest('[data-keep], .dpop, .lpop, .rowmenu');
    if (!inPop) {
      let changed = false;
      if (S.pop) { S.pop = null; changed = true; }
      const m = M(); if (m && (m.pop || m.rowMenu)) { m.pop = null; m.rowMenu = null; changed = true; }
      if (S.editCell !== undefined && S.editCell !== null && !ev.target.closest('.editable')) { S.editCell = null; changed = true; }
      if (changed && !a) { render(); return; }
    }
    if (!a) return;
    if (a.tagName === 'A') ev.preventDefault();
    if ((a.classList.contains("scrim") || a.classList.contains("lscrim")) && ev.target !== a) return;
    const fn = A[a.dataset.a];
    if (!fn) return;
    ev.stopPropagation();
    const r = fn(a, ev);
    if (r !== false) render();
  });

  // shell buttons
  $$('.nav [data-go], .logo').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    if (S.route === 'guestLink' || S.guestMode) return;
    const r = b.dataset.go;
    if (S.inCall && S.route === 'call') minimize();
    if (r === 'calls' && S.inCall && S.route !== 'call' && S.route === 'calls') { go('call'); render(); return; }
    go(r); render();
  }));

  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.dataset.draft) {
      if (t.dataset.draft === 'guestName') { S.guestName = t.value; const b = $('[data-a="askToJoin"]'); if (b) b.disabled = !t.value.trim(); return; }
      if (t.dataset.draft === 'notes') { M().notes = t.value; const h = $('#notesHint'); if (h) h.textContent = 'Saving…'; clearTimeout(S.notesT); S.notesT = setTimeout(() => { const hh = $('#notesHint'); if (hh) hh.textContent = M().linked ? 'Saved to the task · just now' : 'Link a task to keep these notes after the call.'; }, 700); return; }
      S.drafts[t.dataset.draft] = t.value;
      if (t.dataset.live) render();
    }
    if (t.dataset.model && S.modalData) {
      S.modalData[t.dataset.model] = t.value;
      if (t.dataset.model === 'title') { const b = $('[data-a="doSchedule"]'); if (b) b.disabled = !t.value.trim(); }
    }
  });
  document.addEventListener('change', (ev) => { const t = ev.target; if (t.dataset.model && S.modalData) S.modalData[t.dataset.model] = t.value; });
  $('.search input').addEventListener('input', (ev) => { S.search = ev.target.value; if (S.route !== 'chat' && S.search) go('chat'); render(); });

  document.addEventListener('keydown', (ev) => {
    const t = ev.target;
    const typing = !!(t.matches && t.matches('input, textarea, select'));
    if (ev.key === 'Enter' && t.matches && t.matches('input')) {
      const fk = t.dataset.fk || '';
      if (fk.startsWith('chat-')) { A.sendChat(); render(); return; }
      if (fk === 'callchat') { A.sendCallChat(); render(); return; }
      if (fk === 'cell') { D.suppliers[+t.closest('[data-id]').dataset.id].price = t.value; S.editCell = null; stoast({ icon: 'table', title: 'Saved · everyone sees the new price', single: true, ttl: 2500 }); render(); return; }
      if (fk === 'guestname') { A.askToJoin(); render(); return; }
      if ((fk === 'toq' || fk === 'spq') && S.drafts[fk]) {
        const p = Object.values(D.people).find((x) => x.name.toLowerCase().includes(S.drafts[fk].toLowerCase()));
        if (p) { (fk === 'toq' ? A.toAdd : A.spAdd)({ dataset: { id: p.id } }); render(); }
        return;
      }
    }
    if (ev.key === "Escape" && S.expanded && !S.modal && !S.leaveDialog && !S.pop && !(M() && (M().pop || M().rowMenu))) { A.fullscreen(); render(); return; }
    if (ev.key === 'Escape') {
      const m = M();
      if (S.modal) S.modal = null; else if (S.leaveDialog) S.leaveDialog = false; else if (S.pop) S.pop = null; else if (m && (m.pop || m.rowMenu)) { m.pop = null; m.rowMenu = null; } else if (m && m.panel && S.route === 'call') m.panel = null; else if (S.editCell != null) S.editCell = null; else return;
      render(); return;
    }
    if (typing || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (S.inCall && S.route === 'call') {
      const k = ev.key.toLowerCase();
      if (k === 'm') { A.toggleMic(); render(); }
      if (k === 'v') { A.toggleCam(); render(); }
      if (k === 'h') { A.toggleHand(); render(); }
    }
    if (ev.key.toLowerCase() === 'd' && S.route !== 'guestLink') { S.pop = S.pop === 'demo' ? null : 'demo'; render(); }
  });

  /* =============================================================== TIMERS */
  const timers = [];
  function schedule(ms, fn) { timers.push(setTimeout(fn, ms)); }

  setInterval(() => {
    const m = M();
    if (m) {
      $$('[data-timer="meeting"]').forEach((e) => { e.textContent = mmss(elapsed(m)); });
      $$('[data-timer="rec"]').forEach((e) => { e.textContent = mmss((Date.now() - m.recStart) / 1000); });
    }
  }, 1000);

  // active speaker simulation
  setInterval(() => {
    const m = C(); if (!m || m.reconnecting) return;
    const pool = m.others.filter((id) => m.st[id] && m.st[id].mic && !m.poor[id]);
    if (m.mic) pool.push('me');
    let next = null;
    if (m.share && m.share.by !== 'me' && pool.includes(m.share.by) && Math.random() < 0.7) next = m.share.by;
    else if (pool.length) {
      const weights = pool.map((id) => (id === 'anna' ? 4 : id === 'me' ? 1 : 2));
      let r = Math.random() * weights.reduce((x, y) => x + y, 0);
      for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) { next = pool[i]; break; } }
      if (Math.random() < 0.15) next = null;
    }
    if (next === m.speaking) return;
    m.speaking = next;
    m.captionIdx++;
    $$('.tile[data-pid]').forEach((t) => t.classList.toggle('is-speaking', t.dataset.pid === next && !t.classList.contains('is-muted')));
    if (m.cc) { const cap = $('#captions'); if (cap) { const tmp = document.createElement('div'); tmp.innerHTML = stageOverlays({ ...m, toasts: [], reconnecting: false, network: 'good', netBanner: false, guestNoticeClosed: true }); const n = tmp.querySelector('#captions'); if (n) cap.innerHTML = n.innerHTML; } }
    if (S.route === 'call' && m.layout === 'speaker' && !m.pinned && !m.share) render();
  }, 2600);

  // pre-join input level
  let lvlTimer = null;
  function startLevels() {
    clearInterval(lvlTimer);
    lvlTimer = setInterval(() => {
      const box = $('#levels'); if (!box) { if (!['prejoin', 'waiting'].includes(S.route)) clearInterval(lvlTimer); return; }
      const on = S.prejoin.mic;
      const lvl = on ? 3 + Math.floor(Math.random() * 7) : 0;
      $$('i', box).forEach((b, i) => { b.classList.toggle('on', i < lvl); b.style.height = (on && i < lvl ? 6 + Math.random() * 20 : 4 + (i % 3) * 2) + 'px'; });
    }, 140);
  }

  // occasional workspace life outside the call
  schedule(25000, () => { if (!S.inCall && S.route === 'chat' && S.chatId !== 'warehouse-ops') { S.history['warehouse-ops'].push({ from: 'tom', time: nowHM(), lines: ['Northline truck is at Dock 2 now.'] }); S.unreadChats['warehouse-ops'] = 1; render(); } });

  /* ------------------------------------------------ custom select dropdown */
  let openSel = null;
  const CHECK = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.3 4L6 11.3 2.7 8" stroke="#2b5cfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function closeSelect() {
    const d = $("#cselect"); if (d) d.remove();
    if (openSel) { const f = openSel.closest(".field"); if (f) f.classList.remove("is-open"); openSel = null; }
  }
  function openSelect(sel) {
    closeSelect();
    const field = sel.closest(".field");
    const z = parseFloat(getComputedStyle(document.body).zoom) || 1;
    const rr = field.getBoundingClientRect();
    const r = { left: rr.left / z, top: rr.top / z, bottom: rr.bottom / z, width: rr.width / z };
    const box = document.createElement("div");
    box.id = "cselect"; box.className = "cselect";
    box.style.left = r.left + "px";
    box.style.top = (r.bottom + 5) + "px";
    box.style.minWidth = r.width + "px";
    box.innerHTML = Array.from(sel.options).map((o, i) => `<button type="button" class="cselect__opt ${o.selected ? "is-selected" : ""}" data-i="${i}">${esc(o.text)}${o.selected ? CHECK : ""}</button>`).join("");
    document.body.appendChild(box);
    const vw = window.innerWidth / z;
    if (r.left + box.offsetWidth > vw - 12) box.style.left = Math.max(12, vw - 12 - box.offsetWidth) + "px";
    const below = window.innerHeight / z - r.bottom - 5;
    if (box.offsetHeight > below && r.top > box.offsetHeight + 5) box.style.top = (r.top - 5 - box.offsetHeight) + "px";
    field.classList.add("is-open");
    openSel = sel;
    const cur = box.querySelector(".is-selected"); if (cur) box.scrollTop = Math.max(0, cur.offsetTop - box.clientHeight / 2 + 20);
  }
  function pickOption(i) {
    const sel = openSel; if (!sel) return;
    sel.selectedIndex = i;
    closeSelect();
    sel.dispatchEvent(new Event("input", { bubbles: true }));
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }
  document.addEventListener("mousedown", (ev) => {
    const sel = ev.target.closest(".field select");
    if (sel) { ev.preventDefault(); sel.focus(); if (openSel === sel) closeSelect(); else openSelect(sel); return; }
    const opt = ev.target.closest(".cselect__opt");
    if (opt) { ev.preventDefault(); pickOption(+opt.dataset.i); return; }
    if (!ev.target.closest("#cselect")) closeSelect();
  }, true);
  document.addEventListener("keydown", (ev) => {
    const sel = ev.target.closest && ev.target.closest(".field select");
    if (!sel) return;
    const keys = [" ", "Enter", "ArrowDown", "ArrowUp", "Escape"];
    if (!keys.includes(ev.key)) return;
    ev.preventDefault(); ev.stopPropagation();
    if (!openSel) { if (ev.key !== "Escape") openSelect(sel); return; }
    const opts = $$(".cselect__opt");
    let f = opts.findIndex((o) => o.classList.contains("is-focus"));
    if (f < 0) f = opts.findIndex((o) => o.classList.contains("is-selected"));
    if (ev.key === "Escape") { closeSelect(); return; }
    if (ev.key === "Enter" || ev.key === " ") { pickOption(Math.max(0, f)); return; }
    f = Math.min(opts.length - 1, Math.max(0, f + (ev.key === "ArrowDown" ? 1 : -1)));
    opts.forEach((o, i) => o.classList.toggle("is-focus", i === f));
    { const bx = $("#cselect"), o = opts[f]; if (o.offsetTop < bx.scrollTop) bx.scrollTop = o.offsetTop - 6; else if (o.offsetTop + o.offsetHeight > bx.scrollTop + bx.clientHeight) bx.scrollTop = o.offsetTop + o.offsetHeight - bx.clientHeight + 6; }
  }, true);
  window.addEventListener("resize", closeSelect);
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && S.expanded) { S.expanded = false; render(); } });
  document.addEventListener("scroll", (e) => { if (e.target && e.target.id === "cselect") return; closeSelect(); }, true);
  const _render = render;
  render = function () { closeSelect(); _render(); };

  render();
})();
