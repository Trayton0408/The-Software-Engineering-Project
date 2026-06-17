const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'cafeteria.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Initialization connection error:", err.message);
        return;
    }
    console.log("Database initialized successfully.");
});

db.serialize(() => {
    db.run("DROP TABLE IF EXISTS menu");
    db.run(`CREATE TABLE IF NOT EXISTS menu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        calories INTEGER DEFAULT 0,
        protein INTEGER DEFAULT 0,
        carbs INTEGER DEFAULT 0,
        fats INTEGER DEFAULT 0,
        is_in_stock INTEGER DEFAULT 1
    )`);

    const stmt = db.prepare(`INSERT INTO menu 
        (name, category, price, description, calories, protein, carbs, fats, is_in_stock) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    // 10 Hot Foods & Snacks from the Canteen Menu
    stmt.run("Chicken Caesar Salad", "Food", 8.30, "Premium sliced chicken, crisp lettuce, crunchy croutons, boiled egg, parmesan cheese, and creamy Caesar dressing.", 420, 32, 12, 26, 1);
    stmt.run("Sweet Chilli Chicken Wrap", "Food", 7.80, "Tender chicken strips with fresh lettuce and a sweet chilli mayonnaise drizzle wrapped in a soft tortilla.", 460, 24, 48, 16, 1);
    stmt.run("Butter Chicken & Rice", "Food", 8.10, "A classic cafeteria favourite. Mildly spiced, creamy butter chicken curry served over a bed of fluffy white rice. Gluten Free.", 580, 28, 72, 18, 1);
    stmt.run("Fried Rice", "Food", 8.10, "Authentic wok-tossed seasoned rice with mixed vegetables. Vegetarian and Gluten Free.", 380, 8, 65, 7, 1);
    stmt.run("Pepperoni & Cheese Pizza", "Food", 6.40, "Classic homemade pizza crust loaded with rich tomato sauce, melted mozzarella, and savory pepperoni slices.", 490, 22, 54, 19, 1);
    stmt.run("Sausage Roll King", "Snacks", 6.60, "An extra-large, premium seasoned sausage meat filling wrapped in golden, flaky puff pastry.", 510, 15, 38, 31, 1);
    stmt.run("Beef & Cheese Burger", "Food", 7.10, "Grilled beef patty topped with a slice of melted cheese and fresh tomato sauce on a soft bun.", 530, 29, 42, 22, 1);
    stmt.run("Doner Kebab Meat & Salad", "Food", 9.50, "Shaved seasoned kebab meat served with a crisp side salad consisting of lettuce, tomato, and onion.", 610, 42, 14, 38, 1);
    stmt.run("Chocolate Mousse", "Snacks", 3.20, "A light, fluffy, and decadent whipped chocolate dessert cup. Gluten Free.", 210, 4, 24, 11, 1);

    // 5 Beverage Items from the Canteen Menu
    stmt.run("Popper Juice", "Drinks", 2.90, "Convenient fruit juice carton box, a daily lunchtime staple.", 110, 1, 26, 0, 1);
    stmt.run("Pump Water", "Drinks", 6.00, "Pure, crisp bottled spring water with a sports cap for hydration.", 0, 0, 0, 0, 1);
    stmt.run("Oak Milk Regular", "Drinks", 3.80, "Classic rich, flavoured dairy milk chocolate option providing high protein.", 260, 11, 34, 7, 1);
    stmt.run("Oak Milk Large", "Drinks", 5.80, "Large sized rich flavoured dairy milk bottle for the ultimate hunger bust.", 410, 18, 55, 11, 1);
    stmt.run("Soft Drink Can No Sugar", "Drinks", 3.70, "Chilled zero-sugar fizzy soft drink option providing crisp carbonated taste.", 0, 0, 0, 0, 1);

    stmt.finalize();
    console.log("Verified canteen assets populated.");
});

db.close();