// Simple script to run the seed-test-data tool logic
const BASE_URL = 'http://127.0.0.1:8000';

async function apiCall(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data };
}

async function main() {
  console.log('=== Seed Test Data ===\n');

  // 1. Update owner settings
  console.log('1. Updating owner settings...');
  const settings = await apiCall('PATCH', '/api/owner/settings', {
    name: 'Владелец',
    workDayStart: '09:00',
    workDayEnd: '19:00',
  });
  console.log(`   Status: ${settings.status}`);
  console.log(`   Data: ${JSON.stringify(settings.data)}\n`);

  // 2. List existing event types
  console.log('2. Listing existing event types...');
  const listResp = await apiCall('GET', '/api/event-types');
  console.log(`   Status: ${listResp.status}`);
  console.log(`   Found: ${listResp.data?.length || 0} types`);
  listResp.data?.forEach(et => {
    console.log(`   - ${et.name} (${et.durationMinutes}min)`);
  });
  console.log();

  // 3. Create event types (if not exist)
  const eventTypes = [
    { name: 'Знакомство', description: 'Звонок ознакомительный', durationMinutes: 15 },
    { name: 'Консультация', description: 'Полноценная консультация', durationMinutes: 30 },
  ];

  for (const et of eventTypes) {
    const existing = listResp.data?.find(e => e.durationMinutes === et.durationMinutes);
    if (existing) {
      console.log(`3. Skipping ${et.name} - already exists (${existing.id})`);
      continue;
    }

    console.log(`3. Creating ${et.name}...`);
    const createResp = await apiCall('POST', '/api/owner/event-types', et);
    console.log(`   Status: ${createResp.status}`);
    if (createResp.status === 409) {
      console.log(`   Note: DUPLICATE_DURATION - type already exists\n`);
    } else {
      console.log(`   Created: ${JSON.stringify(createResp.data)}\n`);
    }
  }

  // 4. Refresh event types
  console.log('4. Refreshing event types...');
  const refreshed = await apiCall('GET', '/api/event-types');
  console.log(`   Status: ${refreshed.status}`);
  console.log(`   Found: ${refreshed.data?.length || 0} types`);
  refreshed.data?.forEach(et => {
    console.log(`   - ${et.name} (${et.durationMinutes}min) [${et.id}]`);
  });
  console.log();

  // 5. Create test booking for today
  console.log('5. Creating test booking for today...');
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const bookingType = refreshed.data?.find(et => et.durationMinutes === 15) || refreshed.data?.[0];
  if (!bookingType) {
    console.log('   ERROR: No event types found!');
    return;
  }

  console.log(`   Using type: ${bookingType.name} (${bookingType.durationMinutes}min)`);
  console.log(`   Type ID: ${bookingType.id}`);

  // Get slots for today
  const slotsResp = await apiCall('GET', `/api/slots?eventTypeId=${bookingType.id}&startDate=${dateStr}&endDate=${dateStr}`);
  console.log(`   Slots status: ${slotsResp.status}`);
  console.log(`   Found: ${slotsResp.data?.length || 0} slots for today`);

  const freeSlots = slotsResp.data?.filter(s => !s.isBooked) || [];
  console.log(`   Free slots: ${freeSlots.length}`);

  if (freeSlots.length === 0) {
    console.log('   No free slots found, trying fallback...');
    // Try a specific time
    const fallbackTime = `${dateStr}T09:00:00`;
    const bookingResp = await apiCall('POST', '/api/bookings', {
      eventTypeId: bookingType.id,
      guestName: 'Тестовый пользователь',
      guestEmail: 'test@example.com',
      startAt: fallbackTime,
    });
    console.log(`   Booking status: ${bookingResp.status}`);
    console.log(`   Booking: ${JSON.stringify(bookingResp.data)}`);
  } else {
    // Book the first free slot
    const slot = freeSlots[0];
    console.log(`   Booking slot: ${slot.startAt}`);
    
    const bookingResp = await apiCall('POST', '/api/bookings', {
      eventTypeId: bookingType.id,
      guestName: 'Тестовый пользователь',
      guestEmail: 'test@example.com',
      startAt: slot.startAt,
    });
    console.log(`   Booking status: ${bookingResp.status}`);
    console.log(`   Booking: ${JSON.stringify(bookingResp.data)}`);
  }

  console.log('\n=== Seed Complete ===');
}

main().catch(console.error);
