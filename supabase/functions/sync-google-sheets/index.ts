import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProjectData {
  id: string;
  name: string;
  description: string;
  location: string;
  total_budget: number;
  created_at: string;
}

interface PartnerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_contribution: number;
  status: string;
}

interface UnitData {
  id: string;
  name: string;
  type: string;
  budget: number;
  status: string;
  completion_date: string;
}

interface PurchaseData {
  id: string;
  date: string;
  category: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  unit_name?: string;
  partner_name?: string;
}

async function getGoogleAccessToken(serviceAccountJson: any) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountJson.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Create JWT header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  // Create JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
  
  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new Uint8Array(atob(serviceAccountJson.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '')).split('').map(c => c.charCodeAt(0))),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
  const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function clearAndWriteSheet(accessToken: string, spreadsheetId: string, sheetName: string, data: any[][]) {
  // Clear existing data
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:clear`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  // Write new data
  const range = `${sheetName}!A1:${String.fromCharCode(65 + data[0].length - 1)}${data.length}`;
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: data,
    }),
  });
}

async function createSheetIfNotExists(accessToken: string, spreadsheetId: string, sheetName: string) {
  try {
    // Get existing sheets
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    const spreadsheet = await response.json();
    const existingSheets = spreadsheet.sheets.map((sheet: any) => sheet.properties.title);
    
    if (!existingSheets.includes(sheetName)) {
      // Create new sheet
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          }],
        }),
      });
    }
  } catch (error) {
    console.error(`Error creating sheet ${sheetName}:`, error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, spreadsheetId } = await req.json();
    
    if (!projectId || !spreadsheetId) {
      throw new Error('Missing projectId or spreadsheetId');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching project data...');

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // Fetch partners
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('*')
      .eq('project_id', projectId);

    if (partnersError) throw partnersError;

    // Fetch units
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('*')
      .eq('project_id', projectId);

    if (unitsError) throw unitsError;

    // Fetch purchases with unit and partner names
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select(`
        *,
        units(name),
        partners(name)
      `)
      .eq('project_id', projectId);

    if (purchasesError) throw purchasesError;

    console.log('Data fetched successfully. Setting up Google Sheets API...');

    // Get Google Service Account credentials
    const serviceAccountJson = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON')!);
    const accessToken = await getGoogleAccessToken(serviceAccountJson);

    console.log('Google API authentication successful. Creating sheets...');

    // Create sheets if they don't exist
    await Promise.all([
      createSheetIfNotExists(accessToken, spreadsheetId, 'Project Info'),
      createSheetIfNotExists(accessToken, spreadsheetId, 'Partners'),
      createSheetIfNotExists(accessToken, spreadsheetId, 'Units'),
      createSheetIfNotExists(accessToken, spreadsheetId, 'Purchases'),
      createSheetIfNotExists(accessToken, spreadsheetId, 'Summary'),
    ]);

    // Prepare data for each sheet
    const projectData = [
      ['Field', 'Value'],
      ['Project Name', project.name || ''],
      ['Description', project.description || ''],
      ['Location', project.location || ''],
      ['Total Budget', project.total_budget || 0],
      ['Created Date', project.created_at ? new Date(project.created_at).toLocaleDateString() : ''],
      ['Last Updated', new Date().toLocaleDateString()],
    ];

    const partnersData = [
      ['Name', 'Email', 'Phone', 'Total Contribution', 'Status'],
      ...partners.map((partner: PartnerData) => [
        partner.name || '',
        partner.email || '',
        partner.phone || '',
        partner.total_contribution || 0,
        partner.status || '',
      ]),
    ];

    const unitsData = [
      ['Name', 'Type', 'Budget', 'Status', 'Completion Date'],
      ...units.map((unit: UnitData) => [
        unit.name || '',
        unit.type || '',
        unit.budget || 0,
        unit.status || '',
        unit.completion_date ? new Date(unit.completion_date).toLocaleDateString() : '',
      ]),
    ];

    const purchasesData = [
      ['Date', 'Category', 'Description', 'Unit', 'Partner', 'Quantity', 'Unit Price', 'Total Cost'],
      ...purchases.map((purchase: any) => [
        purchase.date ? new Date(purchase.date).toLocaleDateString() : '',
        purchase.category || '',
        purchase.description || '',
        purchase.units?.name || '',
        purchase.partners?.name || '',
        purchase.quantity || 0,
        purchase.unit_price || 0,
        purchase.total_cost || 0,
      ]),
    ];

    // Calculate summary data
    const totalSpent = purchases.reduce((sum: number, p: any) => sum + (p.total_cost || 0), 0);
    const totalBudget = project.total_budget || 0;
    const remainingBudget = totalBudget - totalSpent;
    const budgetUsedPercentage = totalBudget > 0 ? (totalSpent / totalBudget * 100).toFixed(2) : '0.00';

    const summaryData = [
      ['Metric', 'Value'],
      ['Total Budget', totalBudget],
      ['Total Spent', totalSpent],
      ['Remaining Budget', remainingBudget],
      ['Budget Used (%)', `${budgetUsedPercentage}%`],
      ['Number of Partners', partners.length],
      ['Number of Units', units.length],
      ['Number of Purchases', purchases.length],
      ['Last Sync', new Date().toISOString()],
    ];

    console.log('Writing data to sheets...');

    // Write data to all sheets
    await Promise.all([
      clearAndWriteSheet(accessToken, spreadsheetId, 'Project Info', projectData),
      clearAndWriteSheet(accessToken, spreadsheetId, 'Partners', partnersData),
      clearAndWriteSheet(accessToken, spreadsheetId, 'Units', unitsData),
      clearAndWriteSheet(accessToken, spreadsheetId, 'Purchases', purchasesData),
      clearAndWriteSheet(accessToken, spreadsheetId, 'Summary', summaryData),
    ]);

    console.log('Sync completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully synced to Google Sheets',
        synced: {
          project: project.name,
          partners: partners.length,
          units: units.length,
          purchases: purchases.length,
          sheets: ['Project Info', 'Partners', 'Units', 'Purchases', 'Summary'],
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in sync-google-sheets function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Check the function logs for more information',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});