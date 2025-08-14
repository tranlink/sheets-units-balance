import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Project {
  id: string;
  name: string;
  description?: string;
  total_budget: number;
  location?: string;
  categories: string[];
  created_at: string;
  updated_at: string;
}

interface Partner {
  id: string;
  project_id: string;
  name: string;
  email?: string;
  phone?: string;
  total_contribution: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Unit {
  id: string;
  project_id: string;
  name: string;
  type: string;
  budget: number;
  status: string;
  partner_id?: string;
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

interface Purchase {
  id: string;
  project_id: string;
  unit_id?: string;
  partner_id?: string;
  date: string;
  category: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Google Sheets sync function');
    
    const { projectId, spreadsheetId } = await req.json();
    console.log('Request data:', { projectId, spreadsheetId });

    if (!projectId || !spreadsheetId) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Project ID and Spreadsheet ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Google Service Account credentials from secrets
    const googleCredentials = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    console.log('Google credentials check:', { 
      hasCredentials: !!googleCredentials,
      credentialsLength: googleCredentials?.length || 0
    });
    
    if (!googleCredentials) {
      console.error('Google Service Account credentials not found');
      return new Response(
        JSON.stringify({ error: 'Google Service Account credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let credentials;
    try {
      credentials = JSON.parse(googleCredentials);
      console.log('Successfully parsed Google credentials, client_email:', credentials.client_email);
    } catch (e) {
      console.error('Failed to parse Google credentials:', e.message);
      return new Response(
        JSON.stringify({ error: 'Invalid Google Service Account credentials format' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Test: Just return success for now to see if we get this far
    console.log('Reached test point - returning success');
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test successful - basic setup working',
        debug: {
          projectId,
          spreadsheetId,
          hasCredentials: true,
          clientEmail: credentials.client_email
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

    // Fetch data from Supabase
    console.log('Fetching project data for:', projectId);
    
    const [projectRes, partnersRes, unitsRes, purchasesRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('partners').select('*').eq('project_id', projectId),
      supabase.from('units').select('*').eq('project_id', projectId),
      supabase.from('purchases').select('*').eq('project_id', projectId)
    ]);

    if (projectRes.error) {
      console.error('Error fetching project:', projectRes.error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch project data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const project: Project = projectRes.data;
    const partners: Partner[] = partnersRes.data || [];
    const units: Unit[] = unitsRes.data || [];
    const purchases: Purchase[] = purchasesRes.data || [];

    console.log('Data fetched successfully:', {
      projectName: project.name,
      partnersCount: partners.length,
      unitsCount: units.length,
      purchasesCount: purchases.length
    });

    // Get access token using Google Service Account
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      "iss": credentials.client_email,
      "scope": "https://www.googleapis.com/auth/spreadsheets",
      "aud": "https://oauth2.googleapis.com/token",
      "exp": now + 3600,
      "iat": now
    };

    // Create JWT manually using Web Crypto API
    const header = { "alg": "RS256", "typ": "JWT" };
    
    const textEncoder = new TextEncoder();
    const headerEncoded = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const payloadEncoded = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const unsignedToken = `${headerEncoded}.${payloadEncoded}`;
    
    // Import private key
    const privateKeyPem = credentials.private_key;
    const privateKeyDer = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    const privateKeyBytes = Uint8Array.from(atob(privateKeyDer), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Sign the token
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      textEncoder.encode(unsignedToken)
    );

    const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const jwt = `${unsignedToken}.${signatureEncoded}`;

    console.log('JWT created successfully');

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': jwt,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with Google APIs' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Access token obtained successfully');

    // Format data for Google Sheets
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US');
    };

    const formatCurrency = (amount: number) => {
      return `${amount.toLocaleString()} EGP`;
    };

    // Prepare data for each sheet
    const sheetsData = [
      {
        range: 'Project!A1',
        values: [
          ['Project Information'],
          ['Name', project.name],
          ['Description', project.description || 'N/A'],
          ['Total Budget', formatCurrency(project.total_budget)],
          ['Location', project.location || 'N/A'],
          ['Categories', project.categories.join(', ')],
          ['Created', formatDate(project.created_at)],
          ['Last Updated', formatDate(project.updated_at)],
          [],
          ['Summary'],
          ['Total Partners', partners.length],
          ['Total Units', units.length],
          ['Total Purchases', purchases.length],
          ['Total Spent', formatCurrency(purchases.reduce((sum, p) => sum + p.total_cost, 0))],
          ['Remaining Budget', formatCurrency(project.total_budget - purchases.reduce((sum, p) => sum + p.total_cost, 0))]
        ]
      },
      {
        range: 'Partners!A1',
        values: [
          ['ID', 'Name', 'Email', 'Phone', 'Contribution', 'Status', 'Created', 'Updated'],
          ...partners.map(p => [
            p.id,
            p.name,
            p.email || 'N/A',
            p.phone || 'N/A',
            formatCurrency(p.total_contribution),
            p.status,
            formatDate(p.created_at),
            formatDate(p.updated_at)
          ])
        ]
      },
      {
        range: 'Units!A1',
        values: [
          ['ID', 'Name', 'Type', 'Budget', 'Status', 'Partner', 'Completion Date', 'Created', 'Updated'],
          ...units.map(u => [
            u.id,
            u.name,
            u.type,
            formatCurrency(u.budget),
            u.status,
            u.partner_id ? partners.find(p => p.id === u.partner_id)?.name || 'N/A' : 'N/A',
            u.completion_date ? formatDate(u.completion_date) : 'N/A',
            formatDate(u.created_at),
            formatDate(u.updated_at)
          ])
        ]
      },
      {
        range: 'Purchases!A1',
        values: [
          ['ID', 'Date', 'Category', 'Description', 'Unit', 'Partner', 'Quantity', 'Unit Price', 'Total Cost', 'Receipt', 'Created', 'Updated'],
          ...purchases.map(p => [
            p.id,
            formatDate(p.date),
            p.category,
            p.description,
            p.unit_id ? units.find(u => u.id === p.unit_id)?.name || 'N/A' : 'N/A',
            p.partner_id ? partners.find(pr => pr.id === p.partner_id)?.name || 'N/A' : 'N/A',
            p.quantity,
            formatCurrency(p.unit_price),
            formatCurrency(p.total_cost),
            p.receipt_url || 'N/A',
            formatDate(p.created_at),
            formatDate(p.updated_at)
          ])
        ]
      }
    ];

    // Update all sheets with data
    const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: sheetsData
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Google Sheets update failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to update Google Sheets' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully updated Google Sheets');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data successfully synced to Google Sheets',
        updatedSheets: ['Project', 'Partners', 'Units', 'Purchases']
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in sync-google-sheets function:', error);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});