import json
import os
import psycopg2
from datetime import date, timedelta

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_week_dates():
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    return [(monday + timedelta(days=i), days[i]) for i in range(7)]

def handler(event: dict, context) -> dict:
    """Управление меню на неделю: получение и обновление блюд для каждого тарифа."""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    conn = get_conn()
    cur = conn.cursor()
    week_dates = get_week_dates()

    if event.get('httpMethod') == 'GET':
        result = []
        for week_date, day_name in week_dates:
            cur.execute(
                "SELECT standard_dish, standard_plus_dish, premium_dish FROM menu_week WHERE week_date = %s",
                (week_date.isoformat(),)
            )
            row = cur.fetchone()
            result.append({
                'date': week_date.isoformat(),
                'day': day_name,
                'standard': row[0] if row else '',
                'standard_plus': row[1] if row else '',
                'premium': row[2] if row else ''
            })
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'menu': result})}

    if event.get('httpMethod') == 'POST':
        body = json.loads(event.get('body') or '{}')
        menu_items = body.get('menu', [])

        for item in menu_items:
            item_date = item.get('date')
            standard = item.get('standard', '')
            standard_plus = item.get('standard_plus', '')
            premium = item.get('premium', '')

            cur.execute("SELECT id FROM menu_week WHERE week_date = %s", (item_date,))
            existing = cur.fetchone()
            if existing:
                cur.execute(
                    "UPDATE menu_week SET standard_dish=%s, standard_plus_dish=%s, premium_dish=%s, updated_at=NOW() WHERE week_date=%s",
                    (standard, standard_plus, premium, item_date)
                )
            else:
                day_name = next((d for dt, d in week_dates if dt.isoformat() == item_date), '')
                cur.execute(
                    "INSERT INTO menu_week (week_date, day_of_week, standard_dish, standard_plus_dish, premium_dish) VALUES (%s, %s, %s, %s, %s)",
                    (item_date, day_name, standard, standard_plus, premium)
                )

        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

    conn.close()
    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}