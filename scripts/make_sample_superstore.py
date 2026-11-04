"""Sinh bộ dữ liệu mẫu giống cấu trúc Superstore (dữ liệu giả lập, không phải file gốc của Tableau).

Dùng tạm cho bản khung để tránh vấn đề bản quyền. Có cài sẵn vài lỗi data quality
(1 dòng trùng, 1 Product ID gắn 2 tên) để dùng cho bài Phase 2.
Chạy: python scripts/make_sample_superstore.py
"""
import csv
import random
from datetime import date, timedelta

random.seed(42)

REGIONS = {"East": ["New York", "Boston", "Philadelphia"], "West": ["Los Angeles", "Seattle", "San Francisco"],
           "Central": ["Chicago", "Houston", "Dallas"], "South": ["Atlanta", "Miami", "Nashville"]}
SEGMENTS = ["Consumer", "Corporate", "Home Office"]
PRODUCTS = [
    ("FUR-CH-001", "Furniture", "Chairs", "Ergonomic Office Chair", 180.0),
    ("FUR-TA-002", "Furniture", "Tables", "Conference Table", 520.0),
    ("FUR-BO-003", "Furniture", "Bookcases", "Wooden Bookcase", 240.0),
    ("OFF-PA-004", "Office Supplies", "Paper", "Copy Paper A4", 12.0),
    ("OFF-BI-005", "Office Supplies", "Binders", "Ring Binder", 8.5),
    ("OFF-ST-006", "Office Supplies", "Storage", "Storage Box", 35.0),
    ("OFF-AR-007", "Office Supplies", "Art", "Marker Set", 6.0),
    ("TEC-PH-008", "Technology", "Phones", "Smartphone X", 650.0),
    ("TEC-AC-009", "Technology", "Accessories", "Wireless Mouse", 25.0),
    ("TEC-MA-010", "Technology", "Machines", "Laser Printer", 410.0),
]
customers = [(f"CU-{i:04d}", f"Customer {i}", random.choice(SEGMENTS)) for i in range(1, 301)]

rows = []
row_id = 1
start = date(2023, 1, 1)
for order_no in range(1, 1201):
    cust = random.choice(customers)
    region = random.choice(list(REGIONS))
    city = random.choice(REGIONS[region])
    # mùa vụ: tháng 11-12 nhiều đơn hơn
    while True:
        d = start + timedelta(days=random.randrange(0, 365 * 3))
        if d.month >= 11 or random.random() < 0.7:
            break
    ship = d + timedelta(days=random.randint(1, 6))
    order_id = f"OR-{d.year}-{order_no:05d}"
    for _ in range(random.randint(1, 4)):
        pid, cat, sub, name, price = random.choice(PRODUCTS)
        qty = random.randint(1, 8)
        discount = random.choice([0, 0, 0, 0.1, 0.2, 0.3, 0.5])
        sales = round(price * qty * (1 - discount) * random.uniform(0.9, 1.1), 2)
        margin = random.uniform(0.15, 0.35) - discount * 0.9
        profit = round(sales * margin, 2)
        rows.append([row_id, order_id, d.isoformat(), ship.isoformat(), cust[0], cust[1], cust[2],
                     region, city, pid, cat, sub, name, sales, qty, discount, profit])
        row_id += 1

# Lỗi cài sẵn cho bài data quality
rows.append(rows[10][:])            # 1 dòng trùng hoàn toàn
rows[25][12] = "Ergonomic Chair v2" if rows[25][9] == "FUR-CH-001" else rows[25][12] + " (old)"  # 1 Product ID có 2 tên

header = ["Row ID", "Order ID", "Order Date", "Ship Date", "Customer ID", "Customer Name", "Segment",
          "Region", "City", "Product ID", "Category", "Sub-Category", "Product Name", "Sales", "Quantity",
          "Discount", "Profit"]
with open("public/datasets/superstore_sample.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(header)
    w.writerows(rows)
print(len(rows), "rows")
