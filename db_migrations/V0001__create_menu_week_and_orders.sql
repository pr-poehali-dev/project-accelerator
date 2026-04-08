
CREATE TABLE IF NOT EXISTS menu_week (
  id SERIAL PRIMARY KEY,
  week_date DATE NOT NULL,
  day_of_week VARCHAR(20) NOT NULL,
  standard_dish TEXT NOT NULL DEFAULT '',
  standard_plus_dish TEXT NOT NULL DEFAULT '',
  premium_dish TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('standard', 'standard_plus', 'premium')),
  price INTEGER NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
