// queries.js - Predefined Capstone SQL Queries Catalog
module.exports = [
    {
        id: 'q1_order_line_items',
        category: 'Joins & Basic Retrieval',
        title: 'Order Line Items & Line Totals',
        description: 'INNER JOIN across orders, customers, order_items, and products to compute line totals.',
        sql: `SELECT o.order_id,
       o.order_date,
       c.first_name,
       c.last_name,
       p.product_name,
       oi.quantity,
       oi.unit_price,
       oi.quantity * oi.unit_price AS line_total
FROM orders o
INNER JOIN customers c ON c.customer_id = o.customer_id
INNER JOIN order_items oi ON oi.order_id = o.order_id
INNER JOIN products p ON p.product_id = oi.product_id
ORDER BY o.order_id, p.product_name;`
    },
    {
        id: 'q2_order_totals_payments',
        category: 'Joins & Basic Retrieval',
        title: 'Order Totals with Payment Audit',
        description: 'INNER JOIN between analytical view v_order_totals, customers, and payments to inspect net amounts vs payments.',
        sql: `SELECT t.order_id,
       c.first_name,
       c.last_name,
       t.order_date,
       t.order_status,
       t.discount_code,
       t.gross_amount,
       t.net_amount,
       p.payment_method,
       p.payment_status
FROM v_order_totals t
INNER JOIN customers c ON c.customer_id = t.customer_id
INNER JOIN payments p ON p.order_id = t.order_id
ORDER BY t.order_id, p.payment_id;`
    },
    {
        id: 'q3_failed_pending_payments',
        category: 'Joins & Basic Retrieval',
        title: 'Failed & Pending Payments Audit',
        description: 'Identifies all orders with payment status Failed or Pending for customer follow-up.',
        sql: `SELECT p.payment_id,
       p.order_id,
       c.first_name,
       c.last_name,
       p.payment_method,
       p.amount,
       p.payment_status
FROM payments p
INNER JOIN orders o ON o.order_id = p.order_id
INNER JOIN customers c ON c.customer_id = o.customer_id
WHERE p.payment_status IN ('Failed', 'Pending')
ORDER BY p.payment_id;`
    },
    {
        id: 'q4_payment_methods_summary',
        category: 'Aggregations & Grouping',
        title: 'Payment Method Performance Summary',
        description: 'Aggregates completed payments count, total collected revenue, and average transaction size by payment method.',
        sql: `SELECT payment_method,
       COUNT(*) AS completed_payments,
       SUM(amount) AS total_collected,
       ROUND(AVG(amount), 2) AS average_payment
FROM payments
WHERE payment_status = 'Completed'
GROUP BY payment_method
ORDER BY total_collected DESC;`
    },
    {
        id: 'q5_category_sales_revenue',
        category: 'Aggregations & Grouping',
        title: 'Category Sales & Revenue',
        description: 'Aggregates units sold and total revenue per category from v_product_sales.',
        sql: `SELECT category_name,
       SUM(units_sold) AS units_sold,
       SUM(revenue) AS revenue
FROM v_product_sales
GROUP BY category_name
ORDER BY revenue DESC;`
    },
    {
        id: 'q6_deliveries_in_transit',
        category: 'Logistics & Deliveries',
        title: 'Active Shipments In Transit',
        description: 'Tracks pending in-transit deliveries with courier partner, customer location, and dispatch date.',
        sql: `SELECT d.delivery_id,
       d.order_id,
       c.first_name,
       c.last_name,
       c.city,
       d.courier_name,
       d.shipped_date
FROM deliveries d
INNER JOIN orders o ON o.order_id = d.order_id
INNER JOIN customers c ON c.customer_id = o.customer_id
WHERE d.delivery_status = 'In Transit'
ORDER BY d.shipped_date;`
    },
    {
        id: 'q7_courier_breakdown',
        category: 'Logistics & Deliveries',
        title: 'Courier Partner Delivery Breakdown',
        description: 'Calculates courier volume segmented by delivery status (In Transit vs Delivered).',
        sql: `SELECT courier_name,
       delivery_status,
       COUNT(*) AS total_deliveries
FROM deliveries
GROUP BY courier_name, delivery_status
ORDER BY courier_name, delivery_status;`
    },
    {
        id: 'q8_low_stock_reorder',
        category: 'Inventory Management',
        title: 'Low Stock Reorder Alert with Demand',
        description: 'Identifies inventory where stock_quantity <= reorder_level sorted by historical sales units.',
        sql: `SELECT p.product_id,
       p.product_name,
       i.stock_quantity,
       i.reorder_level,
       s.units_sold
FROM inventory i
INNER JOIN products p ON p.product_id = i.product_id
INNER JOIN v_product_sales s ON s.product_id = p.product_id
WHERE i.stock_quantity <= i.reorder_level
ORDER BY s.units_sold DESC;`
    },
    {
        id: 'q9_discount_usage',
        category: 'Marketing & Promotions',
        title: 'Discount Code Usage & Popularity',
        description: 'LEFT JOIN to quantify total orders that redeemed each discount code.',
        sql: `SELECT d.discount_code,
       d.discount_rate,
       COUNT(o.order_id) AS orders_using_code
FROM discounts d
LEFT JOIN orders o ON o.discount_id = d.discount_id
GROUP BY d.discount_id, d.discount_code, d.discount_rate
ORDER BY orders_using_code DESC;`
    },
    {
        id: 'q10_inactive_customers',
        category: 'Customer Intelligence',
        title: 'Inactive Registered Customers (Zero Orders)',
        description: 'Finds customers who registered but have never placed any orders via LEFT JOIN.',
        sql: `SELECT c.customer_id,
       c.first_name,
       c.last_name,
       c.city,
       c.registration_date
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_id IS NULL
ORDER BY c.customer_id;`
    },
    {
        id: 'q11_unsold_products',
        category: 'Catalog & Products',
        title: 'Unsold Products in Catalog',
        description: 'LEFT JOIN from products to order_items to pinpoint items that have never been purchased.',
        sql: `SELECT p.product_id,
       p.product_name,
       p.unit_price
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.product_id
WHERE oi.order_id IS NULL
ORDER BY p.product_id;`
    },
    {
        id: 'q12_category_product_counts',
        category: 'Catalog & Products',
        title: 'Product Catalog Count per Category',
        description: 'Counts total active catalog products grouped by category.',
        sql: `SELECT c.category_name,
       COUNT(p.product_id) AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.category_id
GROUP BY c.category_id, c.category_name
ORDER BY product_count DESC, c.category_name;`
    },
    {
        id: 'q13_unassigned_deliveries',
        category: 'Logistics & Deliveries',
        title: 'Orders Without Courier Delivery Records (RIGHT JOIN)',
        description: 'Identifies orders that do not yet have a matching entry in deliveries.',
        sql: `SELECT o.order_id,
       o.order_date,
       o.order_status,
       d.delivery_id
FROM deliveries d
RIGHT JOIN orders o ON o.order_id = d.order_id
WHERE d.delivery_id IS NULL
ORDER BY o.order_id;`
    },
    {
        id: 'q14_same_city_customers',
        category: 'Advanced Joins',
        title: 'Customer Pairs in Same City (SELF JOIN)',
        description: 'Uses a SELF JOIN on customers to pair individuals living in the same city without duplication.',
        sql: `SELECT c1.city,
       c1.customer_id AS first_customer_id,
       c1.first_name AS first_customer_name,
       c2.customer_id AS second_customer_id,
       c2.first_name AS second_customer_name
FROM customers c1
INNER JOIN customers c2 ON c1.city = c2.city AND c1.customer_id < c2.customer_id
ORDER BY c1.city, c1.customer_id, c2.customer_id;`
    },
    {
        id: 'q15_category_price_comparisons',
        category: 'Advanced Joins',
        title: 'Product Price Comparisons Within Category (SELF JOIN)',
        description: 'SELF JOIN on products within the same category to find higher and lower priced pairs.',
        sql: `SELECT p1.product_name AS higher_priced_product,
       p1.unit_price AS higher_price,
       p2.product_name AS lower_priced_product,
       p2.unit_price AS lower_price
FROM products p1
INNER JOIN products p2 ON p1.category_id = p2.category_id AND p1.unit_price > p2.unit_price
ORDER BY p1.category_id, p1.unit_price DESC, p2.unit_price DESC;`
    },
    {
        id: 'q16_products_above_avg_price',
        category: 'Subqueries',
        title: 'Products Priced Above Global Average',
        description: 'Filter products whose unit_price exceeds the overall catalog average.',
        sql: `SELECT product_id,
       product_name,
       unit_price
FROM products
WHERE unit_price > (SELECT AVG(unit_price) FROM products)
ORDER BY unit_price DESC;`
    },
    {
        id: 'q17_customers_buying_electronics',
        category: 'Subqueries',
        title: 'Customers Who Purchased Electronics (Subquery IN)',
        description: 'Identifies customers with at least one non-cancelled order containing Electronics products.',
        sql: `SELECT customer_id,
       first_name,
       last_name,
       city
FROM customers
WHERE customer_id IN (
    SELECT o.customer_id
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.order_id
    INNER JOIN products p ON p.product_id = oi.product_id
    INNER JOIN categories cat ON cat.category_id = p.category_id
    WHERE cat.category_name = 'Electronics'
    AND o.order_status <> 'Cancelled'
)
ORDER BY customer_id;`
    },
    {
        id: 'q18_customers_above_avg_spend',
        category: 'Subqueries',
        title: 'High-Value Customers Exceeding Average Spend',
        description: 'Identifies VIP shoppers whose total spend surpasses the average active customer spend.',
        sql: `SELECT customer_id,
       first_name,
       last_name,
       total_orders,
       total_spent
FROM v_customer_summary
WHERE total_spent > (
    SELECT AVG(total_spent)
    FROM v_customer_summary
    WHERE total_orders > 0
)
ORDER BY total_spent DESC;`
    },
    {
        id: 'q19_balance_due_audit',
        category: 'Financial Audit',
        title: 'Order Net Amount vs Total Paid (Balance Due)',
        description: 'Audits completed payments against order net amounts to verify zero balance discrepancy.',
        sql: `SELECT t.order_id,
       t.net_amount,
       paid.amount_paid,
       ROUND(t.net_amount - paid.amount_paid, 2) AS balance_due
FROM v_order_totals t
INNER JOIN (
    SELECT order_id,
           SUM(amount) AS amount_paid
    FROM payments
    WHERE payment_status = 'Completed'
    GROUP BY order_id
) paid ON paid.order_id = t.order_id
WHERE t.order_status <> 'Cancelled'
ORDER BY t.order_id;`
    },
    {
        id: 'q20_unpaid_non_cancelled_orders',
        category: 'Financial Audit',
        title: 'Orders Without Completed Payments (NOT EXISTS)',
        description: 'Finds non-cancelled orders that lack any Completed payment transaction.',
        sql: `SELECT o.order_id,
       o.customer_id,
       o.order_date,
       o.order_status
FROM orders o
WHERE o.order_status <> 'Cancelled'
AND NOT EXISTS (
    SELECT 1
    FROM payments p
    WHERE p.order_id = o.order_id
    AND p.payment_status = 'Completed'
)
ORDER BY o.order_id;`
    },
    {
        id: 'q21_latest_order_per_customer',
        category: 'Correlated Subqueries',
        title: 'Most Recent Order for Each Customer',
        description: 'Correlated subquery finding the latest order placed by each registered customer.',
        sql: `SELECT c.customer_id,
       c.first_name,
       c.last_name,
       o.order_id,
       o.order_date,
       o.order_status
FROM customers c
INNER JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_date = (
    SELECT MAX(o2.order_date)
    FROM orders o2
    WHERE o2.customer_id = o.customer_id
)
ORDER BY c.customer_id;`
    },
    {
        id: 'q22_products_above_category_avg',
        category: 'Correlated Subqueries',
        title: 'Products Priced Above Their Category Average',
        description: 'Correlated subquery filtering products priced higher than the average price of their specific category.',
        sql: `SELECT p.product_id,
       p.product_name,
       p.category_id,
       p.unit_price
FROM products p
WHERE p.unit_price > (
    SELECT AVG(p2.unit_price)
    FROM products p2
    WHERE p2.category_id = p.category_id
)
ORDER BY p.category_id, p.unit_price DESC;`
    },
    {
        id: 'q23_delivered_never_cancelled',
        category: 'Correlated Subqueries',
        title: 'Customers with Delivered Orders and Zero Cancellations',
        description: 'Filters customers with EXISTS Delivered and NOT EXISTS Cancelled orders.',
        sql: `SELECT c.customer_id,
       c.first_name,
       c.last_name
FROM customers c
WHERE EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
    AND o.order_status = 'Delivered'
)
AND NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.customer_id
    AND o.order_status = 'Cancelled'
)
ORDER BY c.customer_id;`
    },
    {
        id: 'q24_union_failed_pending',
        category: 'Set Operations',
        title: 'Customers with Failed or Pending Payments (UNION)',
        description: 'Combines customer sets experiencing Failed and Pending payment attempts.',
        sql: `SELECT c.customer_id AS customer_id,
       c.first_name AS first_name,
       c.last_name AS last_name
FROM customers c
INNER JOIN orders o ON o.customer_id = c.customer_id
INNER JOIN payments p ON p.order_id = o.order_id
WHERE p.payment_status = 'Failed'
UNION
SELECT c.customer_id AS customer_id,
       c.first_name AS first_name,
       c.last_name AS last_name
FROM customers c
INNER JOIN orders o ON o.customer_id = c.customer_id
INNER JOIN payments p ON p.order_id = o.order_id
WHERE p.payment_status = 'Pending'
ORDER BY customer_id;`
    },
    {
        id: 'q25_intersect_electronics_kitchen',
        category: 'Set Operations',
        title: 'Customers Buying BOTH Electronics & Kitchen (INTERSECT)',
        description: 'Calculates the intersection of customers purchasing from both Electronics and Home/Kitchen.',
        sql: `SELECT customer_id,
       first_name,
       last_name
FROM v_customer_purchases
WHERE category_name = 'Electronics'
INTERSECT
SELECT customer_id,
       first_name,
       last_name
FROM v_customer_purchases
WHERE category_name = 'Home and Kitchen'
ORDER BY customer_id;`
    },
    {
        id: 'q26_except_electronics_not_kitchen',
        category: 'Set Operations',
        title: 'Customers Buying Electronics BUT NOT Kitchen (EXCEPT)',
        description: 'Calculates set difference: customers who bought Electronics items but never bought Home & Kitchen.',
        sql: `SELECT customer_id,
       first_name,
       last_name
FROM v_customer_purchases
WHERE category_name = 'Electronics'
EXCEPT
SELECT customer_id,
       first_name,
       last_name
FROM v_customer_purchases
WHERE category_name = 'Home and Kitchen'
ORDER BY customer_id;`
    },
    {
        id: 'q27_repeat_customers_having',
        category: 'Aggregations & Grouping',
        title: 'Repeat Customers (HAVING COUNT(orders) > 1)',
        description: 'Identifies loyal repeat customers who placed more than 1 non-cancelled order.',
        sql: `SELECT c.customer_id,
       c.first_name,
       c.last_name,
       COUNT(o.order_id) AS order_count
FROM customers c
INNER JOIN orders o ON o.customer_id = c.customer_id
WHERE o.order_status <> 'Cancelled'
GROUP BY c.customer_id, c.first_name, c.last_name
HAVING COUNT(o.order_id) > 1
ORDER BY order_count DESC, c.customer_id;`
    },
    {
        id: 'q28_repeat_product_purchases',
        category: 'Aggregations & Grouping',
        title: 'Products Purchased Across Multiple Orders by Same Customer',
        description: 'Finds repeat product purchases across different orders by individual customers.',
        sql: `SELECT customer_id,
       first_name,
       last_name,
       product_name,
       COUNT(DISTINCT order_id) AS times_purchased,
       SUM(quantity) AS total_quantity
FROM v_customer_purchases
GROUP BY customer_id, first_name, last_name, product_id, product_name
HAVING COUNT(DISTINCT order_id) > 1
ORDER BY times_purchased DESC, customer_id;`
    },
    {
        id: 'q29_customer_summary_view',
        category: 'Analytical Views',
        title: 'Customer Lifetime Summary (v_customer_summary)',
        description: 'Full metrics report from v_customer_summary sorted by total customer spend.',
        sql: `SELECT customer_id,
       first_name,
       last_name,
       city,
       total_orders,
       total_spent,
       first_order_date,
       last_order_date
FROM v_customer_summary
ORDER BY total_spent DESC;`
    },
    {
        id: 'q30_product_sales_view',
        category: 'Analytical Views',
        title: 'Product Performance Summary (v_product_sales)',
        description: 'Full metrics report from v_product_sales sorted by units sold and revenue.',
        sql: `SELECT product_id,
       product_name,
       category_name,
       units_sold,
       revenue
FROM v_product_sales
ORDER BY units_sold DESC, revenue DESC;`
    },
    {
        id: 'q31_window_rankings',
        category: 'Window Functions',
        title: 'Multi-Ranking Window Functions (RANK, DENSE_RANK, ROW_NUMBER)',
        description: 'Applies RANK by revenue, DENSE_RANK by units sold, and ROW_NUMBER sales position.',
        sql: `SELECT product_name,
       category_name,
       units_sold,
       revenue,
       RANK() OVER (ORDER BY revenue DESC) AS revenue_rank,
       DENSE_RANK() OVER (ORDER BY units_sold DESC) AS units_rank,
       ROW_NUMBER() OVER (ORDER BY revenue DESC, product_id) AS sales_position
FROM v_product_sales
ORDER BY revenue_rank, product_name;`
    },
    {
        id: 'q32_window_partition_category',
        category: 'Window Functions',
        title: 'Category-Partitioned Product Rankings (PARTITION BY)',
        description: 'Ranks products within each separate category partition by revenue.',
        sql: `SELECT category_name,
       product_name,
       units_sold,
       revenue,
       RANK() OVER (PARTITION BY category_name ORDER BY revenue DESC) AS category_rank
FROM v_product_sales
ORDER BY category_name, category_rank;`
    },
    {
        id: 'q33_window_cumulative_revenue',
        category: 'Window Functions',
        title: 'Cumulative Running Revenue Over Time (SUM OVER)',
        description: 'Calculates the cumulative growth of net revenue across chronological order events.',
        sql: `SELECT order_id,
       order_date,
       net_amount,
       ROUND(SUM(net_amount) OVER (ORDER BY order_date, order_id), 2) AS cumulative_revenue
FROM v_order_totals
WHERE order_status <> 'Cancelled'
ORDER BY order_date, order_id;`
    },
    {
        id: 'q34_cte_top_product_per_category',
        category: 'Common Table Expressions (CTEs)',
        title: 'Best Selling Champion Product in Each Category (CTE)',
        description: 'CTE ranking products inside categories and filtering category_position = 1.',
        sql: `WITH ranked_products AS (
    SELECT category_name,
           product_name,
           units_sold,
           revenue,
           ROW_NUMBER() OVER (PARTITION BY category_name ORDER BY revenue DESC) AS category_position
    FROM v_product_sales
)
SELECT category_name,
       product_name,
       units_sold,
       revenue
FROM ranked_products
WHERE category_position = 1
ORDER BY revenue DESC;`
    },
    {
        id: 'q35_cte_customer_spend_share',
        category: 'Common Table Expressions (CTEs)',
        title: 'Customer Spend Rank & Revenue Share % (CTE)',
        description: 'CTE computing each active customer share percentage of overall platform revenue.',
        sql: `WITH customer_spend AS (
    SELECT customer_id,
           first_name,
           last_name,
           city,
           total_orders,
           total_spent
    FROM v_customer_summary
    WHERE total_orders > 0
)
SELECT customer_id,
       first_name,
       last_name,
       city,
       total_orders,
       total_spent,
       RANK() OVER (ORDER BY total_spent DESC) AS spend_rank,
       ROUND(total_spent * 100.0 / SUM(total_spent) OVER (), 2) AS revenue_share_percent
FROM customer_spend
ORDER BY spend_rank;`
    },
    {
        id: 'q36_cte_city_sales_ranking',
        category: 'Common Table Expressions (CTEs)',
        title: 'City-wise Orders, Revenue & Rank (CTE)',
        description: 'Aggregates volume and revenue by metropolitan region and computes city rank.',
        sql: `WITH city_sales AS (
    SELECT c.city,
           COUNT(t.order_id) AS orders_placed,
           SUM(t.net_amount) AS revenue
    FROM customers c
    INNER JOIN v_order_totals t ON t.customer_id = c.customer_id
    WHERE t.order_status <> 'Cancelled'
    GROUP BY c.city
)
SELECT city,
       orders_placed,
       ROUND(revenue, 2) AS revenue,
       DENSE_RANK() OVER (ORDER BY revenue DESC) AS city_rank
FROM city_sales
ORDER BY city_rank, city;`
    },
    {
        id: 'q37_data_integrity_audit',
        category: 'Data Integrity & Audit',
        title: 'Platform Integrity Audit (5 Checks in 1)',
        description: 'Verifies orphan orders, payment amount discrepancies, expired discount usage, delivery date logic, and negative inventory.',
        sql: `SELECT 'Orphan Orders (No Items)' AS check_name, COUNT(*) AS anomaly_count
FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.order_id WHERE oi.order_id IS NULL
UNION ALL
SELECT 'Payment Amount Mismatches', COUNT(*)
FROM payments p INNER JOIN v_order_totals t ON t.order_id = p.order_id WHERE ABS(p.amount - t.net_amount) > 0.05
UNION ALL
SELECT 'Orders with Expired Coupon', COUNT(*)
FROM orders o INNER JOIN discounts d ON d.discount_id = o.discount_id WHERE o.order_date < d.valid_from OR o.order_date > d.valid_to
UNION ALL
SELECT 'Delivery Date Anomalies', COUNT(*)
FROM deliveries WHERE (delivery_status = 'Delivered' AND delivered_date IS NULL) OR (delivery_status = 'In Transit' AND delivered_date IS NOT NULL)
UNION ALL
SELECT 'Negative Inventory Stock', COUNT(*)
FROM inventory WHERE stock_quantity < 0;`
    },
    {
        id: 'q38_table_row_counts',
        category: 'Data Integrity & Audit',
        title: 'Database Table Row Counts',
        description: 'Audits the exact row count in all 9 relational entities.',
        sql: `SELECT 'customers' AS table_name, COUNT(*) AS row_count FROM customers
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'discounts', COUNT(*) FROM discounts
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'deliveries', COUNT(*) FROM deliveries;`
    }
];
