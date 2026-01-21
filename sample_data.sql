USE ecommerce_db;

-- Insert Sample Products
INSERT INTO products (name, description, price, category, image_url, stock_quantity) VALUES
('iPhone 13 Pro', 'Latest Apple smartphone with A15 Bionic chip and Pro camera system', 999.99, 'Electronics', 'https://images.unsplash.com/photo-1632661674596-df8be070a6c5?w=300&h=300&fit=crop', 50),
('Samsung 4K Smart TV', '55 inch 4K UHD Smart TV with HDR and Streaming Apps', 699.99, 'Electronics', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=300&fit=crop', 30),
('Nike Air Max 270', 'Running shoes with Air Max cushioning and breathable mesh', 129.99, 'Fashion', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop', 100),
('MacBook Pro 14"', 'Apple MacBook Pro with M1 Pro chip, 16GB RAM, 512GB SSD', 1999.99, 'Electronics', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop', 25),
('Sony WH-1000XM4', 'Wireless noise-cancelling headphones with 30-hour battery', 299.99, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', 75),
('Leather Jacket', 'Genuine leather jacket for men with zip closure', 189.99, 'Fashion', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop', 40),
('Dyson V11 Vacuum', 'Cordless vacuum cleaner with powerful suction', 499.99, 'Home', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop', 20),
('Instant Pot Duo', '7-in-1 Electric Pressure Cooker, Slow Cooker', 89.99, 'Home', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop', 60),
('Yoga Mat Premium', 'Non-slip exercise mat with carrying strap', 29.99, 'Sports', 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=300&h=300&fit=crop', 150),
('Water Bottle 1L', 'Stainless steel insulated water bottle', 24.99, 'Sports', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300&h=300&fit=crop', 200),
('Wireless Keyboard', 'Mechanical wireless keyboard with RGB lighting', 79.99, 'Electronics', 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=300&fit=crop', 80),
('Gaming Mouse', 'RGB gaming mouse with 16000 DPI sensor', 49.99, 'Electronics', 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=300&h=300&fit=crop', 120);

-- Insert Sample User (password: password123)
INSERT INTO users (name, email, password) VALUES 
('John Doe', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); -- password123