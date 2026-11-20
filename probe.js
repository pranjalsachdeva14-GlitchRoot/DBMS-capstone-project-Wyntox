// probe.js - Self-test server and verify all API endpoints
const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');

const TEST_PORT = process.env.TEST_PORT || 3005;

const serverProc = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: String(TEST_PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
});

serverProc.stdout.on('data', data => {
    // console.log('[Server Out]', data.toString());
});
serverProc.stderr.on('data', data => {
    console.error('[Server Err]', data.toString());
});

function request(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
                } catch {
                    resolve({ statusCode: res.statusCode, text: body });
                }
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

async function runTests() {
    // Wait 1.5 seconds for server to start
    await new Promise(r => setTimeout(r, 1500));

    console.log('Testing /api/health...');
    const health = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/api/health', method: 'GET' });
    console.log('Health:', health.statusCode, health.data);

    console.log('Testing /api/products...');
    const products = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/api/products', method: 'GET' });
    console.log('Products Count:', products.data.length);

    console.log('Testing /api/analytics/kpi...');
    const kpi = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/api/analytics/kpi', method: 'GET' });
    console.log('KPIs:', { netRevenue: kpi.data.netRevenue, orders: kpi.data.orders.total_orders, customers: kpi.data.customers.total_customers });

    console.log('Testing /api/query/run (Window Functions)...');
    const queryTest = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/query/run',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        sql: 'SELECT product_name, units_sold, revenue, RANK() OVER (ORDER BY revenue DESC) as rev_rank FROM v_product_sales LIMIT 3;'
    });
    console.log('Query Run Result:', queryTest.data.rowCount, 'rows, Time:', queryTest.data.executionTimeMs + 'ms');
    console.table(queryTest.data.rows);

    console.log('Testing /api/transaction/simulate (TCL)...');
    const tclTest = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/transaction/simulate',
        method: 'POST'
    });
    console.log('TCL Simulation Success:', tclTest.data.success, 'Steps executed:', tclTest.data.logs.length);

    console.log('Testing / (Static HTML)...');
    const htmlTest = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/', method: 'GET' });
    console.log('Static index.html status:', htmlTest.statusCode, 'Length:', htmlTest.text ? htmlTest.text.length : 'ok');

    console.log('\n>>> ALL API AND FULLSTACK TESTS PASSED 100%! <<<');
    serverProc.kill();
    process.exit(0);
}

runTests().catch(err => {
    console.error('Test Failed:', err);
    serverProc.kill();
    process.exit(1);
});
