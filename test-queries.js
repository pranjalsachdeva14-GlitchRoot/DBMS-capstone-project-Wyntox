// test-queries.js
const { getDatabase } = require('./db');

const db = getDatabase();

console.log('--- Testing Query 1: Category Sales ---');
const q1 = db.prepare(`SELECT category_name, SUM(units_sold) AS units_sold, SUM(revenue) AS revenue FROM v_product_sales GROUP BY category_name ORDER BY revenue DESC;`).all();
console.table(q1);

console.log('--- Testing Query 2: Window Functions ---');
const q2 = db.prepare(`SELECT product_name, category_name, units_sold, revenue, RANK() OVER (ORDER BY revenue DESC) AS revenue_rank, DENSE_RANK() OVER (ORDER BY units_sold DESC) AS units_rank, ROW_NUMBER() OVER (ORDER BY revenue DESC, product_id) AS sales_position FROM v_product_sales ORDER BY revenue_rank, product_name;`).all();
console.table(q2.slice(0, 5));

console.log('--- Testing Query 3: CTE Customer Spend ---');
const q3 = db.prepare(`WITH customer_spend AS (
    SELECT customer_id, first_name, last_name, city, total_orders, total_spent
    FROM v_customer_summary
    WHERE total_orders > 0
)
SELECT customer_id, first_name, last_name, city, total_orders, total_spent,
       RANK() OVER (ORDER BY total_spent DESC) AS spend_rank,
       ROUND(total_spent * 100.0 / SUM(total_spent) OVER (), 2) AS revenue_share_percent
FROM customer_spend
ORDER BY spend_rank
LIMIT 5;`).all();
console.table(q3);

console.log('--- Testing Query 4: Set Operations (INTERSECT) ---');
const q4 = db.prepare(`SELECT customer_id, first_name, last_name
FROM v_customer_purchases
WHERE category_name = 'Electronics'
INTERSECT
SELECT customer_id, first_name, last_name
FROM v_customer_purchases
WHERE category_name = 'Home and Kitchen'
ORDER BY customer_id;`).all();
console.table(q4);

console.log('All test queries passed successfully!');
