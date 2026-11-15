/* Mock workspace data for the Tandem calls prototype. */
window.DATA = {
  me: { id: 'nina', name: 'Nina Park', short: 'Nina', initials: 'NP', color: '#4a505c', photo: 'assets/img/nina.png', email: 'nina@northwind.com', dept: 'Design' },

  people: {
    anna:  { id: 'anna',  name: 'Anna Kovalenko', short: 'Anna',  initials: 'AK', color: '#b4402b', photo: 'assets/img/anna.png',  dept: 'Design' },
    marco: { id: 'marco', name: 'Marco Reyes',    short: 'Marco', initials: 'MR', color: '#7a4a9e', photo: null,                   dept: 'Procurement' },
    sofia: { id: 'sofia', name: 'Sofia Kline',    short: 'Sofia', initials: 'SK', color: '#1e7836', photo: 'assets/img/sofia.png', dept: 'Procurement' },
    tom:   { id: 'tom',   name: 'Tom Wade',       short: 'Tom',   initials: 'TW', color: '#8a5a00', photo: null, dept: 'Warehouse' },
    lina:  { id: 'lina',  name: 'Lina Boyd',      short: 'Lina',  initials: 'LB', color: '#2b5cfa', photo: null, dept: 'Design' },
    dana:  { id: 'dana',  name: 'Dana Ives',      short: 'Dana',  initials: 'DI', color: '#2f6f9f', photo: null, dept: 'Design' },
    oleh:  { id: 'oleh',  name: 'Oleh Kravets',   short: 'Oleh',  initials: 'OK', color: '#9a4f7a', photo: null, dept: 'Finance' },
    priya: { id: 'priya', name: 'Priya Shah',     short: 'Priya', initials: 'PS', color: '#5c7a2e', photo: null, dept: 'Brightway', guest: true },
    eli:   { id: 'eli',   name: 'Eli Moss',       short: 'Eli',   initials: 'EM', color: '#b0562a', photo: null, dept: 'Warehouse' },
    yara:  { id: 'yara',  name: 'Yara Tse',       short: 'Yara',  initials: 'YT', color: '#3f6a8a', photo: null, dept: 'Finance' },
    kate:  { id: 'kate',  name: 'Kate Moran',     short: 'Kate',  initials: 'KM', color: '#7a4a9e', photo: null, dept: 'Design' },
    ivan:  { id: 'ivan',  name: 'Ivan Petrenko',  short: 'Ivan',  initials: 'IP', color: '#2f6f9f', photo: null, dept: 'Warehouse' },
    mila:  { id: 'mila',  name: 'Mila Hart',      short: 'Mila',  initials: 'MH', color: '#b4402b', photo: null, dept: 'Sales' },
    noah:  { id: 'noah',  name: 'Noah Lind',      short: 'Noah',  initials: 'NL', color: '#5c7a2e', photo: null, dept: 'Finance' },
    zoe:   { id: 'zoe',   name: 'Zoe Akers',      short: 'Zoe',   initials: 'ZA', color: '#8a5a00', photo: null, dept: 'Sales' },
  },

  meeting: {
    title: 'Design review: order status',
    short: 'Design review',
    channel: 'design-team',
    link: 'tandem.app/c/dsg-4821',
    task: {
      title: 'Order status redesign',
      status: 'In progress',
      due: 'Due Nov 12',
      assignee: 'anna',
      checklist: [
        { text: 'Review comments from design', done: true },
        { text: 'Update order status labels', done: false },
        { text: 'Share the final screens', done: false },
      ],
    },
    notes: 'Pricing: check Brightway Foils lead time (9 days) with Marco before Thursday.',
  },

  chatMessages: [
    { from: 'anna',  time: '11:21', text: 'Sharing the comments in a second. Sofia, can you take notes?' },
    { from: 'sofia', time: '11:21', text: 'Yes, on it.' },
    { from: 'marco', time: '11:23', text: 'Can you open the supplier table when we get to pricing?' },
    { from: 'me',    time: '11:24', text: 'Sure, I will share it from Tables.' },
  ],

  suppliers: [
    { name: 'Northline Pallets', sku: 'PL-1200', price: '$14.20',  lead: '5 days', status: 'Active' },
    { name: 'Harbor Packaging',  sku: 'PK-0455', price: '$2.85',   lead: '3 days', status: 'Active' },
    { name: 'Brightway Foils',   sku: 'FL-0310', price: '$6.40',   lead: '9 days', status: 'Review', cursor: 'Marco' },
    { name: 'Kestrel Freight',   sku: 'FR-2008', price: '$118.00', lead: '2 days', status: 'Active' },
    { name: 'Lumen Labels',      sku: 'LB-0771', price: '$0.42',   lead: '4 days', status: 'Review' },
    { name: 'Oakridge Straps',   sku: 'ST-0090', price: '$1.15',   lead: '6 days', status: 'Active' },
    { name: 'Summit Crates',     sku: 'CR-0612', price: '$22.60',  lead: '7 days', status: 'Active' },
  ],

  chats: [
    { id: 'design-team',   kind: 'channel', name: 'design-team',   color: '#741def', last: 'Anna started a call', time: '', members: 12 },
    { id: 'warehouse-ops', kind: 'channel', name: 'warehouse-ops', color: '#1e7836', last: 'Dock 4 is free after 14:00', time: '09:41', members: 8 },
    { id: 'marco',         kind: 'dm', person: 'marco', last: 'Sent the supplier table', time: '09:12' },
    { id: 'finance-ops',   kind: 'channel', name: 'finance-ops',   color: '#8a5a00', last: 'Invoice batch approved', time: 'Yesterday', members: 6 },
    { id: 'sofia',         kind: 'dm', person: 'sofia', last: 'Thanks, see you then', time: 'Mon' },
  ],

  channelHistory: {
    'design-team': [
      { from: 'anna',  time: '10:02', lines: ['Draft of the order status screen is in Files. Can we review it today?', 'I added comments on the pricing table.'], reaction: 2 },
      { from: 'marco', time: '10:05', lines: ['Yes. After standup works for me.'] },
      { from: 'anna',  time: '11:20', lines: ['Starting a call to go through the comments.'] },
      { from: 'me',    time: '11:22', lines: ['Great, joining in a minute.'] },
    ],
    'warehouse-ops': [
      { from: 'tom', time: '09:38', lines: ['Truck from Northline is 20 minutes late.'] },
      { from: 'eli', time: '09:41', lines: ['Dock 4 is free after 14:00'] },
    ],
    'marco': [
      { from: 'marco', time: '09:10', lines: ['Here are the latest supplier prices for Q4.'] },
      { from: 'marco', time: '09:12', lines: ['Sent the supplier table'] },
    ],
    'finance-ops': [
      { from: 'yara', time: 'Yesterday', lines: ['Invoice batch approved'] },
    ],
    'sofia': [
      { from: 'sofia', time: '11:30', lines: ['Thanks, see you then.'] },
    ],
  },
};
