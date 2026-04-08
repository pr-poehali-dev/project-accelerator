import json
import os
import psycopg2
from datetime import date

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Управление заказами обедов: создание, получение, редактирование и удаление заказов."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()
    method = event.get('httpMethod')
    params = event.get('queryStringParameters') or {}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        full_name = body.get('full_name', '').strip()
        plan = body.get('plan', '')

        prices = {'standard': 350, 'standard_plus': 450, 'premium': 650}
        if not full_name or plan not in prices:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверные данные'})}

        price = prices[plan]
        order_date = body.get('order_date') or date.today().isoformat()

        cur.execute(
            "INSERT INTO orders (full_name, plan, price, order_date) VALUES (%s, %s, %s, %s) RETURNING id",
            (full_name, plan, price, order_date)
        )
        order_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'id': order_id, 'success': True})}

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        order_id = body.get('id')
        full_name = body.get('full_name', '').strip()
        plan = body.get('plan', '')

        prices = {'standard': 350, 'standard_plus': 450, 'premium': 650}
        if not order_id or not full_name or plan not in prices:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверные данные'})}

        price = prices[plan]
        cur.execute(
            "UPDATE orders SET full_name=%s, plan=%s, price=%s WHERE id=%s",
            (full_name, plan, price, order_id)
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

    if method == 'DELETE':
        order_id = params.get('id')
        if not order_id:
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Не указан id'})}

        cur.execute("DELETE FROM orders WHERE id=%s", (order_id,))
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

    if method == 'GET':
        cur.execute("""
            SELECT id, full_name, plan, price, order_date, created_at
            FROM orders
            ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        conn.close()

        plan_labels = {'standard': 'Стандарт', 'standard_plus': 'Стандарт+', 'premium': 'Премиум'}
        orders = []
        for row in rows:
            orders.append({
                'id': row[0],
                'full_name': row[1],
                'plan': row[2],
                'plan_label': plan_labels.get(row[2], row[2]),
                'price': row[3],
                'order_date': str(row[4]),
                'created_at': str(row[5])
            })

        counts = {'standard': 0, 'standard_plus': 0, 'premium': 0}
        for o in orders:
            if o['plan'] in counts:
                counts[o['plan']] += 1

        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'orders': orders, 'counts': counts})}

    conn.close()
    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}